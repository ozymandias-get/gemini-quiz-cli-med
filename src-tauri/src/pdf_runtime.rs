use base64::Engine as _;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::net::{TcpStream, ToSocketAddrs};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager, State};

const PAGE_MARKER: &str = "<<<QUIZLAB_PAGE_%page-number%>>>";
const DEFAULT_HYBRID_PORT: u16 = 5002;
const GENERATION_LOG_EVENT: &str = "quizlab://generation-log";
const CLI_LOG_PREVIEW_CHARS: usize = 240;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfRuntimeStatus {
    pub is_checked: bool,
    pub java_ready: bool,
    pub java_version: Option<String>,
    pub java_path: Option<String>,
    pub python_found: bool,
    pub python_version: Option<String>,
    pub python_path: Option<String>,
    pub runtime_bootstrapped: bool,
    pub cli_ready: bool,
    pub hybrid_status: String,
    pub hybrid_url: Option<String>,
    pub status_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PdfHybridServerConfig {
    pub port: Option<u16>,
    pub force_ocr: Option<bool>,
    pub ocr_lang: Option<String>,
    pub enrich_formula: Option<bool>,
    pub enrich_picture_description: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PdfExtractionOptions {
    pub sanitize: Option<bool>,
    pub keep_line_breaks: Option<bool>,
    pub use_struct_tree: Option<bool>,
    pub include_header_footer: Option<bool>,
    pub detect_strikethrough: Option<bool>,
    pub table_method: Option<String>,
    pub reading_order: Option<String>,
    pub image_output: Option<String>,
    pub image_format: Option<String>,
    pub pages: Option<String>,
    pub hybrid: Option<String>,
    pub hybrid_mode: Option<String>,
    pub hybrid_timeout: Option<String>,
    pub hybrid_fallback: Option<bool>,
    pub hybrid_url: Option<String>,
    pub output_html: Option<bool>,
    pub output_annotated_pdf: Option<bool>,
    pub hybrid_server: Option<PdfHybridServerConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractPdfDocumentRequest {
    pub path: String,
    pub options: Option<PdfExtractionOptions>,
    pub requested_formats: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractPdfPayloadRequest {
    pub file_name: String,
    pub base64: String,
    pub options: Option<PdfExtractionOptions>,
    pub requested_formats: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreparedDocumentPagePayload {
    pub page_number: usize,
    pub markdown: String,
    pub text: String,
    pub element_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfArtifactPayload {
    pub kind: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractPdfDocumentResponse {
    pub markdown: String,
    pub text: String,
    pub json_elements: Vec<Value>,
    pub pages: Vec<PreparedDocumentPagePayload>,
    pub images: Vec<String>,
    pub mode: String,
    pub artifacts: Vec<PdfArtifactPayload>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadPdfFileInfoResponse {
    pub file_name: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerationLogPayload {
    stage: String,
    message: String,
    level: String,
    timestamp: u128,
    meta: Option<Value>,
}

struct HybridProcessState {
    child: Child,
    url: String,
}

#[derive(Clone, Default)]
pub struct PdfRuntimeState {
    hybrid_process: Arc<Mutex<Option<HybridProcessState>>>,
}

#[derive(Debug, Clone)]
struct RuntimePaths {
    venv_dir: PathBuf,
    cache_dir: PathBuf,
    jobs_dir: PathBuf,
    logs_dir: PathBuf,
}

#[derive(Debug, Clone)]
struct ResolvedPython {
    display_path: String,
    version: String,
    program: String,
    prefix_args: Vec<String>,
}

#[derive(Debug, Clone)]
struct ResolvedJava {
    java_exe: PathBuf,
    java_home: PathBuf,
    version: String,
}

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

fn emit_generation_log(
    app: &AppHandle,
    stage: &str,
    message: impl Into<String>,
    level: &str,
    meta: Option<Value>,
) {
    let payload = GenerationLogPayload {
        stage: stage.to_string(),
        message: message.into(),
        level: level.to_string(),
        timestamp: now_millis(),
        meta,
    };
    let _ = app.emit(GENERATION_LOG_EVENT, payload);
}

fn with_command_env(command: &mut Command, java_home: &Path, cache_dir: &Path) {
    let java_bin = java_home.join("bin");
    let mut paths = vec![java_bin];
    if let Some(current_path) = std::env::var_os("PATH") {
        paths.extend(std::env::split_paths(&current_path));
    }
    if let Ok(joined) = std::env::join_paths(paths) {
        command.env("PATH", joined);
    }
    command.env("JAVA_HOME", java_home);
    command.env("PIP_CACHE_DIR", cache_dir);
    command.env("PYTHONUTF8", "1");
    command.env("PYTHONIOENCODING", "utf-8");

    // Force JVM stdout/stderr to UTF-8 so opendataloader wrapper
    // does not fail on Windows locale-specific bytes (cp1254, cp1252, ...).
    let forced_java_encoding =
        "-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8";
    let merged_java_tool_options = std::env::var("JAVA_TOOL_OPTIONS")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .map(|value| format!("{value} {forced_java_encoding}"))
        .unwrap_or_else(|| forced_java_encoding.to_string());
    command.env("JAVA_TOOL_OPTIONS", merged_java_tool_options);
}

fn parse_major_java_version(version_text: &str) -> Option<u32> {
    let cleaned = version_text.trim();
    if cleaned.contains("version \"1.") {
        cleaned
            .split("version \"1.")
            .nth(1)
            .and_then(|tail| tail.split('.').next())
            .and_then(|value| value.parse::<u32>().ok())
    } else {
        cleaned
            .split('"')
            .nth(1)
            .and_then(|value| value.split('.').next())
            .and_then(|value| value.parse::<u32>().ok())
    }
}

fn parse_python_version(version_text: &str) -> Option<(u32, u32)> {
    let version = version_text.trim().replace("Python ", "");
    let mut parts = version.split('.');
    let major = parts.next()?.parse::<u32>().ok()?;
    let minor = parts.next()?.parse::<u32>().ok()?;
    Some((major, minor))
}

fn ensure_runtime_paths(app: &AppHandle) -> Result<RuntimePaths, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini bulunamadı: {e}"))?;
    let runtime_dir = app_data_dir.join("runtime");
    let venv_dir = runtime_dir.join("venv");
    let cache_dir = runtime_dir.join("cache");
    let jobs_dir = runtime_dir.join("jobs");
    let logs_dir = runtime_dir.join("logs");

    for path in [&runtime_dir, &cache_dir, &jobs_dir, &logs_dir] {
        fs::create_dir_all(path).map_err(|e| format!("Dizin oluşturulamadı ({}): {e}", path.display()))?;
    }

    Ok(RuntimePaths {
        venv_dir,
        cache_dir,
        jobs_dir,
        logs_dir,
    })
}

fn find_java_executable(dir: &Path) -> Option<PathBuf> {
    if !dir.exists() {
        return None;
    }

    let candidates = if cfg!(target_os = "windows") {
        vec![
            dir.join("bin").join("java.exe"),
            dir.join("java.exe"),
            dir.join("Contents").join("Home").join("bin").join("java"),
        ]
    } else if cfg!(target_os = "macos") {
        vec![
            dir.join("Contents").join("Home").join("bin").join("java"),
            dir.join("bin").join("java"),
        ]
    } else {
        vec![dir.join("bin").join("java"), dir.join("java")]
    };

    for candidate in candidates {
        if candidate.exists() {
            return Some(candidate);
        }
    }

    let read_dir = fs::read_dir(dir).ok()?;
    for entry in read_dir.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_java_executable(&path) {
                return Some(found);
            }
        }
    }
    None
}

fn resolve_java(app: &AppHandle) -> Result<ResolvedJava, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Resource dizini okunamadı: {e}"))?;
    let jre_root = resource_dir.join("jre");

    let mut search_roots = vec![jre_root];
    for env_name in ["QUIZLAB_JAVA_HOME", "OPEN_DATALOADER_JAVA_HOME", "JAVA_HOME"] {
        if let Ok(value) = std::env::var(env_name) {
            if !value.trim().is_empty() {
                search_roots.push(PathBuf::from(value));
            }
        }
    }

    for root in search_roots {
        let Some(java_exe) = find_java_executable(&root) else {
            continue;
        };
        let java_home = java_exe
            .parent()
            .and_then(|path| path.parent())
            .unwrap_or(&root)
            .to_path_buf();
        let mut java_cmd = Command::new(&java_exe);
        crate::windows_process::configure_hidden_subprocess(&mut java_cmd);
        let output = java_cmd
            .arg("-version")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("Java sürümü okunamadı: {e}"))?;
        let version_text = {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            if stderr.is_empty() {
                String::from_utf8_lossy(&output.stdout).trim().to_string()
            } else {
                stderr
            }
        };
        if let Some(major) = parse_major_java_version(&version_text) {
            if major >= 11 {
                return Ok(ResolvedJava {
                    java_exe,
                    java_home,
                    version: version_text,
                });
            }
        }
    }

    Err("Bundled Java 11+ runtime bulunamadı. `src-tauri/resources/jre` altına Temurin JRE 21 ekleyin.".to_string())
}

fn resolve_python() -> Result<ResolvedPython, String> {
    let candidates: Vec<(String, Vec<String>)> = if cfg!(target_os = "windows") {
        vec![
            ("python".to_string(), vec![]),
            ("py".to_string(), vec!["-3".to_string()]),
            ("python3".to_string(), vec![]),
        ]
    } else {
        vec![("python3".to_string(), vec![]), ("python".to_string(), vec![])]
    };

    for (program, prefix_args) in candidates {
        let mut py_cmd = Command::new(&program);
        crate::windows_process::configure_hidden_subprocess(&mut py_cmd);
        let output = py_cmd
            .args(&prefix_args)
            .arg("--version")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output();

        let Ok(output) = output else {
            continue;
        };
        if !output.status.success() {
            continue;
        }

        let version_text = {
            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if stdout.is_empty() {
                String::from_utf8_lossy(&output.stderr).trim().to_string()
            } else {
                stdout
            }
        };
        let Some((major, minor)) = parse_python_version(&version_text) else {
            continue;
        };
        if (major, minor) < (3, 10) {
            continue;
        }

        return Ok(ResolvedPython {
            display_path: if prefix_args.is_empty() {
                program.clone()
            } else {
                format!("{} {}", program, prefix_args.join(" "))
            },
            version: version_text,
            program,
            prefix_args,
        });
    }

    Err("Python 3.10+ bulunamadı.".to_string())
}

fn venv_python_path(venv_dir: &Path) -> PathBuf {
    if cfg!(target_os = "windows") {
        venv_dir.join("Scripts").join("python.exe")
    } else {
        venv_dir.join("bin").join("python")
    }
}

fn find_venv_cli(venv_dir: &Path, base_name: &str) -> Option<PathBuf> {
    let scripts_dir = if cfg!(target_os = "windows") {
        venv_dir.join("Scripts")
    } else {
        venv_dir.join("bin")
    };
    let candidates = if cfg!(target_os = "windows") {
        vec![
            scripts_dir.join(format!("{base_name}.exe")),
            scripts_dir.join(format!("{base_name}.cmd")),
            scripts_dir.join(format!("{base_name}-script.py")),
        ]
    } else {
        vec![scripts_dir.join(base_name)]
    };
    candidates.into_iter().find(|path| path.exists())
}

fn runtime_is_bootstrapped(venv_dir: &Path) -> bool {
    find_venv_cli(venv_dir, "opendataloader-pdf").is_some()
        && find_venv_cli(venv_dir, "opendataloader-pdf-hybrid").is_some()
}

fn bootstrap_runtime_impl(app: &AppHandle) -> Result<PdfRuntimeStatus, String> {
    let runtime_paths = ensure_runtime_paths(app)?;
    let java = resolve_java(app)?;
    let python = resolve_python()?;
    let venv_python = venv_python_path(&runtime_paths.venv_dir);

    if !venv_python.exists() {
        emit_generation_log(
            app,
            "runtime.bootstrap",
            "Python virtual environment olusturuluyor.",
            "info",
            Some(serde_json::json!({
                "venvPath": runtime_paths.venv_dir.to_string_lossy()
            })),
        );
        let mut venv_cmd = Command::new(&python.program);
        crate::windows_process::configure_hidden_subprocess(&mut venv_cmd);
        let status = venv_cmd
            .args(&python.prefix_args)
            .args(["-m", "venv"])
            .arg(&runtime_paths.venv_dir)
            .status()
            .map_err(|e| format!("Python virtualenv oluşturulamadı: {e}"))?;
        if !status.success() {
            emit_generation_log(
                app,
                "runtime.bootstrap",
                "Python virtual environment olusturulamadi.",
                "error",
                None,
            );
            return Err("Python virtualenv oluşturulamadı.".to_string());
        }
        emit_generation_log(
            app,
            "runtime.bootstrap",
            "Python virtual environment hazirlandi.",
            "success",
            None,
        );
    }

    if !runtime_is_bootstrapped(&runtime_paths.venv_dir) {
        emit_generation_log(
            app,
            "runtime.bootstrap",
            "OpenDataLoader bagimliliklari kuruluyor.",
            "info",
            None,
        );
        let mut install = Command::new(&venv_python);
        crate::windows_process::configure_hidden_subprocess(&mut install);
        with_command_env(&mut install, &java.java_home, &runtime_paths.cache_dir);
        let status = install
            .args([
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "-U",
                "opendataloader-pdf[hybrid]",
            ])
            .status()
            .map_err(|e| format!("OpenDataLoader kurulumu başlatılamadı: {e}"))?;
        if !status.success() {
            emit_generation_log(
                app,
                "runtime.bootstrap",
                "OpenDataLoader kurulumu basarisiz oldu.",
                "error",
                None,
            );
            return Err("OpenDataLoader kurulumu başarısız oldu.".to_string());
        }
        emit_generation_log(
            app,
            "runtime.bootstrap",
            "OpenDataLoader kurulumu tamamlandi.",
            "success",
            None,
        );
    }

    pdf_runtime_status_impl(app, None)
}

fn parse_url_host_port(url: &str) -> Option<(String, u16)> {
    let trimmed = url.trim().trim_end_matches('/');
    let without_scheme = trimmed
        .strip_prefix("http://")
        .or_else(|| trimmed.strip_prefix("https://"))
        .unwrap_or(trimmed);
    let host_port = without_scheme.split('/').next()?;
    let mut parts = host_port.rsplitn(2, ':');
    let port = parts.next()?.parse::<u16>().ok()?;
    let host = parts.next()?.to_string();
    Some((host, port))
}

fn tcp_healthcheck(url: &str) -> bool {
    let Some((host, port)) = parse_url_host_port(url) else {
        return false;
    };
    let Ok(mut addrs) = format!("{host}:{port}").to_socket_addrs() else {
        return false;
    };
    let Some(addr) = addrs.next() else {
        return false;
    };
    TcpStream::connect_timeout(&addr, Duration::from_millis(400)).is_ok()
}

fn current_hybrid_status(state: &PdfRuntimeState) -> (String, Option<String>) {
    let guard = state.hybrid_process.lock().unwrap();
    if let Some(process) = guard.as_ref() {
        let status = if tcp_healthcheck(&process.url) {
            "healthy"
        } else {
            "starting"
        };
        (status.to_string(), Some(process.url.clone()))
    } else {
        ("stopped".to_string(), None)
    }
}

fn pdf_runtime_status_impl(app: &AppHandle, state: Option<&PdfRuntimeState>) -> Result<PdfRuntimeStatus, String> {
    let java = resolve_java(app);
    let python = resolve_python();
    let runtime_paths = ensure_runtime_paths(app)?;
    let runtime_bootstrapped = venv_python_path(&runtime_paths.venv_dir).exists();
    let cli_ready = runtime_is_bootstrapped(&runtime_paths.venv_dir);
    let (hybrid_status, hybrid_url) = if let Some(state) = state {
        current_hybrid_status(state)
    } else {
        ("stopped".to_string(), None)
    };

    let status_message = match (&java, &python) {
        (Err(java_error), _) => Some(java_error.clone()),
        (_, Err(python_error)) => Some(python_error.clone()),
        _ if runtime_bootstrapped && cli_ready => Some("OpenDataLoader çalışma ortamı hazır.".to_string()),
        _ => Some("Çalışma ortamı bootstrap gerekiyor.".to_string()),
    };

    Ok(PdfRuntimeStatus {
        is_checked: true,
        java_ready: java.is_ok(),
        java_version: java.as_ref().ok().map(|value| value.version.clone()),
        java_path: java
            .as_ref()
            .ok()
            .map(|value| value.java_exe.to_string_lossy().into_owned()),
        python_found: python.is_ok(),
        python_version: python.as_ref().ok().map(|value| value.version.clone()),
        python_path: python.as_ref().ok().map(|value| value.display_path.clone()),
        runtime_bootstrapped,
        cli_ready,
        hybrid_status,
        hybrid_url,
        status_message,
    })
}

fn build_hybrid_url(config: &PdfHybridServerConfig) -> String {
    let port = config.port.unwrap_or(DEFAULT_HYBRID_PORT);
    format!("http://127.0.0.1:{port}")
}

fn start_hybrid_impl(
    app: &AppHandle,
    state: &PdfRuntimeState,
    config: PdfHybridServerConfig,
) -> Result<PdfRuntimeStatus, String> {
    let runtime_paths = ensure_runtime_paths(app)?;
    let java = resolve_java(app)?;
    let _ = bootstrap_runtime_impl(app)?;
    emit_generation_log(
        app,
        "hybrid.start",
        "Hybrid backend baslatma hazirligi.",
        "info",
        None,
    );

    {
        let mut guard = state.hybrid_process.lock().unwrap();
        if let Some(existing) = guard.as_mut() {
            match existing.child.try_wait() {
                Ok(Some(_)) => {
                    *guard = None;
                }
                Ok(None) => {
                    if tcp_healthcheck(&existing.url) {
                        drop(guard);
                        return pdf_runtime_status_impl(app, Some(state));
                    }
                }
                Err(_) => {
                    *guard = None;
                }
            }
        }
    }

    let cli_path = find_venv_cli(&runtime_paths.venv_dir, "opendataloader-pdf-hybrid")
        .ok_or_else(|| "Hibrit CLI bulunamadı. Çalışma ortamı bootstrap tamamlanmamış.".to_string())?;
    let url = build_hybrid_url(&config);
    let log_path = runtime_paths.logs_dir.join("opendataloader-hybrid.log");
    let stdout = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Hibrit log dosyası açılamadı: {e}"))?;
    let stderr = stdout
        .try_clone()
        .map_err(|e| format!("Hibrit log handle klonlanamadı: {e}"))?;

    let mut command = Command::new(cli_path);
    crate::windows_process::configure_hidden_subprocess(&mut command);
    with_command_env(&mut command, &java.java_home, &runtime_paths.cache_dir);
    command
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr))
        .arg("--port")
        .arg(config.port.unwrap_or(DEFAULT_HYBRID_PORT).to_string());

    if config.force_ocr.unwrap_or(false) {
        command.arg("--force-ocr");
    }
    if let Some(ocr_lang) = config.ocr_lang.as_ref().filter(|value| !value.trim().is_empty()) {
        command.arg("--ocr-lang").arg(ocr_lang);
    }
    if config.enrich_formula.unwrap_or(false) {
        command.arg("--enrich-formula");
    }
    if config.enrich_picture_description.unwrap_or(false) {
        command.arg("--enrich-picture-description");
    }

    let child = command
        .spawn()
        .map_err(|e| format!("Hibrit backend başlatılamadı: {e}"))?;
    emit_generation_log(
        app,
        "hybrid.start",
        format!("Hybrid backend prosesi baslatildi: {url}"),
        "info",
        None,
    );

    {
        let mut guard = state.hybrid_process.lock().unwrap();
        *guard = Some(HybridProcessState {
            child,
            url: url.clone(),
        });
    }

    let started = (0..40).any(|_| {
        if tcp_healthcheck(&url) {
            true
        } else {
            thread::sleep(Duration::from_millis(500));
            false
        }
    });

    if !started {
        emit_generation_log(
            app,
            "hybrid.start",
            "Hybrid backend healthcheck timeout.",
            "error",
            Some(serde_json::json!({
                "url": url,
                "logPath": log_path.to_string_lossy()
            })),
        );
        return Err(format!(
            "Hibrit backend {url} adresinde sağlıklı şekilde açılamadı. Log: {}",
            log_path.display()
        ));
    }
    emit_generation_log(
        app,
        "hybrid.start",
        "Hybrid backend saglikli.",
        "success",
        Some(serde_json::json!({ "url": url })),
    );

    pdf_runtime_status_impl(app, Some(state))
}

fn stop_hybrid_impl(app: &AppHandle, state: &PdfRuntimeState) -> Result<PdfRuntimeStatus, String> {
    {
        let mut guard = state.hybrid_process.lock().unwrap();
        if let Some(mut process) = guard.take() {
            let _ = process.child.kill();
            let _ = process.child.wait();
        }
    }
    pdf_runtime_status_impl(app, Some(state))
}

fn build_format_list(options: &PdfExtractionOptions, requested_formats: &[String]) -> Vec<String> {
    let mut formats = vec![
        "markdown".to_string(),
        "json".to_string(),
        "text".to_string(),
    ];
    for value in requested_formats {
        let normalized = value.trim().to_lowercase();
        if !normalized.is_empty() && !formats.contains(&normalized) {
            formats.push(normalized);
        }
    }
    if options.output_html.unwrap_or(false) && !formats.contains(&"html".to_string()) {
        formats.push("html".to_string());
    }
    if options.output_annotated_pdf.unwrap_or(false) && !formats.contains(&"pdf".to_string()) {
        formats.push("pdf".to_string());
    }
    formats
}

fn run_cli_capture(
    cli_path: &Path,
    java_home: &Path,
    cache_dir: &Path,
    args: &[String],
) -> Result<(u128, String, String), String> {
    let started_at = now_millis();
    let mut command = Command::new(cli_path);
    crate::windows_process::configure_hidden_subprocess(&mut command);
    with_command_env(&mut command, java_home, cache_dir);
    command.args(args);
    let output = command
        .output()
        .map_err(|e| format!("CLI komutu çalıştırılamadı: {e}"))?;

    let elapsed_ms = now_millis().saturating_sub(started_at);
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        return Ok((elapsed_ms, stdout, stderr));
    }

    Err(if stderr.is_empty() { stdout } else { stderr })
}

fn recursively_collect_files(root: &Path, collected: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(root) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            recursively_collect_files(&path, collected);
        } else {
            collected.push(path);
        }
    }
}

