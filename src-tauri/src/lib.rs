mod commands;
mod releases;

use commands::download::{
    cancel_download, download_release, fetch_checksum, verify_checksum,
};
use commands::drives::{list_usb_drives, start_drive_polling};
use commands::extract::extract_img_from_tar_xz;
use commands::flash::{cancel_flash, flash_image};
use releases::{Release, RELEASES};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ImageInfo {
    pub is_valid: bool,
    pub kind: String,
    pub label: String,
    pub size_bytes: u64,
}

#[tauri::command]
fn get_releases() -> Vec<&'static Release> {
    RELEASES.iter().collect()
}

#[tauri::command]
fn validate_image(path: String) -> ImageInfo {
    let path = std::path::Path::new(&path);
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let size_bytes = std::fs::metadata(path)
        .map(|m| m.len())
        .unwrap_or(0);

    let (kind, is_valid) = match extension.as_str() {
        "iso" => ("iso", true),
        "img" => ("img", true),
        "xz" => {
            let name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");
            if name.contains(".tar.xz") || name.ends_with(".tar.xz") {
                ("tarxz", true)
            } else {
                ("unknown", false)
            }
        }
        _ => {
            let bytes = std::fs::read(path).unwrap_or_default();
            if bytes.len() > 4 {
                let magic = &bytes[..4];
                if magic == [0x7f, 0x45, 0x4c, 0x46] {
                    return ImageInfo {
                        is_valid: false,
                        kind: "elf".to_string(),
                        label: "This is an executable, not a disk image".to_string(),
                        size_bytes,
                    };
                }
                if magic == [0xfd, 0x37, 0x7a, 0x58] {
                    return ImageInfo {
                        is_valid: true,
                        kind: "tarxz".to_string(),
                        label: "XZ compressed archive (likely contains .img)".to_string(),
                        size_bytes,
                    };
                }
            }
            ("unknown", false)
        }
    };

    let label = format!(
        "{:.1} {} {}",
        size_bytes as f64 / (1024.0 * 1024.0 * 1024.0),
        if size_bytes >= 1024u64.pow(3) { "GB" } else { "MB" },
        path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
    );

    ImageInfo {
        is_valid,
        kind: kind.to_string(),
        label,
        size_bytes,
    }
}

#[tauri::command]
fn open_file_picker() -> Option<String> {
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_releases,
            validate_image,
            open_file_picker,
            list_usb_drives,
            download_release,
            cancel_download,
            fetch_checksum,
            verify_checksum,
            extract_img_from_tar_xz,
            flash_image,
            cancel_flash,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            start_drive_polling(handle);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn try_run_elevated_flash_from_args() -> Result<bool, String> {
    let mut args = std::env::args().skip(1);
    let Some(flag) = args.next() else {
        return Ok(false);
    };
    if flag != "--flash-elevated" {
        return Ok(false);
    }
    let source = args
        .next()
        .ok_or_else(|| "Missing source path for --flash-elevated".to_string())?;
    let device = args
        .next()
        .ok_or_else(|| "Missing device path for --flash-elevated".to_string())?;
    commands::flash::flash_image_elevated_cli(&source, &device)?;
    Ok(true)
}
