# Parch ISO Writer

Parch ISO Writer is the official desktop utility for downloading and writing Parch Linux images to USB drives.

It is built with **Tauri v2**:
- Frontend: React + TypeScript + Zustand
- Backend: Rust command layer exposed via Tauri `invoke`
- Targets: Linux, macOS, Windows

## Key Capabilities

- Official release download with progress, speed, and ETA
- Local image support (`.iso`, `.img`, and `.tar.xz` ARM archives)
- Checksum verification for downloaded images (MD5/SHA256)
- Optional local checksum validation via sidecar files (`.sha256` / `.md5`)
- Flash verification modes (`none`, `first block`, `sampled`, `full hash`)
- Device guardrails for safer flashing workflows
- Session logs and post-write actions (eject, open logs)
- English/Persian bilingual interface

## Flash Pipeline

Depending on source type, the write flow is:
1. Download (optional)
2. Checksum verification (when available)
3. Extraction (for `.tar.xz` images)
4. Flash to target block device
5. Device sync + post-write verification

## Security and Safety Notes

- Flashing is destructive by design; selected target data will be erased.
- The app includes target safety checks, including protection against obvious system-disk writes.
- Elevated privileges may be required for direct device writes.

## Development

### Prerequisites

- Rust toolchain (`rustc`, `cargo`)
- Bun or Node.js/npm
- Tauri v2 platform dependencies

On Linux, install required WebKit/GTK runtime libraries per Tauri documentation.

### Install Dependencies

```bash
bun install
```

### Run in Development

```bash
bun run tauri dev
```

### Frontend Build Check

```bash
bun run build
```

### Backend Build Check

```bash
cd src-tauri
cargo check
```

## Project Structure

- App shell and step flow: `src/App.tsx`, `src/steps/*`
- Shared app state: `src/store.ts`
- UI components: `src/components/*`
- Backend command registration: `src-tauri/src/lib.rs`
- Flashing and verification logic: `src-tauri/src/commands/flash.rs`

## Troubleshooting

### Linux/WebKit startup issues

If AppImage startup fails with EGL/WebKit errors, collect:
- distro/version
- X11 or Wayland session
- GPU/driver details
- full stderr output

### Accessibility warning (`atk-bridge ... unknown signature`)

This warning is often non-fatal and typically not the root cause of startup failure.

## Documentation

See `docs/` for implementation notes:
- `docs/architecture.md`
- `docs/backend.md`
- `docs/frontend.md`
- `docs/flashing.md`
- `docs/building.md`
- `docs/releases.md`

## License

GNU Affero General Public License v3.0. See [LICENSE](./LICENSE).