fn first_file_with_extension(root: &Path, extension: &str) -> Option<PathBuf> {
    let mut files = Vec::new();
    recursively_collect_files(root, &mut files);
    files.into_iter().find(|path| {
        path.extension()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case(extension))
            .unwrap_or(false)
    })
}

fn collect_image_paths(root: &Path) -> Vec<String> {
    let mut files = Vec::new();
    recursively_collect_files(root, &mut files);
    files.into_iter()
        .filter(|path| {
            path.extension()
                .and_then(|value| value.to_str())
                .map(|value| matches!(value.to_ascii_lowercase().as_str(), "png" | "jpg" | "jpeg"))
                .unwrap_or(false)
        })
        .map(|path| path.to_string_lossy().into_owned())
        .collect()
}

fn split_pages(content: &str) -> Vec<String> {
    let mut pages = Vec::new();
    let mut current = String::new();
    for line in content.lines() {
        if line.trim().starts_with("<<<QUIZLAB_PAGE_") && line.trim().ends_with(">>>") {
            if !current.trim().is_empty() {
                pages.push(current.trim().to_string());
                current.clear();
            }
            continue;
        }
        current.push_str(line);
        current.push('\n');
    }
    if !current.trim().is_empty() {
        pages.push(current.trim().to_string());
    }
    if pages.is_empty() && !content.trim().is_empty() {
        pages.push(content.trim().to_string());
    }
    pages
}

