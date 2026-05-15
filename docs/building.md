# Building and Development

## Prerequisites

- Rust toolchain (rustc + Cargo)
- Node.js + a package manager (bun or npm)
- Tauri v2 system dependencies: `webkit2gtk-4.1`, `libgtk-3`, `libappindicator3`, etc.

## Development

```bash
bun run tauri dev
```

This starts the Vite dev server on port 1420 and launches the Tauri window. Frontend changes hot-reload. Rust changes trigger automatic recompilation via Tauri's CLI watch mechanism.

## Production Build

```bash
bun run tauri build
```

Outputs:
- **Linux**: AppImage and `.deb` packages (configurable in `src-tauri/tauri.conf.json`)
- Frontend: TypeScript compiled + Vite bundle → `dist/`
- Backend: Cargo release build → Tauri binary

## Elevated Mode

The binary supports a headless CLI mode for privileged flash writing. This is invoked by the parent process, never by the user directly:

```bash
pkexec /path/to/parch-iso-writer --flash-elevated /path/to/source.iso /dev/sdX
```

The output is JSON progress lines on stdout:

```
{"written_bytes":8388608,"total_bytes":2147483648,"speed_bps":33554432.0}
{"written_bytes":16777216,"total_bytes":2147483648,"speed_bps":33554432.0}
...
{"written_bytes":2147483648,"total_bytes":2147483648,"speed_bps":0.0}
```

## Tauri Configuration

Window settings in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Parch ISO Writer",
  "version": "0.1.0",
  "identifier": "ir.parchlinux.iso-writer",
  "build": {
    "frontendDist": "../dist",
    "beforeBuildCommand": "bun run build"
  },
  "app": {
    "windows": [
      {
        "title": "Parch ISO Writer",
        "width": 860,
        "height": 680,
        "minWidth": 720,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ]
  }
}
```

## Capabilities

Permissions for the frontend are defined in `src-tauri/capabilities/`:

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:event:default",
    "plugin:opener:default",
    "plugin:dialog:default",
    "plugin:fs:default",
    "plugin:http:default",
    {
      "identifier": "plugin:shell:allow-execute",
      "allow": [{ "name": "pkexec", "cmd": "pkexec", "args": true }]
    }
  ]
}
```

The `shell:allow-execute` permission for `pkexec` is required for the elevated flash mechanism.
