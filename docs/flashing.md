# Flash Writing Subsystem

The flash subsystem is the core of Parch ISO Writer. It writes OS images to USB block devices with privilege elevation, real-time progress, and cancel support. It follows the balenaEtcher architecture: when direct write fails with `PermissionDenied`, the application re-invokes itself via `pkexec` (Linux), `osascript` (macOS), or `PowerShell RunAs` (Windows) with `--flash-elevated`.

## Flash Command and Elevation Decision

```rust
pub async fn flash_image(
    app_handle: AppHandle,
    source_path: String,
    device_path: String,
) -> Result<(), String> {
    set_flash_cancel_flag(false);
    // On Linux/macOS, unmount partitions first

    let source_meta = fs::metadata(source_path)?;
    let source = File::open(source_path)?;
    let dest = match OpenOptions::new()
        .write(true).read(true).open(device_path)
        .or_else(|_| OpenOptions::new().write(true).open(device_path))
    {
        Ok(dest) => dest,
        Err(err) if err.kind() == ErrorKind::PermissionDenied => {
            elevated_flash_write(&app_handle, source_path, device_path)?;
            return verify_first_block(source_path, device_path);
        }
        Err(err) => return Err(format_open_device_error(&err)),
    };
    // direct path: copy loop with Tauri events
}
```

## Direct Copy Loop (in-process, no elevation needed)

```rust
let buffer_size: usize = 8 * 1024 * 1024;
let mut buffer = vec![0u8; buffer_size];
let mut written: u64 = 0;

loop {
    if is_flash_cancelled() {
        return Err("Flashing cancelled".to_string());
    }
    let n = source.read(&mut buffer)?;
    if n == 0 { break; }
    dest.write_all(&buffer[..n])?;
    written += n as u64;

    if elapsed >= 0.25 {
        let speed_bps = bytes_since as f64 / elapsed;
        let _ = app_handle.emit("flash_progress", FlashProgressPayload { ... });
    }
}
```

## Elevated Path (re-invoke via pkexec)

The parent spawns `pkexec <exe> --flash-elevated <source> <device>`, captures its stdout, and reads JSON progress lines:

```rust
fn elevated_flash_write(app_handle: &AppHandle, source_path: &Path, device_path: &Path) -> Result<(), String> {
    let exe = std::env::current_exe()?;
    let mut child = Command::new("pkexec")
        .args([&exe, "--flash-elevated", source_path, device_path])
        .stdout(Stdio::piped())
        .spawn()?;

    let reader = BufReader::new(child.stdout.take()?);

    for line in reader.lines() {
        if is_flash_cancelled() {
            let _ = child.kill();
            return Err("Flashing cancelled".to_string());
        }
        if let Ok(line) = line {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(bytes) = val["written_bytes"].as_u64() {
                    if elapsed >= 0.25 || bytes >= total_bytes {
                        app_handle.emit("flash_progress", FlashProgressPayload { ... });
                    }
                    if bytes >= total_bytes {
                        break;
                    }
                }
            }
        }
    }

    // Poll child exit with 60s timeout
    for _ in 0..120 {
        match child.try_wait() {
            Ok(Some(status)) => { ... }
            Ok(None) => thread::sleep(Duration::from_millis(500)),
            Err(e) => return Err(...),
        }
    }
}
```

## Elevated Child Process (CLI mode)

When invoked as `--flash-elevated <source> <device>`, the child does the same read/write loop but outputs JSON to stdout:

```rust
pub fn flash_image_elevated_cli(source_path: &str, device_path: &str) -> Result<(), String> {
    let mut source = File::open(source_path)?;
    let mut dest = OpenOptions::new().write(true).open(device_path)?;
    let mut buffer = vec![0u8; 8 * 1024 * 1024];
    let mut written: u64 = 0;

    loop {
        let n = source.read(&mut buffer)?;
        if n == 0 { break; }
        dest.write_all(&buffer[..n])?;
        written += n as u64;

        if elapsed >= 0.25 {
            let line = serde_json::json!({
                "written_bytes": written,
                "total_bytes": total_bytes,
                "speed_bps": speed_bps,
            });
            let _ = writeln!(std::io::stdout(), "{}", line);
        }
    }

    // Final progress line
    let line = serde_json::json!({
        "written_bytes": total_bytes,
        "total_bytes": total_bytes,
        "speed_bps": 0.0,
    });
    let _ = writeln!(std::io::stdout(), "{}", line);

    verify_first_block(source_path, device_path)
}
```

## Verification

After writing, `verify_first_block` opens both source and device and compares the first 512 bytes:

```rust
fn verify_first_block(source_path: &Path, device_path: &Path) -> Result<(), String> {
    let mut source = File::open(source_path)?;
    let mut device = File::open(device_path)?;
    let mut source_buf = [0u8; 512];
    let mut device_buf = [0u8; 512];
    source.read_exact(&mut source_buf)?;
    device.read_exact(&mut device_buf)?;
    if source_buf == device_buf {
        Ok(())
    } else {
        Err("Verification failed: first block mismatch".to_string())
    }
}
```

## Cancellation

Uses a global `AtomicBool`:

```rust
lazy_static! {
    static ref FLASH_CANCEL_TOKEN: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
}
pub fn is_flash_cancelled() -> bool { FLASH_CANCEL_TOKEN.load(Ordering::SeqCst) }

#[tauri::command]
pub async fn cancel_flash() -> Result<(), String> {
    FLASH_CANCEL_TOKEN.store(true, Ordering::SeqCst);
    Ok(())
}
```

The flag is reset to `false` at the start of each `flash_image` call. The parent checks it between stdout lines and kills the child if set.

## Unmounting

On Linux, `unmount_device_linux` enumerates partitions via `lsblk --json` and runs `umount` on each mounted partition:

```rust
fn unmount_device_linux(device_path: &Path) -> Result<(), String> {
    let output = Command::new("lsblk")
        .args(["--json", "-o", "NAME,MOUNTPOINT"])
        .output()?;
    let disk_name = device_path.file_name()?.to_str()?;
    // find child partitions of disk_name with mount points
    for mount in mounts {
        let _ = Command::new("umount").arg(&mount).output();
    }
}
```

On macOS, it uses `diskutil unmountDisk /dev/diskX`.