fn collect_json_elements(value: &Value, acc: &mut Vec<Value>) {
    match value {
        Value::Array(values) => {
            for value in values {
                collect_json_elements(value, acc);
            }
        }
        Value::Object(map) => {
            let has_page = map.contains_key("page number") || map.contains_key("pageNumber");
            let has_content = map.contains_key("content") || map.contains_key("description");
            if has_page || has_content {
                acc.push(Value::Object(map.clone()));
            }
            for value in map.values() {
                collect_json_elements(value, acc);
            }
        }
        _ => {}
    }
}

fn value_to_page_number(value: &Value) -> Option<usize> {
    value
        .get("page number")
        .or_else(|| value.get("pageNumber"))
        .and_then(|value| value.as_u64())
        .map(|value| value as usize)
}

fn extract_impl(
    app: &AppHandle,
    state: &PdfRuntimeState,
    request: ExtractPdfDocumentRequest,
) -> Result<ExtractPdfDocumentResponse, String> {
    emit_generation_log(
        app,
        "pdf.extract",
        "PDF cikarma islemi baslatildi.",
        "info",
        Some(serde_json::json!({ "path": request.path.as_str() })),
    );

    let runtime_paths = ensure_runtime_paths(app)?;
    emit_generation_log(
        app,
        "runtime.paths",
        "Runtime dizinleri hazirlandi.",
        "success",
        Some(serde_json::json!({
            "venvDir": runtime_paths.venv_dir.to_string_lossy(),
            "jobsDir": runtime_paths.jobs_dir.to_string_lossy()
        })),
    );

    let java = resolve_java(app)?;
    emit_generation_log(
        app,
        "runtime.java",
        "Java runtime dogrulandi.",
        "success",
        Some(serde_json::json!({
            "javaPath": java.java_exe.to_string_lossy(),
            "javaVersion": java.version
        })),
    );

    let _ = bootstrap_runtime_impl(app)?;
    emit_generation_log(
        app,
        "runtime.bootstrap",
        "Runtime bootstrap kontrolu tamamlandi.",
        "success",
        None,
    );

    let cli_path = find_venv_cli(&runtime_paths.venv_dir, "opendataloader-pdf")
        .ok_or_else(|| "OpenDataLoader CLI bulunamadı.".to_string())?;

    let input_path = PathBuf::from(request.path.trim());
    if !input_path.exists() {
        return Err(format!("PDF dosyası bulunamadı: {}", input_path.display()));
    }

    let options = request.options.unwrap_or_default();
    let requested_formats = request.requested_formats.unwrap_or_default();
    let mut format_list = build_format_list(&options, &requested_formats);
    format_list.sort();
    format_list.dedup();

    let job_dir = runtime_paths.jobs_dir.join(format!("job-{}", now_millis()));
    let output_dir = job_dir.join("output");
    fs::create_dir_all(&output_dir).map_err(|e| format!("Çıkış dizini oluşturulamadı: {e}"))?;

    let needs_hybrid = options
        .hybrid
        .as_ref()
        .map(|value| !value.trim().is_empty() && !value.eq_ignore_ascii_case("off"))
        .unwrap_or(false);
    emit_generation_log(
        app,
        "hybrid.mode",
        if needs_hybrid {
            "Hybrid extraction modu secildi."
        } else {
            "Local extraction modu secildi."
        },
        "info",
        Some(serde_json::json!({
            "hybrid": options.hybrid,
            "hybridMode": options.hybrid_mode
        })),
    );

    let hybrid_url = if needs_hybrid {
        if let Some(url) = options.hybrid_url.as_ref().filter(|value| !value.trim().is_empty()) {
            url.clone()
        } else {
            let config = options
                .hybrid_server
                .clone()
                .unwrap_or_else(|| PdfHybridServerConfig {
                    port: Some(DEFAULT_HYBRID_PORT),
                    ..Default::default()
                });
            let _ = start_hybrid_impl(app, state, config.clone())?;
            build_hybrid_url(&config)
        }
    } else {
        String::new()
    };

    let mut args = vec![
        input_path.to_string_lossy().into_owned(),
        "--output-dir".to_string(),
        output_dir.to_string_lossy().into_owned(),
        "--format".to_string(),
        format_list.join(","),
        "--markdown-page-separator".to_string(),
        PAGE_MARKER.to_string(),
        "--text-page-separator".to_string(),
        PAGE_MARKER.to_string(),
    ];

    if options.sanitize.unwrap_or(false) {
        args.push("--sanitize".to_string());
    }
    if options.keep_line_breaks.unwrap_or(false) {
        args.push("--keep-line-breaks".to_string());
    }
    if options.use_struct_tree.unwrap_or(false) {
        args.push("--use-struct-tree".to_string());
    }
    if options.include_header_footer.unwrap_or(false) {
        args.push("--include-header-footer".to_string());
    }
    if options.detect_strikethrough.unwrap_or(false) {
        args.push("--detect-strikethrough".to_string());
    }
    if let Some(value) = options.table_method.as_ref().filter(|value| !value.trim().is_empty()) {
        args.push("--table-method".to_string());
        args.push(value.clone());
    }
    if let Some(value) = options.reading_order.as_ref().filter(|value| !value.trim().is_empty()) {
        args.push("--reading-order".to_string());
        args.push(value.clone());
    }
    if let Some(value) = options.image_output.as_ref().filter(|value| !value.trim().is_empty()) {
        args.push("--image-output".to_string());
        args.push(value.clone());
    }
    if let Some(value) = options.image_format.as_ref().filter(|value| !value.trim().is_empty()) {
        args.push("--image-format".to_string());
        args.push(value.clone());
    }
    if let Some(value) = options.pages.as_ref().filter(|value| !value.trim().is_empty()) {
        args.push("--pages".to_string());
        args.push(value.clone());
    }
    if needs_hybrid {
        args.push("--hybrid".to_string());
        args.push(options.hybrid.clone().unwrap_or_else(|| "docling-fast".to_string()));
        if let Some(value) = options.hybrid_mode.as_ref().filter(|value| !value.trim().is_empty()) {
            args.push("--hybrid-mode".to_string());
            args.push(value.clone());
        }
        if !hybrid_url.is_empty() {
            args.push("--hybrid-url".to_string());
            args.push(hybrid_url.clone());
        }
        if let Some(value) = options.hybrid_timeout.as_ref().filter(|value| !value.trim().is_empty()) {
            args.push("--hybrid-timeout".to_string());
            args.push(value.clone());
        }
        if options.hybrid_fallback.unwrap_or(false) {
            args.push("--hybrid-fallback".to_string());
        }
    }

    let sanitized_args: Vec<String> = args
        .iter()
        .map(|arg| {
            if arg == &input_path.to_string_lossy().to_string() {
                "[pdf-path]".to_string()
            } else if arg == &output_dir.to_string_lossy().to_string() {
                "[output-dir]".to_string()
            } else if arg.starts_with("http://") || arg.starts_with("https://") {
                "[url]".to_string()
            } else {
                arg.clone()
            }
        })
        .collect();
    emit_generation_log(
        app,
        "cli.extract",
        "OpenDataLoader CLI baslatiliyor.",
        "info",
        Some(serde_json::json!({
            "cliPath": cli_path.to_string_lossy(),
            "args": sanitized_args
        })),
    );

    let (cli_elapsed_ms, cli_stdout, cli_stderr) = match run_cli_capture(
        &cli_path,
        &java.java_home,
        &runtime_paths.cache_dir,
        &args,
    ) {
        Ok(result) => result,
        Err(error) => {
            emit_generation_log(
                app,
                "cli.extract",
                "OpenDataLoader CLI hata ile sonlandi.",
                "error",
                Some(serde_json::json!({ "error": error })),
            );
            return Err(error);
        }
    };
    emit_generation_log(
        app,
        "cli.extract",
        "OpenDataLoader CLI basariyla tamamlandi.",
        "success",
        Some(serde_json::json!({
            "elapsedMs": cli_elapsed_ms,
            "stdoutPreview": truncate_for_log(&cli_stdout, CLI_LOG_PREVIEW_CHARS),
            "stderrPreview": truncate_for_log(&cli_stderr, CLI_LOG_PREVIEW_CHARS)
        })),
    );

    let markdown_path = first_file_with_extension(&output_dir, "md")
        .ok_or_else(|| "Markdown çıktı dosyası bulunamadı.".to_string())?;
    let text_path = first_file_with_extension(&output_dir, "txt")
        .ok_or_else(|| "Text çıktı dosyası bulunamadı.".to_string())?;
    let json_path = first_file_with_extension(&output_dir, "json")
        .ok_or_else(|| "JSON çıktı dosyası bulunamadı.".to_string())?;

    let markdown =
        fs::read_to_string(&markdown_path).map_err(|e| format!("Markdown çıktı okunamadı: {e}"))?;
    let text = fs::read_to_string(&text_path).map_err(|e| format!("Text çıktı okunamadı: {e}"))?;
    let json_content =
        fs::read_to_string(&json_path).map_err(|e| format!("JSON çıktı okunamadı: {e}"))?;
    let json_value: Value =
        serde_json::from_str(&json_content).map_err(|e| format!("JSON parse edilemedi: {e}"))?;

    if markdown.trim().is_empty() && text.trim().is_empty() {
        return Err("PDF çıkarım sonucu boş içerik döndü (markdown/text).".to_string());
    }

    let mut json_elements = Vec::new();
    collect_json_elements(&json_value, &mut json_elements);
    emit_generation_log(
        app,
        "pdf.outputs",
        "CLI ciktilari okundu ve parse edildi.",
        "success",
        Some(serde_json::json!({
            "markdownPath": markdown_path.to_string_lossy(),
            "textPath": text_path.to_string_lossy(),
            "jsonPath": json_path.to_string_lossy(),
            "jsonElementCount": json_elements.len()
        })),
    );

    let markdown_pages = split_pages(&markdown);
    let text_pages = split_pages(&text);
    if markdown_pages.len().abs_diff(text_pages.len()) > 2 {
        emit_generation_log(
            app,
            "pdf.pages",
            "Markdown/Text sayfa sayisi belirgin farkli.",
            "warning",
            Some(serde_json::json!({
                "markdownPages": markdown_pages.len(),
                "textPages": text_pages.len()
            })),
        );
    }
    let page_count = markdown_pages.len().max(text_pages.len()).max(1);
    let mut pages = Vec::new();
    for index in 0..page_count {
        let page_number = index + 1;
        let element_count = json_elements
            .iter()
            .filter(|value| value_to_page_number(value) == Some(page_number))
            .count();
        pages.push(PreparedDocumentPagePayload {
            page_number,
            markdown: markdown_pages.get(index).cloned().unwrap_or_default(),
            text: text_pages.get(index).cloned().unwrap_or_default(),
            element_count,
        });
    }
    emit_generation_log(
        app,
        "pdf.pages",
        "Sayfa bazli icerik olusturuldu.",
        "success",
        Some(serde_json::json!({
            "pageCount": page_count
        })),
    );

    let mut artifacts = vec![
        PdfArtifactPayload {
            kind: "markdown".to_string(),
            path: markdown_path.to_string_lossy().into_owned(),
        },
        PdfArtifactPayload {
            kind: "text".to_string(),
            path: text_path.to_string_lossy().into_owned(),
        },
        PdfArtifactPayload {
            kind: "json".to_string(),
            path: json_path.to_string_lossy().into_owned(),
        },
    ];
    if let Some(html_path) = first_file_with_extension(&output_dir, "html") {
        artifacts.push(PdfArtifactPayload {
            kind: "html".to_string(),
            path: html_path.to_string_lossy().into_owned(),
        });
    }
    if let Some(pdf_path) = first_file_with_extension(&output_dir, "pdf") {
        artifacts.push(PdfArtifactPayload {
            kind: "pdf".to_string(),
            path: pdf_path.to_string_lossy().into_owned(),
        });
    }

    emit_generation_log(
        app,
        "pdf.extract",
        "PDF cikarma islemi tamamlandi.",
        "success",
        Some(serde_json::json!({
            "mode": if needs_hybrid { "hybrid" } else { "local" },
            "artifacts": artifacts.len()
        })),
    );

    Ok(ExtractPdfDocumentResponse {
        markdown,
        text,
        json_elements,
        pages,
        images: collect_image_paths(&output_dir),
        mode: if needs_hybrid {
            "hybrid".to_string()
        } else {
            "local".to_string()
        },
        artifacts,
    })
}

