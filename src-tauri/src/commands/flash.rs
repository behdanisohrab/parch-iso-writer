use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, ErrorKind, Read, Write};
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, serde::Serialize)]
pub struct FlashProgressPayload {
    pub written_bytes: u64,
    pub total_bytes: u64,
    pub speed_bps: f64,
}

lazy_static::lazy_static! {
    static ref FLASH_CANCEL_TOKEN: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
}

pub fn set_flash_cancel_flag(val: bool) {
    FLASH_CANCEL_TOKEN.store(val, Ordering::SeqCst);
}

pub fn is_flash_cancelled() -> bool {
    FLASH_CANCEL_TOKEN.load(Ordering::SeqCst)
}

#[tauri::command]
pub async fn cancel_flash() -> Result<(), String> {
    set_flash_cancel_flag(true);
    Ok(())
}

#[tauri::command]
pub async fn flash_image(
    app_handle: AppHandle,
    source_path: String,
    device_path: String,
) -> Result<(), String> {
    set_flash_cancel_flag(false);
    let source_path = Path::new(&source_path);
    let device_path = Path::new(&device_path);

    let source_meta = fs::metadata(source_path)
        .map_err(|e| format!("Cannot open source: {}", e))?;

    #[cfg(target_os = "linux")]
    {
        unmount_device_linux(&device_path)?;
    }
    #[cfg(target_os = "macos")]
    {
        unmount_device_macos(&device_path)?;
    }

    let mut source =
        File::open(source_path).map_err(|e| format!("Cannot open source: {}", e))?;
    let mut dest = match OpenOptions::new()
        .write(true)
        .read(true)
        .open(device_path)
        .or_else(|_| {
            OpenOptions::new()
                .write(true)
                .open(device_path)
                .map_err(|e| e)
        }) {
        Ok(dest) => dest,
        Err(err) if err.kind() == ErrorKind::PermissionDenied => {
            elevated_flash_write(&app_handle, source_path, device_path)?;
            return verify_first_block(source_path, device_path);
        }
        Err(err) => return Err(format_open_device_error(&err, None)),
    };

    let total_bytes = source_meta.len();
    let buffer_size: usize = 8 * 1024 * 1024;
    let mut buffer = vec![0u8; buffer_size];
    let mut written: u64 = 0;
    let mut last_time = Instant::now();
    let mut last_written: u64 = 0;

    loop {
        if is_flash_cancelled() {
            return Err("Flashing cancelled".to_string());
        }
        let n = source
            .read(&mut buffer)
            .map_err(|e| format!("Read error: {}", e))?;
        if n == 0 {
            break;
        }
        dest.write_all(&buffer[..n])
            .map_err(|e| format!("Write error: {}. Device may be disconnected or protected.", e))?;
        written += n as u64;

        let now = Instant::now();
        let elapsed = now.duration_since(last_time).as_secs_f64();
        if elapsed >= 0.25 {
            let bytes_since = written.saturating_sub(last_written);
            let speed_bps = bytes_since as f64 / elapsed;
            let _ = app_handle.emit(
                "flash_progress",
                FlashProgressPayload {
                    written_bytes: written,
                    total_bytes,
                    speed_bps,
                },
            );
            last_time = now;
            last_written = written;
        }
    }

    let _ = app_handle.emit(
        "flash_progress",
        FlashProgressPayload {
            written_bytes: total_bytes,
            total_bytes,
            speed_bps: 0.0,
        },
    );

    dest.flush().map_err(|e| format!("Flush error: {}", e))?;
    drop(dest);
    drop(source);

    verify_first_block(source_path, device_path)
}

