#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::process::Command as TokioCommand;
use tokio::sync::Mutex;

/// Uzun süren `gemini` sürecini iptal için takip eder.
/// `Child` mutex içinde bekletilirse `wait` ile aynı anda `kill` deadlock üretebileceği için
/// iptal yolu PID + platform `kill` / `taskkill` kullanır (`Child::kill` ile eşdeğer sonuç).
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

/// Çalışan OS sürecini zorla sonlandırır (`tokio::process::Child::kill` ile aynı amaç).
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
                format!("kill çıkış kodu: {status}"),
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
        // 128: süreç bulunamadı — zaten bitmiş olabilir, iptal için sorun değil
        if status.success() || status.code() == Some(128) {
            Ok(())
        } else {
            Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("taskkill çıkış kodu: {status}"),
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
}

/// Yalnızca global `gemini` / `gemini.cmd` (npx fallback değil).
fn check_global_gemini_version() -> (bool, Option<String>) {
    let candidates: &[&str] = if cfg!(target_os = "windows") {
        &["gemini", "gemini.cmd"]
    } else {
        &["gemini"]
    };

    for prog in candidates {
        let output = Command::new(prog)
            .arg("--version")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output();

        if let Ok(out) = output {
            if out.status.success() {
                let mut s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if s.is_empty() {
                    s = String::from_utf8_lossy(&out.stderr).trim().to_string();
                }
                let short: String = s.chars().take(120).collect();
                return (
                    true,
                    if short.is_empty() {
                        None
                    } else {
                        Some(short)
                    },
                );
            }
        }
    }

    (false, None)
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
    let body = "echo Gemini CLI - kurulum talimatlari & echo. & echo npm install -g @google/gemini-cli@latest & echo gemini auth login & echo. & echo Gelistirme modu: otomatik kurulum yapilmadi. & pause";
    spawn_windows_cmd_k("QuizLab Gemini", body)
}

#[cfg(not(target_os = "windows"))]
fn spawn_dev_gemini_instructions_cmd() -> Result<(), String> {
    Command::new("sh")
        .arg("-c")
        .arg(
            "printf '%s\\n' \
             'Gemini CLI kurulumu:' \
             '  npm install -g @google/gemini-cli@latest' \
             '  gemini auth login' \
             '' \
             'Geliştirme modu: otomatik kurulum yapılmadı.' \
             '' 'Devam etmek için Enter...'; read -r _",
        )
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Terminal başlatılamadı: {e}"))?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn spawn_release_gemini_install_cmd() -> Result<(), String> {
    let body = "npm install -g @google/gemini-cli@latest && call gemini auth login && pause";
    spawn_windows_cmd_k("QuizLab Gemini", body)
}

#[cfg(not(target_os = "windows"))]
fn spawn_release_gemini_install_cmd() -> Result<(), String> {
    Command::new("sh")
        .arg("-c")
        .arg("npm install -g @google/gemini-cli@latest && gemini auth login")
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
    if installed {
        return Ok(());
    }

    spawn_release_gemini_install_cmd()
}

/// Gemini CLI: stdin = bağlam; `-p` modele ek kullanıcı mesajı olarak eklenir.
const HEADLESS_USER_PROMPT: &str = "Bağlamın tamamını oku; özellikle [CLI_SON_TALİMAT] bölümündeki kurallara uy ve istenen çıktıyı üret.";

/// Frontend'den gelen `model` yalnızca bu isimlerden biri olabilir (komut enjeksiyonu ve geçersiz `-m` önlemi).
const ALLOWED_GEMINI_MODELS: &[&str] = &[
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiCliRequest {
    model: String,
    stdin_content: String,
    prompt_flag: String,
}

/// Önce `gemini` (global npm), olmazsa `npx -y @google/gemini-cli` — Tauri GUI'de PATH bazen eksik kalır.
async fn spawn_gemini_process(model: &str) -> Result<tokio::process::Child, std::io::Error> {
    let args = [
        "-m",
        model,
        "--output-format",
        "json",
        "-p",
        HEADLESS_USER_PROMPT,
    ];

    let attempts: &[(&str, &[&str])] = if cfg!(target_os = "windows") {
        &[
            ("gemini", &[]),
            ("gemini.cmd", &[]),
            ("npx.cmd", &["-y", "@google/gemini-cli"]),
            ("npx", &["-y", "@google/gemini-cli"]),
        ]
    } else {
        &[("gemini", &[]), ("npx", &["-y", "@google/gemini-cli"])]
    };

    let mut last_err: Option<std::io::Error> = None;

    for (program, prefix) in attempts {
        let mut cmd = TokioCommand::new(program);
        for p in *prefix {
            cmd.arg(p);
        }
        cmd.args(args);
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        match cmd.spawn() {
            Ok(child) => return Ok(child),
            Err(e) => last_err = Some(e),
        }
    }

    Err(last_err.unwrap_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "gemini veya npx bulunamadı",
        )
    }))
}

const GEMINI_CLI_TIMEOUT: Duration = Duration::from_secs(300);

/// CLI / npx uyarıları nedeniyle stdout'ta JSON'dan önce veya sonra metin olabilir.
/// İlk `{` ile son `}` arasındaki alt diziyi döndürür; biri yoksa veya sıra geçersizse hata.
fn extract_json_object_slice(s: &str) -> Result<&str, String> {
    let start = s.find('{').ok_or_else(|| {
        "Gemini CLI çıktısında JSON nesnesi başlangıcı ('{') bulunamadı.".to_string()
    })?;
    let end = s.rfind('}').ok_or_else(|| {
        "Gemini CLI çıktısında JSON nesnesi sonu ('}') bulunamadı.".to_string()
    })?;
    if end < start {
        return Err("Gemini CLI çıktısında '{' ve '}' sırası geçersiz.".to_string());
    }
    Ok(&s[start..=end])
}