#[tauri::command]
pub async fn pdf_runtime_status(
    app: AppHandle,
    state: State<'_, PdfRuntimeState>,
) -> Result<PdfRuntimeStatus, String> {
    let runtime_state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || pdf_runtime_status_impl(&app, Some(&runtime_state)))
        .await
        .map_err(|e| format!("PDF çalışma ortamı durumu okunamadı: {e}"))?
}

#[tauri::command]
pub async fn pdf_bootstrap_runtime(app: AppHandle) -> Result<PdfRuntimeStatus, String> {
    tauri::async_runtime::spawn_blocking(move || bootstrap_runtime_impl(&app))
        .await
        .map_err(|e| format!("PDF çalışma ortamı başlatma işlemi sonlandı: {e}"))?
}

#[tauri::command]
pub async fn pdf_hybrid_start(
    app: AppHandle,
    state: State<'_, PdfRuntimeState>,
    config: Option<PdfHybridServerConfig>,
) -> Result<PdfRuntimeStatus, String> {
    let config = config.unwrap_or(PdfHybridServerConfig {
        port: Some(DEFAULT_HYBRID_PORT),
        ..Default::default()
    });
    let runtime_state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || start_hybrid_impl(&app, &runtime_state, config))
        .await
        .map_err(|e| format!("Hibrit arka plan başlatma işlemi sonlandı: {e}"))?
}