/// Called when running as --flash-elevated <source> <device> (elevated subprocess).
/// Writes progress as JSON lines to stdout so the parent process can read it.
pub fn flash_image_elevated_cli(source_path: &str, device_path: &str) -> Result<(), String> {
    let source_path = Path::new(source_path);
    let device_path = Path::new(device_path);

    #[cfg(target_os = "linux")]
    {
        unmount_device_linux(device_path)?;
    }
    #[cfg(target_os = "macos")]
    {
        unmount_device_macos(device_path)?;
    }

    let source_meta = fs::metadata(source_path)
        .map_err(|e| format!("Cannot open source: {}", e))?;
    let total_bytes = source_meta.len();

    let mut source = File::open(source_path).map_err(|e| format!("Cannot open source: {}", e))?;
    let mut dest = OpenOptions::new()
        .write(true)
        .read(true)
        .open(device_path)
        .or_else(|_| OpenOptions::new().write(true).open(device_path))
        .map_err(|e| format!("Cannot open device for writing: {}", e))?;

    let mut buffer = vec![0u8; 8 * 1024 * 1024];
    let mut written: u64 = 0;
    let mut last_time = Instant::now();
    let mut last_written: u64 = 0;

    loop {
        let n = source
            .read(&mut buffer)
            .map_err(|e| format!("Read error: {}", e))?;
        if n == 0 {
            break;
        }
        dest.write_all(&buffer[..n])
            .map_err(|e| format!("Write error: {}", e))?;
        written += n as u64;

        let now = Instant::now();
        let elapsed = now.duration_since(last_time).as_secs_f64();
        if elapsed >= 0.25 {
            let bytes_since = written.saturating_sub(last_written);
            let speed_bps = bytes_since as f64 / elapsed;
            let line = serde_json::json!({
                "written_bytes": written,
                "total_bytes": total_bytes,
                "speed_bps": speed_bps,
            });
            let _ = writeln!(std::io::stdout(), "{}", line);
            let _ = std::io::stdout().flush();
            last_time = now;
            last_written = written;
        }
    }

    let line = serde_json::json!({
        "written_bytes": total_bytes,
        "total_bytes": total_bytes,
        "speed_bps": 0.0,
    });
    let _ = writeln!(std::io::stdout(), "{}", line);
    let _ = std::io::stdout().flush();

    dest.flush().map_err(|e| format!("Flush error: {}", e))?;
    drop(dest);
    drop(source);

    verify_first_block(source_path, device_path)
}