/// `tokio::process::Child::wait_with_output` ile aynı mantık (`try_join3(wait, stdout, stderr)`), `&mut Child` ile
/// böylece zaman aşımında `child.kill().await` kullanılabilir.
async fn child_wait_with_output_like(
    child: &mut tokio::process::Child,
) -> std::io::Result<std::process::Output> {
    async fn read_pipe_to_end<A: AsyncReadExt + Unpin>(
        pipe: &mut Option<A>,
    ) -> std::io::Result<Vec<u8>> {
        let mut buf = Vec::new();
        if let Some(io) = pipe.as_mut() {
            io.read_to_end(&mut buf).await?;
        }
        Ok(buf)
    }

    let mut stdout_pipe = child.stdout.take();
    let mut stderr_pipe = child.stderr.take();

    let stdout_fut = read_pipe_to_end(&mut stdout_pipe);
    let stderr_fut = read_pipe_to_end(&mut stderr_pipe);

    let (status, stdout, stderr) =
        tokio::try_join!(child.wait(), stdout_fut, stderr_fut)?;

    drop(stdout_pipe);
    drop(stderr_pipe);

    Ok(std::process::Output {
        status,
        stdout,
        stderr,
    })
}

async fn run_gemini_cli(state: &GeminiRunState, req: GeminiCliRequest) -> Result<String, String> {
    let model = req.model.trim();
    if model.is_empty() {
        return Err("Model adı boş.".to_string());
    }
    if !ALLOWED_GEMINI_MODELS.contains(&model) {
        return Err("Geçersiz model adı".to_string());
    }

    let body = req.stdin_content.trim();
    let tail = req.prompt_flag.trim();
    if body.is_empty() {
        return Err("Prompt gövdesi (stdin) boş; metin CLI'ye yazılmadı.".to_string());
    }
    if tail.is_empty() {
        return Err("Son talimat (promptFlag) boş.".to_string());
    }

    let combined = format!("{body}\n\n---\n[CLI_SON_TALİMAT]\n{tail}\n");

    let mut child = spawn_gemini_process(model).await.map_err(|e| {
        format!(
            "Gemini CLI başlatılamadı. Kurulum: npm i -g @google/gemini-cli (veya PATH'te npx). Hata: {e}"
        )
    })?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(combined.as_bytes())
            .await
            .map_err(|e| format!("stdin yazılamadı: {e}"))?;
        stdin
            .shutdown()
            .await
            .map_err(|e| format!("stdin kapatılamadı: {e}"))?;
    }

    if let Some(pid) = child.id() {
        *state.active_pid.lock().await = Some(pid);
    }

    let output = match tokio::time::timeout(
        GEMINI_CLI_TIMEOUT,
        child_wait_with_output_like(&mut child),
    )
    .await
    {
        Ok(Ok(output)) => output,
        Ok(Err(e)) => return Err(format!("Gemini CLI bekleme hatası: {e}")),
        Err(_elapsed) => {
            if let Err(e) = child.kill().await {
                return Err(format!(
                    "Gemini CLI 300 saniye zaman aşımı; süreç sonlandırılamadı: {e}"
                ));
            }
            return Err(
                "Gemini CLI 300 saniye içinde tamamlanmadı; süreç zorla sonlandırıldı.".to_string(),
            );
        }
    };

    if state.cancelled.load(Ordering::SeqCst) {
        return Err("Gemini CLI çalışması kullanıcı tarafından iptal edildi.".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(format!(
            "Gemini CLI çıkış kodu {:?}. stderr: {}",
            output.status.code(),
            if stderr.is_empty() {
                stdout.clone()
            } else {
                stderr
            }
        ));
    }

    #[derive(Deserialize)]
    struct CliJson {
        response: Option<String>,
        error: Option<serde_json::Value>,
    }

    let json_block = extract_json_object_slice(stdout.trim())?;
    let parsed: CliJson = serde_json::from_str(json_block).map_err(|e| {
        format!(
            "Gemini CLI çıktısı JSON değil: {e}. stdout (ilk 500 karakter): {}",
            stdout.chars().take(500).collect::<String>()
        )
    })?;

    if let Some(err) = parsed.error {
        return Err(format!("Gemini CLI hata alanı: {err}"));
    }

    parsed
        .response
        .ok_or_else(|| "Gemini CLI yanıtı boş (response yok).".to_string())
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
        GeminiCliStatus {
            installed,
            version,
            is_dev_build: cfg!(debug_assertions),
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

/// WebView içinde `jsPDF.save()` indirmeyi tetiklemediği için yerel kaydet penceresi.
/// `Some(yol)` = kullanıcı kaydetti; `None` = iptal.
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
        Some(p) => {
            std::fs::write(&p, bytes).map_err(|e| e.to_string())?;
            Ok(Some(p.to_string_lossy().into_owned()))
        }
        None => Ok(None),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(GeminiRunState::default())
        .invoke_handler(tauri::generate_handler![
            gemini_run,
            abort_gemini_run,
            gemini_cli_status,
            gemini_cli_setup_action,
            save_quiz_pdf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
