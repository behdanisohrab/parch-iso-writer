use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::Emitter;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct UsbDrive {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub is_removable: bool,
    pub vendor: String,
    pub model: String,
}

#[tauri::command]
pub fn list_usb_drives() -> Vec<UsbDrive> {
    detect_usb_drives()
}

fn detect_usb_drives() -> Vec<UsbDrive> {
    #[cfg(target_os = "linux")]
    {
        detect_usb_drives_linux()
    }
    #[cfg(target_os = "macos")]
    {
        detect_usb_drives_macos()
    }
    #[cfg(target_os = "windows")]
    {
        detect_usb_drives_windows()
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    {
        Vec::new()
    }
}

#[cfg(target_os = "linux")]
fn detect_usb_drives_linux() -> Vec<UsbDrive> {
    let output = Command::new("lsblk")
        .args(["-b", "-J", "-o", "NAME,SIZE,TYPE,RM,MODEL,VENDOR,MOUNTPOINT"])
        .output();
    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return Vec::new(),
    };
    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = match serde_json::from_str(&stdout) {
        Ok(v) => v,
        _ => return Vec::new(),
    };
    let mut drives = Vec::new();
    if let Some(blockdevices) = json["blockdevices"].as_array() {
        for device in blockdevices {
            let dtype = device["type"].as_str().unwrap_or("");
            if dtype != "disk" {
                continue;
            }
            let rm = parse_bool_like(&device["rm"]);
            let name = device["name"].as_str().unwrap_or("");
            let size_bytes = parse_u64_like(&device["size"]);
            let model = device["model"].as_str().unwrap_or("").trim().to_string();
            let vendor = device["vendor"].as_str().unwrap_or("").trim().to_string();

            drives.push(UsbDrive {
                path: format!("/dev/{}", name),
                name: if !model.is_empty() {
                    model.clone()
                } else if !vendor.is_empty() {
                    vendor.clone()
                } else {
                    format!("/dev/{}", name)
                },
                size_bytes,
                is_removable: rm,
                vendor,
                model,
            });
        }
    }
    drives
}

#[cfg(target_os = "linux")]
fn parse_u64_like(value: &serde_json::Value) -> u64 {
    if let Some(n) = value.as_u64() {
        return n;
    }
    value
        .as_str()
        .unwrap_or("0")
        .trim()
        .replace(',', "")
        .parse::<u64>()
        .unwrap_or(0)
}

#[cfg(target_os = "linux")]
fn parse_bool_like(value: &serde_json::Value) -> bool {
    if let Some(b) = value.as_bool() {
        return b;
    }
    if let Some(n) = value.as_u64() {
        return n != 0;
    }
    matches!(value.as_str().unwrap_or("").trim(), "1" | "true" | "True")
}

#[cfg(target_os = "macos")]
fn detect_usb_drives_macos() -> Vec<UsbDrive> {
    let output = Command::new("diskutil")
        .args(["list", "-plist", "external"])
        .output();
    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return Vec::new(),
    };
    let plist_data = output.stdout;
    let plist: plist::Value = match plist::from_bytes(&plist_data) {
        Ok(v) => v,
        _ => return Vec::new(),
    };
    let mut drives = Vec::new();
    if let Some(disks) = plist.as_dictionary().and_then(|d| d.get("AllDisks")) {
        if let Some(disk_ids) = disks.as_array() {
            for disk_id in disk_ids {
                let id = disk_id.as_string().unwrap_or("");
                if id.is_empty() {
                    continue;
                }
                let info_output = Command::new("diskutil")
                    .args(["info", "-plist", id])
                    .output();
                if let Ok(info) = info_output {
                    if info.status.success() {
                        let info_plist: plist::Value =
                            match plist::from_bytes(&info.stdout) {
                                Ok(v) => v,
                                _ => continue,
                            };
                        if let Some(dict) = info_plist.as_dictionary() {
                            let removable = dict
                                .get("RemovableMedia")
                                .and_then(|v| v.as_boolean())
                                .unwrap_or(false);
                            let size = dict
                                .get("TotalSize")
                                .and_then(|v| v.as_unsigned_integer())
                                .unwrap_or(0);
                            let vendor =
                                dict.get("DeviceVendor")
                                    .and_then(|v| v.as_string())
                                    .unwrap_or("")
                                    .to_string();
                            let model =
                                dict.get("DeviceModel")
                                    .and_then(|v| v.as_string())
                                    .unwrap_or("")
                                    .to_string();
                            drives.push(UsbDrive {
                                path: format!("/dev/{}", id),
                                name: if !model.is_empty() {
                                    model.clone()
                                } else {
                                    id.to_string()
                                },
                                size_bytes: size,
                                is_removable: removable,
                                vendor,
                                model,
                            });
                        }
                    }
                }
            }
        }
    }
    drives
}

#[cfg(target_os = "windows")]
fn detect_usb_drives_windows() -> Vec<UsbDrive> {
    let output = Command::new("wmic")
        .args(["diskdrive", "get", "DeviceID,Model,Size,MediaType", "/format:csv"])
        .output();
    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return Vec::new(),
    };
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut drives = Vec::new();
    for line in stdout.lines().skip(1) {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() < 4 {
            continue;
        }
        let path = parts.get(1).unwrap_or(&"").trim().to_string();
        let model = parts.get(2).unwrap_or(&"").trim().to_string();
        let size_str = parts.get(3).unwrap_or(&"0").trim();
        let media_type = parts.get(4).unwrap_or(&"").trim();

        let size_bytes = size_str.parse::<u64>().unwrap_or(0);
        let is_removable = media_type.to_lowercase().contains("usb")
            || media_type.to_lowercase().contains("removable");

        drives.push(UsbDrive {
            path: path.replace("\\\\.\\", ""),
            name: model.clone(),
            size_bytes,
            is_removable,
            vendor: String::new(),
            model,
        });
    }
    drives
}

pub fn start_drive_polling(app_handle: tauri::AppHandle) {
    let handle = app_handle.clone();
    std::thread::spawn(move || {
        let mut prev_drives: Vec<UsbDrive> = Vec::new();
        loop {
            let drives = detect_usb_drives();
            if drives != prev_drives {
                let _ = handle.emit("usb_changed", &drives);
                prev_drives = drives;
            }
            std::thread::sleep(std::time::Duration::from_secs(2));
        }
    });
}
