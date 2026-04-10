#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod pdf_runtime;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use pdf_runtime::{
    extract_pdf_document, extract_pdf_document_payload, pdf_bootstrap_runtime, pdf_hybrid_start,
    pdf_hybrid_stop, pdf_runtime_status, read_pdf_file_info, PdfRuntimeState,
};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWriteExt};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;

#[derive(Clone)]
struct GeminiRunState {
    active_pid: Arc<Mutex<Option<u32>>>,
    cancelled: Arc<AtomicBool>,
}

impl Default for GeminiRunState {
    fn default() -> Self {
        Self {
            active_pid: Arc::new(Mutex::new(None)),
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl GeminiRunState {
    fn clear_run_flags(&self) {
        self.cancelled.store(false, Ordering::SeqCst);
    }
}

fn kill_pid(pid: u32) -> std::io::Result<()> {
    #[cfg(unix)]
    {
        let status = Command::new("kill")
            .args(["-9", &pid.to_string()])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()?;
        if status.success() {
            Ok(())
        } else {
            Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("kill cikis kodu: {status}"),
            ))
        }
    }
    #[cfg(windows)]
    {
        let status = Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()?;
        if status.success() || status.code() == Some(128) {
            Ok(())
        } else {
            Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("taskkill cikis kodu: {status}"),
            ))
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCliStatus {
    installed: bool,
    version: Option<String>,
    is_dev_build: bool,
    is_authenticated: bool,
    is_headless_ready: bool,
    status_message: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCliRequest {
    model: String,
    prompt: String,
    stdin_content: Option<String>,
    response_mode: String,
    timeout_secs: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct GeminiCliEnvelope {
    response: Option<String>,
    error: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ReadPdfFileResponse {
    base64: String,
    file_name: String,
}

const ALLOWED_GEMINI_MODELS: &[&str] = &[
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
];
const GEMINI_DEFAULT_TIMEOUT_SECS: u64 = 300;
const GEMINI_MIN_TIMEOUT_SECS: u64 = 15;
const GEMINI_MAX_TIMEOUT_SECS: u64 = 900;
const GEMINI_MAX_OUTPUT_BYTES: usize = 4 * 1024 * 1024;
const GEMINI_STDIN_PROMPT_PREFIX: &str = "Prompt:\n";
const GEMINI_STDIN_CONTEXT_PREFIX: &str = "\n\nContext:\n";

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn truncate_for_log(value: &str, max_chars: usize) -> String {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let mut out = String::new();
    for (idx, ch) in trimmed.chars().enumerate() {
        if idx >= max_chars {
            out.push_str("...");
            break;
        }
        out.push(ch);
    }
    out
}

fn log_gemini_event(stage: &str, level: &str, payload: serde_json::Value) {
    eprintln!(
        "{}",
        serde_json::json!({
            "source": "gemini.cli",
            "stage": stage,
            "level": level,
            "timestamp": now_millis(),
            "meta": payload,
        })
    );
}

fn build_augmented_windows_path() -> Option<String> {
    if !cfg!(target_os = "windows") {
        return None;
    }

    let mut path_parts: Vec<String> = std::env::var("PATH")
        .unwrap_or_default()
        .split(';')
        .filter(|part| !part.trim().is_empty())
        .map(|part| part.to_string())
        .collect();
    if let Ok(appdata) = std::env::var("APPDATA") {
        path_parts.push(format!("{appdata}\\npm"));
    }
    if let Ok(program_files) = std::env::var("ProgramFiles") {
        path_parts.push(format!("{program_files}\\nodejs"));
    }
    if let Ok(program_files_x86) = std::env::var("ProgramFiles(x86)") {
        path_parts.push(format!("{program_files_x86}\\nodejs"));
    }
    Some(path_parts.join(";"))
}

fn apply_windows_path(command: &mut Command) {
    if let Some(path) = build_augmented_windows_path() {
        command.env("PATH", path);
    }
}

fn apply_windows_path_tokio(command: &mut TokioCommand) {
    if let Some(path) = build_augmented_windows_path() {
        command.env("PATH", path);
    }
}

fn gemini_working_dir() -> Result<PathBuf, String> {
    let dir = std::env::temp_dir().join("quizlab-med-gemini-headless");
    std::fs::create_dir_all(&dir).map_err(|e| format!("Geçici Gemini dizini oluşturulamadı: {e}"))?;
    Ok(dir)
}

fn check_global_gemini_version() -> (bool, Option<String>) {
    let candidates: &[&str] = if cfg!(target_os = "windows") {
        &["gemini", "gemini.cmd"]
    } else {
        &["gemini"]
    };

    for program in candidates {
        let mut command = Command::new(program);
        command.arg("--version").stdout(Stdio::piped()).stderr(Stdio::piped());
        apply_windows_path(&mut command);

        if let Ok(output) = command.output() {
            if output.status.success() {
                let mut version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if version.is_empty() {
                    version = String::from_utf8_lossy(&output.stderr).trim().to_string();
                }
                let short_version: String = version.chars().take(120).collect();
                return (
                    true,
                    if short_version.is_empty() {
                        None
                    } else {
                        Some(short_version)
                    },
                );
            }
        }
    }

    (false, None)
}

fn extract_first_json_object_slice(content: &str) -> Result<&str, String> {
    let mut start_index: Option<usize> = None;
    let mut depth: i32 = 0;
    let mut in_string = false;
    let mut escaped = false;

    for (idx, ch) in content.char_indices() {
        if in_string {
            if escaped {
                escaped = false;
                continue;
            }
            if ch == '\\' {
                escaped = true;
            } else if ch == '"' {
                in_string = false;
            }
            continue;
        }

        if ch == '"' {
            in_string = true;
            continue;
        }

        if ch == '{' {
            if start_index.is_none() {
                start_index = Some(idx);
            }
            depth += 1;
        } else if ch == '}' {
            if depth == 0 {
                continue;
            }
            depth -= 1;
            if depth == 0 {
                if let Some(start) = start_index {
                    return Ok(&content[start..=idx]);
                }
            }
        }
    }

    if start_index.is_none() {
        return Err("Gemini CLI çıktısında JSON başlangıcı bulunamadı.".to_string());
    }
    Err("Gemini CLI çıktısında JSON nesnesi tamamlanamadı.".to_string())
}

fn looks_like_auth_error(message: &str) -> bool {
    let lowercase = message.to_ascii_lowercase();
    lowercase.contains("login")
        || lowercase.contains("sign in")
        || lowercase.contains("authenticate")
        || lowercase.contains("credential")
        || lowercase.contains("api key")
        || lowercase.contains("oauth")
}

fn parse_json_response(stdout: &str) -> Result<String, String> {
    let trimmed = stdout.trim();
    let parsed = match serde_json::from_str::<GeminiCliEnvelope>(trimmed) {
        Ok(parsed) => parsed,
        Err(_) => {
            let json_slice = extract_first_json_object_slice(trimmed)?;
            serde_json::from_str::<GeminiCliEnvelope>(json_slice)
                .map_err(|e| format!("Gemini CLI JSON çıktısı okunamadı: {e}"))?
        }
    };

    if let Some(error) = parsed.error {
        return Err(format!("Gemini CLI hata alani: {error}"));
    }

    parsed
        .response
        .map(|response| response.trim().to_string())
        .filter(|response| !response.is_empty())
        .ok_or_else(|| "Gemini CLI yanitinda `response` alani bos.".to_string())
}

fn run_global_headless_smoke_test() -> Result<(), String> {
    let working_dir = gemini_working_dir()?;
    let mut command = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        cmd.arg("/C").arg("gemini.cmd");
        cmd
    } else {
        Command::new("gemini")
    };

    command
        .current_dir(&working_dir)
        .args([
            "--prompt",
            "Reply with OK only.",
            "--approval-mode",
            "plan",
            "--output-format",
            "json",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    apply_windows_path(&mut command);

    let output = command
        .output()
        .map_err(|e| format!("Gemini CLI smoke test başlatılamadı: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(if stderr.trim().is_empty() {
            stdout.trim().to_string()
        } else {
            stderr.trim().to_string()
        });
    }

    let response = parse_json_response(&stdout)?;
    if response.trim() == "OK" {
        Ok(())
    } else {
        Err(format!("Beklenmeyen smoke test yanıtı: {response}"))
    }
}

#[cfg(target_os = "windows")]
fn spawn_windows_cmd_k(title: &str, cmd_k_body: &str) -> Result<(), String> {
    Command::new("cmd")
        .args(["/C", "start", title, "cmd", "/K", cmd_k_body])
        .spawn()
        .map_err(|e| format!("CMD başlatılamadı: {e}"))?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn spawn_dev_gemini_instructions_cmd() -> Result<(), String> {
    let body = "echo Gemini CLI kurulumu: & echo npm install -g @google/gemini-cli@latest & echo gemini & echo. & echo İlk açılışta giriş akışını tamamlayın. & pause";
    spawn_windows_cmd_k("QuizLab Gemini", body)
}

#[cfg(not(target_os = "windows"))]
fn spawn_dev_gemini_instructions_cmd() -> Result<(), String> {
    Command::new("sh")
        .arg("-c")
        .arg(
            "printf '%s\\n' 'Gemini CLI kurulumu:' '  npm install -g @google/gemini-cli@latest' '  gemini' '' 'İlk açılışta giriş akışlarını tamamlayın.' '' 'Devam etmek için Enter...'; read -r _",
        )
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Terminal başlatılamadı: {e}"))?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn spawn_release_gemini_setup_cmd(installed: bool) -> Result<(), String> {
    let body = if installed {
        "gemini"
    } else {
        "npm install -g @google/gemini-cli@latest && gemini"
    };
    let body_with_pause = format!("{body} & pause");
    spawn_windows_cmd_k("QuizLab Gemini", &body_with_pause)
}

#[cfg(not(target_os = "windows"))]
fn spawn_release_gemini_setup_cmd(installed: bool) -> Result<(), String> {
    let body = if installed {
        "gemini"
    } else {
        "npm install -g @google/gemini-cli@latest && gemini"
    };
    Command::new("sh")
        .arg("-c")
        .arg(body)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Kurulum başlatılamadı: {e}"))?;
    Ok(())
}

fn run_gemini_cli_setup_action() -> Result<(), String> {
    if cfg!(debug_assertions) {
        return spawn_dev_gemini_instructions_cmd();
    }

    let (installed, _) = check_global_gemini_version();
    spawn_release_gemini_setup_cmd(installed)
}

async fn spawn_gemini_process(
    model: &str,
    prompt: &str,
    output_format: &str,
    working_dir: &Path,
) -> Result<tokio::process::Child, std::io::Error> {
    let safe_prompt = if prompt.trim().is_empty() {
        "Follow stdin instructions."
    } else {
        prompt.trim()
    };
    let mut args = vec![
        "--prompt".to_string(),
        safe_prompt.to_string(),
        "--approval-mode".to_string(),
        "plan".to_string(),
        "--output-format".to_string(),
        output_format.to_string(),
    ];
    if !model.trim().is_empty() {
        args.push("--model".to_string());
        args.push(model.trim().to_string());
    }

    let mut attempts: Vec<(String, Vec<String>)> = if cfg!(target_os = "windows") {
        let mut candidates = vec![("gemini".to_string(), vec![]), ("gemini.cmd".to_string(), vec![])];
        if let Ok(appdata) = std::env::var("APPDATA") {
            candidates.push((format!("{appdata}\\npm\\gemini.cmd"), vec![]));
        }
        candidates
    } else {
        vec![("gemini".to_string(), vec![])]
    };

    let mut last_error: Option<std::io::Error> = None;

    for (program, prefix) in attempts.drain(..) {
        let mut command = if cfg!(target_os = "windows") && program.ends_with(".cmd") {
            let mut cmd = TokioCommand::new("cmd");
            cmd.arg("/C").arg(&program);
            for value in &prefix {
                cmd.arg(value);
            }
            cmd
        } else {
            let mut cmd = TokioCommand::new(&program);
            for value in &prefix {
                cmd.arg(value);
            }
            cmd
        };

        if cfg!(target_os = "windows") {
            apply_windows_path_tokio(&mut command);
        }

        command
            .current_dir(working_dir)
            .args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        match command.spawn() {
            Ok(child) => return Ok(child),
            Err(error) => last_error = Some(error),
        }
    }

    Err(last_error.unwrap_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "gemini komutu bulunamadı")
    }))
}

async fn child_wait_with_output_like(
    child: &mut tokio::process::Child,
) -> std::io::Result<std::process::Output> {
    async fn read_pipe_to_end_limited<A: AsyncRead + Unpin>(
        pipe: &mut Option<A>,
        label: &str,
    ) -> std::io::Result<Vec<u8>> {
        let mut buffer = Vec::new();
        if let Some(io) = pipe.as_mut() {
            let mut chunk = [0u8; 8192];
            loop {
                let read = io.read(&mut chunk).await?;
                if read == 0 {
                    break;
                }
                if buffer.len().saturating_add(read) > GEMINI_MAX_OUTPUT_BYTES {
                    return Err(std::io::Error::new(
                        std::io::ErrorKind::InvalidData,
                        format!(
                            "Gemini CLI {label} çıktısı {} byte sınırını aştı.",
                            GEMINI_MAX_OUTPUT_BYTES
                        ),
                    ));
                }
                buffer.extend_from_slice(&chunk[..read]);
            }
        }
        Ok(buffer)
    }

    let mut stdout_pipe = child.stdout.take();
    let mut stderr_pipe = child.stderr.take();

    let stdout_future = read_pipe_to_end_limited(&mut stdout_pipe, "stdout");
    let stderr_future = read_pipe_to_end_limited(&mut stderr_pipe, "stderr");
    let (status, stdout, stderr) = tokio::try_join!(child.wait(), stdout_future, stderr_future)?;

    Ok(std::process::Output { status, stdout, stderr })
}

async fn run_gemini_cli(state: &GeminiRunState, request: GeminiCliRequest) -> Result<String, String> {
    let timeout_secs = request
        .timeout_secs
        .unwrap_or(GEMINI_DEFAULT_TIMEOUT_SECS)
        .clamp(GEMINI_MIN_TIMEOUT_SECS, GEMINI_MAX_TIMEOUT_SECS);
    let model = request.model.trim();
    if model.is_empty() {
        return Err("Model adi bos.".to_string());
    }
    if !ALLOWED_GEMINI_MODELS.contains(&model) {
        return Err("Gecersiz model adi.".to_string());
    }

    let prompt = request.prompt.trim();
    let stdin_content = request.stdin_content.unwrap_or_default();
    if prompt.is_empty() && stdin_content.trim().is_empty() {
        return Err("Prompt ve stdin icerigi bos.".to_string());
    }

    let response_mode = match request.response_mode.trim() {
        "json" => "json",
        "text" => "text",
        _ => return Err("Gecersiz response mode.".to_string()),
    };

    let started_at = Instant::now();
    let working_dir = gemini_working_dir()?;
    let stdin_payload = format!(
        "{GEMINI_STDIN_PROMPT_PREFIX}{prompt}{GEMINI_STDIN_CONTEXT_PREFIX}{}",
        stdin_content.trim()
    );
    log_gemini_event(
        "run.start",
        "info",
        serde_json::json!({
            "model": model,
            "responseMode": response_mode,
            "timeoutSecs": timeout_secs,
            "promptPreview": truncate_for_log(prompt, 120),
            "stdinChars": stdin_payload.chars().count(),
        }),
    );
    let mut child = spawn_gemini_process(model, prompt, response_mode, &working_dir)
        .await
        .map_err(|e| {
            format!("Gemini CLI başlatılamadı. Kurulum: npm i -g @google/gemini-cli. Hata: {e}")
        })?;

    if let Some(mut stdin) = child.stdin.take() {
        let trimmed_stdin = stdin_payload.trim();
        if !trimmed_stdin.is_empty() {
            stdin
                .write_all(trimmed_stdin.as_bytes())
                .await
                .map_err(|e| format!("stdin yazılamadı: {e}"))?;
        }
        stdin
            .shutdown()
            .await
            .map_err(|e| format!("stdin kapatılamadı: {e}"))?;
    }

    if let Some(pid) = child.id() {
        *state.active_pid.lock().await = Some(pid);
    }

    let output = match tokio::time::timeout(
        Duration::from_secs(timeout_secs),
        child_wait_with_output_like(&mut child),
    )
    .await
    {
        Ok(Ok(output)) => output,
        Ok(Err(error)) => {
            log_gemini_event(
                "run.failure",
                "error",
                serde_json::json!({
                    "kind": "wait_error",
                    "elapsedMs": started_at.elapsed().as_millis(),
                    "message": error.to_string()
                }),
            );
            return Err(format!("Gemini CLI bekleme hatasi: {error}"));
        }
        Err(_) => {
            if let Err(error) = child.kill().await {
                log_gemini_event(
                    "run.failure",
                    "error",
                    serde_json::json!({
                        "kind": "timeout_kill_error",
                        "timeoutSecs": timeout_secs,
                        "elapsedMs": started_at.elapsed().as_millis(),
                        "message": error.to_string(),
                    }),
                );
                return Err(format!(
                    "Gemini CLI {timeout_secs} saniye zaman aşımına uğradı ve sonlandırılamadı: {error}"
                ));
            }
            log_gemini_event(
                "run.failure",
                "error",
                serde_json::json!({
                    "kind": "timeout",
                    "timeoutSecs": timeout_secs,
                    "elapsedMs": started_at.elapsed().as_millis(),
                }),
            );
            return Err(format!(
                "Gemini CLI {timeout_secs} saniye içinde tamamlanmadı; süreç zorla sonlandırıldı."
            ));
        }
    };

    if state.cancelled.load(Ordering::SeqCst) {
        log_gemini_event(
            "run.cancelled",
            "info",
            serde_json::json!({
                "elapsedMs": started_at.elapsed().as_millis(),
            }),
        );
        return Err("Gemini CLI çalışması kullanıcı tarafından iptal edildi.".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        let message = if stderr.trim().is_empty() {
            stdout.trim().to_string()
        } else {
            stderr.trim().to_string()
        };
        log_gemini_event(
            "run.failure",
            "error",
            serde_json::json!({
                "kind": "exit_nonzero",
                "elapsedMs": started_at.elapsed().as_millis(),
                "exitCode": output.status.code(),
                "stdoutPreview": truncate_for_log(&stdout, 240),
                "stderrPreview": truncate_for_log(&stderr, 240),
            }),
        );
        return Err(message);
    }

    if response_mode == "json" {
        let parsed = parse_json_response(&stdout);
        if let Err(error) = &parsed {
            log_gemini_event(
                "run.failure",
                "error",
                serde_json::json!({
                    "kind": "json_parse_error",
                    "elapsedMs": started_at.elapsed().as_millis(),
                    "stdoutPreview": truncate_for_log(&stdout, 240),
                    "message": error,
                }),
            );
        } else {
            log_gemini_event(
                "run.success",
                "success",
                serde_json::json!({
                    "responseMode": "json",
                    "elapsedMs": started_at.elapsed().as_millis(),
                    "stdoutBytes": output.stdout.len(),
                    "stderrBytes": output.stderr.len(),
                }),
            );
        }
        return parsed;
    }

    let text_output = stdout.trim().to_string();
    if text_output.is_empty() {
        return Err("Gemini CLI metin yaniti bos dondu.".to_string());
    }
    log_gemini_event(
        "run.success",
        "success",
        serde_json::json!({
            "responseMode": "text",
            "elapsedMs": started_at.elapsed().as_millis(),
            "stdoutBytes": output.stdout.len(),
            "stderrBytes": output.stderr.len(),
        }),
    );
    Ok(text_output)
}

#[tauri::command]
fn read_pdf_file_base64(path: String) -> Result<ReadPdfFileResponse, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("PDF yolu boş.".to_string());
    }

    let file_path = Path::new(trimmed);
    let extension = file_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_default();
    if extension != "pdf" {
        return Err("Sadece .pdf dosyaları desteklenir.".to_string());
    }

    let bytes = std::fs::read(file_path).map_err(|e| format!("PDF okunamadı: {e}"))?;
    let file_name = file_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("document.pdf")
        .to_string();

    Ok(ReadPdfFileResponse {
        base64: STANDARD.encode(bytes),
        file_name,
    })
}

#[tauri::command]
async fn gemini_run(
    state: tauri::State<'_, GeminiRunState>,
    req: GeminiCliRequest,
) -> Result<String, String> {
    state.clear_run_flags();
    let result = run_gemini_cli(&*state, req).await;
    *state.active_pid.lock().await = None;
    result
}

#[tauri::command]
async fn abort_gemini_run(state: tauri::State<'_, GeminiRunState>) -> Result<(), String> {
    let pid = state.active_pid.lock().await.take();
    if let Some(pid) = pid {
        state.cancelled.store(true, Ordering::SeqCst);
        kill_pid(pid).map_err(|e| format!("Gemini süreci sonlandırılamadı: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
async fn gemini_cli_status() -> Result<GeminiCliStatus, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let (installed, version) = check_global_gemini_version();
        if !installed {
            return GeminiCliStatus {
                installed,
                version,
                is_dev_build: cfg!(debug_assertions),
                is_authenticated: false,
                is_headless_ready: false,
                status_message: Some("Gemini CLI bulunamadı.".to_string()),
            };
        }

        match run_global_headless_smoke_test() {
            Ok(()) => GeminiCliStatus {
                installed: true,
                version,
                is_dev_build: cfg!(debug_assertions),
                is_authenticated: true,
                is_headless_ready: true,
                status_message: Some("Headless kontrol basarili.".to_string()),
            },
            Err(message) => GeminiCliStatus {
                installed: true,
                version,
                is_dev_build: cfg!(debug_assertions),
                is_authenticated: !looks_like_auth_error(&message),
                is_headless_ready: false,
                status_message: Some(message),
            },
        }
    })
    .await
    .map_err(|e| format!("Durum okunamadı: {e}"))
}

#[tauri::command]
async fn gemini_cli_setup_action() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(run_gemini_cli_setup_action)
        .await
        .map_err(|e| format!("Kurulum işlemi sonlandı: {e}"))?
}

#[tauri::command]
fn save_quiz_pdf(default_name: String, pdf_base64: String) -> Result<Option<String>, String> {
    let bytes = STANDARD
        .decode(pdf_base64.trim())
        .map_err(|e| format!("Geçersiz PDF verisi: {e}"))?;
    let mut name = default_name.trim().to_string();
    if name.is_empty() {
        name = "quiz_sonuc.pdf".to_string();
    } else if !name.to_lowercase().ends_with(".pdf") {
        name.push_str(".pdf");
    }
    let path = rfd::FileDialog::new()
        .set_file_name(&name)
        .add_filter("PDF", &["pdf"])
        .save_file();
    match path {
        Some(path) => {
            std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
            Ok(Some(path.to_string_lossy().into_owned()))
        }
        None => Ok(None),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(GeminiRunState::default())
        .manage(PdfRuntimeState::default())
        .invoke_handler(tauri::generate_handler![
            gemini_run,
            abort_gemini_run,
            gemini_cli_status,
            gemini_cli_setup_action,
            read_pdf_file_base64,
            read_pdf_file_info,
            pdf_runtime_status,
            pdf_bootstrap_runtime,
            pdf_hybrid_start,
            pdf_hybrid_stop,
            extract_pdf_document,
            extract_pdf_document_payload,
            save_quiz_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
