# Backend Architecture and Commands

The Rust backend is organized as a library crate (`parch_iso_writer_lib`) with four command modules.

## Download Module (`commands/download.rs`)

Downloads ISO from Parch Linux mirror with resume support. Uses `reqwest` byte-stream, appends to `.part` file if resuming, and checks a cancellation `AtomicBool` between chunks:

```rust
pub async fn download_release(
    app_handle: AppHandle,
    url: String,
    dest_path: String,
) -> Result<(), String> {
    set_cancel_flag(false);
    let temp_path = format!("{}.part", dest_path);

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

    let mut stream = response.bytes_stream();
    let mut downloaded = resume_offset;

    while let Some(chunk) = stream.next().await {
        if is_cancelled() {
            return Err("Download cancelled".to_string());
        }
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        // emit download_progress event every 250ms
    }
}
```

Every 250ms it emits a `DownloadProgressPayload` with `downloaded_bytes`, `total_bytes`, `speed_bps`, and `eta_secs`.

After download completes, checksum verification uses `fetch_checksum` (parses the mirror's checksum file) and `verify_checksum` (computes MD5 or SHA256 of the downloaded file and compares to the expected value).

## Drives Module (`commands/drives.rs`)

Detects USB drives using platform-specific commands. On Linux it runs `lsblk --json -o NAME,SIZE,TYPE,RM,MODEL,VENDOR,MOUNTPOINT` and filters for `TYPE == "disk"`, `RM == "1"`:

```rust
pub fn list_usb_drives() -> Vec<UsbDrive> {
    let output = Command::new("lsblk")
        .args(["--json", "-o", "NAME,SIZE,TYPE,RM,MODEL,VENDOR,MOUNTPOINT"])
        .output().ok()?;

    let parsed: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;
    let devices = parsed["blockdevices"].as_array()?;
    // filter for disk type, removable true
}
```

A polling thread runs `list_usb_drives` every 2 seconds and emits `usb_changed` when the list changes, allowing the frontend DriveStep to update in real time.

## Extract Module (`commands/extract.rs`)

Handles `.tar.xz` archives for ARM/Raspberry Pi releases. Uses `xz2` and `tar` crates to decompress and extract, looking for files with `.img` extension:

```rust
pub fn extract_img_from_tar_xz(archive_path: String, dest_dir: String) -> Result<String, String> {
    let file = File::open(&archive_path).map_err(...)?;
    let decoder = xz2::read::XzDecoder::new(file);
    let mut archive = Archive::new(decoder);
    let mut extracted_path = None;
    let total = archive.entries().count();
    for (i, entry) in archive.entries().enumerate() { ... }
}
```

Emits `extract_progress` events as entries are processed.

## Flash Module (`commands/flash.rs`)

The most complex module. Defines `FlashProgressPayload` and the `flash_image` Tauri command:

```rust
pub async fn flash_image(
    app_handle: AppHandle,
    source_path: String,
    device_path: String,
) -> Result<(), String> {
    set_flash_cancel_flag(false);
    // unmount partitions on Linux/macOS
    // open source file, try to open device
    // if PermissionDenied -> elevated_flash_write (pkexec re-invoke)
    // else direct copy loop
}
```

The direct copy loop reads 8 MiB chunks, writes to device, emits `flash_progress` every 250ms.

The elevated path re-invokes the same binary with `pkexec <exe> --flash-elevated <source> <device>`. The child (`flash_image_elevated_cli`) does the same copy loop but outputs JSON to stdout instead of emitting events. The parent reads stdout lines in a loop and emits Tauri events. If cancelled, the parent kills the child.

See `docs/flashing.md` for the full code.