fn elevated_flash_write(app_handle: &AppHandle, source_path: &Path, device_path: &Path) -> Result<(), String> {
    let exe = std::env::current_exe()
        .map_err(|e| format!("Cannot resolve current executable: {}", e))?;

    let total_bytes = fs::metadata(source_path).map(|m| m.len()).unwrap_or(0);

    #[cfg(target_os = "linux")]
    {
        let mut child = Command::new("pkexec")
            .args([
                &exe.to_string_lossy(),
                "--flash-elevated",
                &source_path.to_string_lossy(),
                &device_path.to_string_lossy(),
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("Failed to start pkexec: {}", e))?;

        let stdout = child.stdout.take().ok_or("No stdout from pkexec")?;
        let reader = BufReader::new(stdout);
        let mut last_emit = Instant::now();

        for line in reader.lines() {
            if is_flash_cancelled() {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Flashing cancelled".to_string());
            }
            if let Ok(line) = line {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(bytes) = val["written_bytes"].as_u64() {
                        let now = Instant::now();
                        let elapsed = now.duration_since(last_emit).as_secs_f64();
                        if elapsed >= 0.25 || bytes >= total_bytes {
                            let speed = val["speed_bps"].as_f64().unwrap_or(0.0);
                            let _ = app_handle.emit(
                                "flash_progress",
                                FlashProgressPayload {
                                    written_bytes: bytes,
                                    total_bytes,
                                    speed_bps: speed,
                                },
                            );
                            last_emit = now;
                        }
                        if bytes >= total_bytes {
                            break;
                        }
                    }
                }
            }
        }

        let mut child_status: Option<std::process::ExitStatus> = None;
        for _ in 0..120 {
            if is_flash_cancelled() {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Flashing cancelled".to_string());
            }
            match child.try_wait() {
                Ok(Some(status)) => {
                    child_status = Some(status);
                    break;
                }
                Ok(None) => {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                }
                Err(e) => return Err(format!("Wait error: {}", e)),
            }
        }

        let status = match child_status {
            Some(s) => s,
            None => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Flashing timed out after 60 seconds waiting for device sync".to_string());
            }
        };

        if total_bytes > 0 {
            let _ = app_handle.emit(
                "flash_progress",
                FlashProgressPayload {
                    written_bytes: total_bytes,
                    total_bytes,
                    speed_bps: 0.0,
                },
            );
        }

        if status.success() {
            return Ok(());
        }
        return Err(format!("pkexec exited with status {}", status));
    }

    #[cfg(target_os = "macos")]
    {
        let script = format!(
            "do shell script \"'{}' --flash-elevated '{}' '{}'\" with administrator privileges",
            exe.to_string_lossy(),
            source_path.to_string_lossy().replace('\'', "'\"'\"'"),
            device_path.to_string_lossy().replace('\'', "'\"'\"'")
        );
        let mut child = Command::new("osascript")
            .args(["-e", &script])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to start osascript: {}", e))?;

        let stdout = child.stdout.take().ok_or("No stdout from osascript")?;
        let reader = BufReader::new(stdout);
        let mut last_emit = Instant::now();

        for line in reader.lines() {
            if is_flash_cancelled() {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Flashing cancelled".to_string());
            }
            if let Ok(line) = line {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(bytes) = val["written_bytes"].as_u64() {
                        let now = Instant::now();
                        let elapsed = now.duration_since(last_emit).as_secs_f64();
                        if elapsed >= 0.25 || bytes >= total_bytes {
                            let speed = val["speed_bps"].as_f64().unwrap_or(0.0);
                            let _ = app_handle.emit(
                                "flash_progress",
                                FlashProgressPayload {
                                    written_bytes: bytes,
                                    total_bytes,
                                    speed_bps: speed,
                                },
                            );
                            last_emit = now;
                        }
                    }
                }
            }
        }

        let status = child.wait().map_err(|e| format!("Wait error: {}", e))?;

        if total_bytes > 0 {
            let _ = app_handle.emit(
                "flash_progress",
                FlashProgressPayload {
                    written_bytes: total_bytes,
                    total_bytes,
                    speed_bps: 0.0,
                },
            );
        }

        if status.success() {
            return Ok(());
        }
        return Err(format!("osascript exited with status {}", status));
    }

    #[cfg(target_os = "windows")]
    {
        let args = format!(
            "--flash-elevated \"{}\" \"{}\"",
            source_path.to_string_lossy(),
            device_path.to_string_lossy()
        );
        let mut child = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Start-Process",
                "-Verb",
                "RunAs",
                "-FilePath",
                &exe.to_string_lossy(),
                "-ArgumentList",
                &args,
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to request UAC elevation: {}", e))?;

        let stdout = child.stdout.take().ok_or("No stdout from powershell")?;
        let reader = BufReader::new(stdout);
        let mut last_emit = Instant::now();

        for line in reader.lines() {
            if is_flash_cancelled() {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Flashing cancelled".to_string());
            }
            if let Ok(line) = line {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(bytes) = val["written_bytes"].as_u64() {
                        let now = Instant::now();
                        let elapsed = now.duration_since(last_emit).as_secs_f64();
                        if elapsed >= 0.25 || bytes >= total_bytes {
                            let speed = val["speed_bps"].as_f64().unwrap_or(0.0);
                            let _ = app_handle.emit(
                                "flash_progress",
                                FlashProgressPayload {
                                    written_bytes: bytes,
                                    total_bytes,
                                    speed_bps: speed,
                                },
                            );
                            last_emit = now;
                        }
                    }
                }
            }
        }

        let status = child.wait().map_err(|e| format!("Wait error: {}", e))?;

        if total_bytes > 0 {
            let _ = app_handle.emit(
                "flash_progress",
                FlashProgressPayload {
                    written_bytes: total_bytes,
                    total_bytes,
                    speed_bps: 0.0,
                },
            );
        }

        if status.success() {
            return Ok(());
        }
        return Err(format!("PowerShell exited with status {}", status));
    }

    #[allow(unreachable_code)]
    Err("Unsupported platform".to_string())
}

