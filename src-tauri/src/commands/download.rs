use crate::releases::parse_checksum_file;
use md5::{Digest as Md5Digest, Md5};
use reqwest::header::{HeaderValue, RANGE};
use sha2::Sha256;
use std::fs::{self, File};
use std::io::Read;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;

lazy_static::lazy_static! {
    static ref CANCEL_TOKEN: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
}

pub fn set_cancel_flag(val: bool) {
    CANCEL_TOKEN.store(val, Ordering::SeqCst);
}

pub fn is_cancelled() -> bool {
    CANCEL_TOKEN.load(Ordering::SeqCst)
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DownloadProgressPayload {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub speed_bps: f64,
    pub eta_secs: f64,
}

#[tauri::command]
pub async fn download_release(
    app_handle: AppHandle,
    url: String,
    dest_path: String,
) -> Result<(), String> {
    set_cancel_flag(false);
    let temp_path = format!("{}.part", dest_path);

    let client = reqwest::Client::builder()
        .user_agent("ParchISOWriter/0.1.0")
        .build()
        .map_err(|e| e.to_string())?;

    let resume_offset = if Path::new(&temp_path).exists() {
        fs::metadata(&temp_path).map(|m| m.len()).unwrap_or(0)
    } else {
        0
    };

    let mut req = client.get(&url);
    if resume_offset > 0 {
        let range_val = HeaderValue::from_str(&format!("bytes={}-", resume_offset))
            .map_err(|e| e.to_string())?;
        req = req.header(RANGE, range_val);
    }

    let response = req.send().await.map_err(|e| e.to_string())?;
    let total_size = response
        .content_length()
        .unwrap_or(0)
        .saturating_add(resume_offset);
    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP {}", status));
    }

    let mut file = tokio::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&temp_path)
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    let mut downloaded = resume_offset;
    let mut last_time = std::time::Instant::now();
    let mut last_bytes = downloaded;

    use futures_util::StreamExt;
    while let Some(chunk_result) = stream.next().await {
        if is_cancelled() {
            return Err("Download cancelled".to_string());
        }
        let chunk = chunk_result.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        let now = std::time::Instant::now();
        let elapsed = now.duration_since(last_time).as_secs_f64();
        if elapsed >= 0.25 {
            let bytes_since = downloaded.saturating_sub(last_bytes);
            let speed_bps = bytes_since as f64 / elapsed;
            let remaining = total_size.saturating_sub(downloaded);
            let eta_secs = if speed_bps > 0.0 {
                remaining as f64 / speed_bps
            } else {
                0.0
            };
            let _ = app_handle.emit(
                "download_progress",
                DownloadProgressPayload {
                    downloaded_bytes: downloaded,
                    total_bytes: total_size,
                    speed_bps,
                    eta_secs,
                },
            );
            last_time = now;
            last_bytes = downloaded;
        }
    }
    file.flush().await.map_err(|e| e.to_string())?;
    drop(file);

    tokio::fs::rename(&temp_path, &dest_path)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn cancel_download() -> Result<(), String> {
    set_cancel_flag(true);
    Ok(())
}

#[tauri::command]
pub async fn fetch_checksum(
    checksum_url: String,
    target_filename: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("ParchISOWriter/0.1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client.get(&checksum_url).send().await.map_err(|e| e.to_string())?;
    let text = response.text().await.map_err(|e| e.to_string())?;
    parse_checksum_file(&text, &target_filename)
        .ok_or_else(|| "Could not parse checksum from file".to_string())
}

#[tauri::command]
pub async fn verify_checksum(
    file_path: String,
    expected: String,
    kind: String,
) -> Result<bool, String> {
    let mut file = File::open(&file_path).map_err(|e| e.to_string())?;
    let expected = expected.trim().to_lowercase();

    match kind.to_lowercase().as_str() {
        "md5" => {
            let mut hasher = Md5::new();
            let mut buffer = [0u8; 8192];
            loop {
                let n = file.read(&mut buffer).map_err(|e| e.to_string())?;
                if n == 0 {
                    break;
                }
                hasher.update(&buffer[..n]);
            }
            let result = format!("{:x}", hasher.finalize());
            Ok(result == expected)
        }
        "sha256" => {
            let mut hasher = Sha256::new();
            let mut buffer = [0u8; 8192];
            loop {
                let n = file.read(&mut buffer).map_err(|e| e.to_string())?;
                if n == 0 {
                    break;
                }
                hasher.update(&buffer[..n]);
            }
            let result = format!("{:x}", hasher.finalize());
            Ok(result == expected)
        }
        _ => Err(format!("Unknown checksum kind: {}", kind)),
    }
}
