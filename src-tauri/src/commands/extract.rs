use std::fs::{self, File};
use std::path::Path;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, serde::Serialize)]
pub struct ExtractProgressPayload {
    pub percent: f64,
}

#[tauri::command]
pub async fn extract_img_from_tar_xz(
    app_handle: AppHandle,
    archive_path: String,
    dest_dir: String,
) -> Result<String, String> {
    let archive_path = Path::new(&archive_path);
    let dest_dir = Path::new(&dest_dir);

    fs::create_dir_all(dest_dir).map_err(|e| format!("Failed to create dest dir: {}", e))?;

    let file = File::open(archive_path).map_err(|e| format!("Failed to open archive: {}", e))?;
    drop(file);

    let file = File::open(archive_path).map_err(|e| format!("Failed to open archive: {}", e))?;
    let buf_reader = std::io::BufReader::new(file);
    let xz_decoder = xz2::read::XzDecoder::new(buf_reader);
    let mut archive = tar::Archive::new(xz_decoder);

    let mut img_path: Option<String> = None;

    let entries: Vec<_> = archive
        .entries()
        .map_err(|e| format!("Failed to read archive entries: {}", e))?
        .filter_map(|e| e.ok())
        .collect();

    let total_entries = entries.len() as f64;

    for (i, mut entry) in entries.into_iter().enumerate() {
        let path = entry.path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
        let is_img = path.ends_with(".img");

        if is_img {
            let dest_path = dest_dir.join(
                Path::new(&path)
                    .file_name()
                    .unwrap_or_else(|| std::ffi::OsStr::new("image.img")),
            );
            entry
                .unpack(&dest_path)
                .map_err(|e| format!("Failed to extract {}: {}", path, e))?;
            img_path = Some(dest_path.to_string_lossy().to_string());
        }

        let percent = ((i + 1) as f64 / total_entries) * 100.0;
        let _ = app_handle.emit(
            "extract_progress",
            ExtractProgressPayload { percent },
        );
    }

    img_path.ok_or_else(|| "No .img file found in archive".to_string())
}
