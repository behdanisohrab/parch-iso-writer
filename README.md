# Parch ISO Writer

Parch ISO Writer is a cross-platform desktop app for downloading and flashing Parch Linux images to USB drives.

It is built with Tauri v2:
- Frontend: React + TypeScript + Zustand
- Backend: Rust commands exposed through Tauri `invoke`
- Platforms: Linux, macOS, Windows

## Highlights

- Download official Parch releases with progress, speed, and ETA
- Verify downloaded images using MD5/SHA256 checksums
- Support local images (`.iso`, `.img`) and archived ARM images (`.tar.xz`)
- Automatic USB drive detection with live refresh
- Real-time flashing progress and cancellation support
- Native privilege elevation for device writing (`pkexec` on Linux, `osascript` on macOS, PowerShell `RunAs` on Windows)

## How It Works

The app runs as a 3-step wizard:

1. Source
- Select an official release to download, or choose a local image file.

2. Drive
- Choose a removable USB device detected by the backend.

3. Write
- Pipeline runs depending on source type:
- Download (optional), verify checksum (when available), extract `.img` from `.tar.xz` (when required), flash to USB, and verify written data

## Development Setup

### Prerequisites

- Rust toolchain (`rustc`, `cargo`)
- Bun (recommended) or Node.js + npm
- Tauri v2 system dependencies for your OS

On Linux, install Tauri runtime dependencies (`webkit2gtk`, `gtk3`, etc.) per Tauri docs for your distro.

### Install

```bash
bun install
```

### Run in Development

```bash
bun run tauri dev
```

### Type Check Frontend

```bash
bun run tsc --noEmit
```

### Check Rust Backend

```bash
cd src-tauri
cargo check
```

## Production Build

```bash
bun run tauri build
```

Build outputs typically include:
- Linux: AppImage and `.deb`
- macOS: `.app`/bundle artifacts
- Windows: installer/bundle artifacts

(Exact targets are controlled by `src-tauri/tauri.conf.json`.)

## Architecture

Core paths:
- App shell and wizard: `src/App.tsx`, `src/steps/*`
- Global state: `src/store.ts`
- Backend command registration: `src-tauri/src/lib.rs`
- Flashing implementation: `src-tauri/src/commands/flash.rs`
- Entry point / elevated CLI dispatch: `src-tauri/src/main.rs`

Data flow:
- Frontend calls backend commands via `invoke`
- Backend emits progress events (`download_progress`, `extract_progress`, `flash_progress`)
- Frontend listens to events and updates UI state in real time

## Elevated Flash Mode

For privileged writes, the app can relaunch itself in a headless elevated mode:

```bash
parch-iso-writer --flash-elevated <source> <device>
```

This mode is intended for internal use by the GUI process.

## Troubleshooting

### Linux AppImage fails with EGL error

If startup fails with messages like:
- `Could not create default EGL display: EGL_BAD_PARAMETER`

Recent code includes Linux runtime fallbacks to disable problematic WebKit GPU paths in AppImage environments.

If an issue persists on specific GPUs/drivers, collect:
- distro + version
- desktop session (X11/Wayland)
- GPU + driver version
- full stderr logs

### Accessibility warning (`atk-bridge ... unknown signature`)

This warning is often non-fatal and usually not the root cause of startup failure.

## Documentation

Additional docs are under `docs/`:
- `docs/architecture.md`
- `docs/backend.md`
- `docs/frontend.md`
- `docs/flashing.md`
- `docs/building.md`
- `docs/releases.md`

## License

GNU Affero General Public License v3.0. See [LICENSE](./LICENSE).