fn verify_first_block(source_path: &Path, device_path: &Path) -> Result<(), String> {
    let mut source = File::open(source_path).map_err(|e| e.to_string())?;
    let mut dest = File::open(device_path).map_err(|e| e.to_string())?;

    let mut src_first = [0u8; 512];
    let mut dst_first = [0u8; 512];
    source.read_exact(&mut src_first).map_err(|e| e.to_string())?;
    dest.read_exact(&mut dst_first).map_err(|e| e.to_string())?;

    if src_first != dst_first {
        return Err("Verification failed: written data does not match source".to_string());
    }

    Ok(())
}

fn format_open_device_error(err: &std::io::Error, elevate_err: Option<&str>) -> String {
    if err.kind() == ErrorKind::PermissionDenied {
        #[cfg(target_os = "windows")]
        {
            return "Cannot open device for writing: Permission denied (os error 13). A UAC elevation prompt was requested; approve it and retry in the elevated app window.".to_string();
        }
        #[cfg(target_os = "macos")]
        {
            return if let Some(detail) = elevate_err {
                format!(
                    "Cannot open device for writing: Permission denied (os error 13). Password prompt failed on macOS: {}",
                    detail
                )
            } else {
                "Cannot open device for writing: Permission denied (os error 13). Password prompt shown; approve admin access to continue.".to_string()
            };
        }
        #[cfg(target_os = "linux")]
        {
            return if let Some(detail) = elevate_err {
                format!(
                    "Cannot open device for writing: Permission denied (os error 13). Password prompt failed on Linux: {}",
                    detail
                )
            } else {
                "Cannot open device for writing: Permission denied (os error 13). Password prompt shown; approve admin access to continue.".to_string()
            };
        }
    }
    format!(
        "Cannot open device for writing: {}. Try running with elevated privileges.",
        err
    )
}

#[cfg(target_os = "linux")]
fn unmount_device_linux(device: &Path) -> Result<(), String> {
    let device_str = device.to_string_lossy();
    let parts_output = Command::new("lsblk")
        .args(["-J", "-o", "NAME,MOUNTPOINT"])
        .output()
        .map_err(|e| format!("lsblk failed: {}", e))?;
    let stdout = String::from_utf8_lossy(&parts_output.stdout);
    let json: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("JSON parse: {}", e))?;

    let device_name = device_str
        .trim_start_matches("/dev/");
    let mut partitions = Vec::new();

    if let Some(devices) = json["blockdevices"].as_array() {
        collect_partitions(devices, device_name, &mut partitions);
    }

    for part in &partitions {
        if !part.1.is_empty() {
            let output = Command::new("umount")
                .arg(part.1.as_str())
                .output();
            if let Ok(o) = output {
                if !o.status.success() {
                    let stderr = String::from_utf8_lossy(&o.stderr);
                    log::warn!("umount warning for {}: {}", part.1, stderr);
                }
            }
        }
    }

    Ok(())
}

#[cfg(target_os = "linux")]
fn collect_partitions(
    devices: &[serde_json::Value],
    target: &str,
    out: &mut Vec<(String, String)>,
) {
    for dev in devices {
        let name = dev["name"].as_str().unwrap_or("");
        let mnt = dev["mountpoint"].as_str().unwrap_or("").to_string();
        if name == target {
            out.push((name.to_string(), mnt));
        } else if name.starts_with(target) {
            out.push((name.to_string(), mnt));
        }
        if let Some(children) = dev["children"].as_array() {
            collect_partitions(children, target, out);
        }
    }
}

#[cfg(target_os = "macos")]
fn unmount_device_macos(device: &Path) -> Result<(), String> {
    let device_str = device.to_string_lossy();
    let output = Command::new("diskutil")
        .args(["unmountDisk", &device_str])
        .output()
        .map_err(|e| format!("diskutil unmountDisk failed: {}", e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to unmount disk: {}", stderr));
    }
    Ok(())
}