#[tauri::command]
pub async fn pdf_hybrid_stop(
    app: AppHandle,
    state: State<'_, PdfRuntimeState>,
) -> Result<PdfRuntimeStatus, String> {
    let runtime_state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || stop_hybrid_impl(&app, &runtime_state))
        .await
        .map_err(|e| format!("Hibrit arka plan durdurma işlemi sonlandı: {e}"))?
}

#[tauri::command]
pub async fn extract_pdf_document(
    app: AppHandle,
    state: State<'_, PdfRuntimeState>,
    req: ExtractPdfDocumentRequest,
) -> Result<ExtractPdfDocumentResponse, String> {
    let runtime_state = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || extract_impl(&app, &runtime_state, req))
        .await
        .map_err(|e| format!("PDF çıkarma işlemi sonlandı: {e}"))?
}

#[tauri::command]
pub async fn extract_pdf_document_payload(
    app: AppHandle,
    state: State<'_, PdfRuntimeState>,
    req: ExtractPdfPayloadRequest,
) -> Result<ExtractPdfDocumentResponse, String> {
    emit_generation_log(
        &app,
        "pdf.payload",
        "PDF payload decode baslatildi.",
        "info",
        Some(serde_json::json!({ "fileName": req.file_name })),
    );
    let file_name = req.file_name.trim();
    if file_name.is_empty() {
        return Err("Dosya adı boş.".to_string());
    }
    let runtime_paths = ensure_runtime_paths(&app)?;
    let temp_input_dir = runtime_paths.jobs_dir.join(format!("payload-{}", now_millis()));
    fs::create_dir_all(&temp_input_dir)
        .map_err(|e| format!("Geçici payload dizini oluşturulamadı: {e}"))?;
    let file_path = temp_input_dir.join(file_name);
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(req.base64.trim())
        .map_err(|e| format!("Payload decode edilemedi: {e}"))?;
    let mut file = File::create(&file_path).map_err(|e| format!("Geçici dosya oluşturulamadı: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Geçici dosya yazılamadı: {e}"))?;
    emit_generation_log(
        &app,
        "pdf.payload",
        "Payload gecici dosyaya yazildi.",
        "success",
        Some(serde_json::json!({ "tempPath": file_path.to_string_lossy(), "bytes": bytes.len() })),
    );

    let result = extract_pdf_document(
        app.clone(),
        state,
        ExtractPdfDocumentRequest {
            path: file_path.to_string_lossy().into_owned(),
            options: req.options,
            requested_formats: req.requested_formats,
        },
    )
    .await;

    let _ = fs::remove_dir_all(&temp_input_dir);
    emit_generation_log(
        &app,
        "pdf.payload",
        "Payload gecici dosyalari temizlendi.",
        "info",
        None,
    );
    result
}

#[tauri::command]
pub fn read_pdf_file_info(path: String) -> Result<ReadPdfFileInfoResponse, String> {
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

    let metadata = fs::metadata(file_path).map_err(|e| format!("PDF meta verileri okunamadı: {e}"))?;
    let file_name = file_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("document.pdf")
        .to_string();

    Ok(ReadPdfFileInfoResponse {
        file_name,
        size_bytes: metadata.len(),
    })
}
