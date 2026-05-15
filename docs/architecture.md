# Architecture Overview

Parch ISO Writer is a Tauri v2 application. The Rust backend handles system operations (download, drive detection, image extraction, flash writing). The React+TypeScript frontend presents a 3-step wizard UI. Communication uses Tauri's `invoke` (commands) and `emit`/`listen` (events).

## Entry Point

`src-tauri/src/main.rs` checks for `--flash-elevated` first. If present, it runs the flash CLI mode and exits without starting the GUI:

```rust
fn main() {
    match parch_iso_writer_lib::try_run_elevated_flash_from_args() {
        Ok(true) => return,
        Ok(false) => {}
        Err(err) => {
            eprintln!("{}", err);
            std::process::exit(1);
        }
    }
    parch_iso_writer_lib::run()
}
```

## Command Registration

`src-tauri/src/lib.rs` registers all Tauri commands and handles the `--flash-elevated` CLI path:

```rust
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
```

## Frontend App Shell

`src/App.tsx` renders the titlebar, step indicator, active step, and nav buttons:

```tsx
export default function App() {
  const { step, setStep, selectedRelease, sourceMode, selectedDrive, language, setLanguage } = useStore();

  return (
    <div className={`app ${language === 'fa' ? 'lang-fa' : ''}`}>
      <div className="titlebar">
        <div className="titlebar-logo" aria-hidden>
          <ParchLogo size={18} />
        </div>
        <div className="titlebar-meta">
          <span className="titlebar-text">{t(language, 'appTitle')}</span>
          <span className="titlebar-subtext">{t(language, 'appSubtitle')}</span>
        </div>
        <div className="lang-switcher">
          <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
          <button className={`lang-btn ${language === 'fa' ? 'active' : ''}`} onClick={() => setLanguage('fa')}>فا</button>
        </div>
        <span className="titlebar-driver">v0.1.0</span>
      </div>
      <div className="content">
        <StepIndicator current={step} ... />
        <div className="step-content">
          {step === 1 && <SourceStep />}
          {step === 2 && <DriveStep />}
          {step === 3 && <WriteStep />}
        </div>
        {step < 3 && (
          <div className="nav-buttons">
            <button className="btn btn-ghost" onClick={handleBack} disabled={step === 1}>Back</button>
            <button className="btn btn-primary" disabled={!canContinue()} onClick={handleNext}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Three-Step Wizard

- **Step 1 — SourceStep**: Download tab (release cards from Parch Linux mirror) or local file tab (drag-drop zone for ISO/IMG/tar.xz).
- **Step 2 — DriveStep**: Lists detected USB drives via backend polling, subscribes to `usb_changed` event for live updates.
- **Step 3 — WriteStep**: Orchestrates download/verify/extract/flash pipeline, displays circular progress ring, handles cancel and retry.

## Flash Subsystem (balenaEtcher pattern)

The flash subsystem follows the approach used by balenaEtcher. When direct device open fails with `PermissionDenied`, the app re-invokes itself via `pkexec` (Linux), `osascript` (macOS), or `PowerShell RunAs` (Windows) with the `--flash-elevated` flag. The elevated child runs a read/write copy loop and outputs JSON progress lines to stdout. The parent reads stdout, parses JSON, and emits Tauri `flash_progress` events.

## Global State

`src/store.ts` uses Zustand for all application state:

```ts
interface AppState {
  language: 'en' | 'fa';
  step: AppStep;
  sourceMode: SourceMode;
  selectedRelease: Release | null;
  localFilePath: string | null;
  archFilter: string | null;
  drives: UsbDrive[];
  selectedDrive: UsbDrive | null;
  stage: OperationStage;
  downloadProgress: ProgressInfo | null;
  extractProgress: number | null;
  flashProgress: FlashProgressInfo | null;
  verificationOk: boolean | null;
  error: string | null;
  confirmChecked: boolean;
  reset: () => void;
}
```

The `stage` field drives visibility: `idle` | `downloading` | `verifying` | `extracting` | `flashing` | `done` | `error`.

## Cancellation

Both download and flash use a global lazy-static `AtomicBool` as a cancellation token. The frontend invokes `cancel_download` / `cancel_flash` commands which set the flag. The download loop checks between stream chunks; the flash parent loop checks between JSON lines and kills the child process on cancel.
