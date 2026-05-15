# Changelog

## v0.1.3 - 2026-05-15

This release focuses on safety, verification depth, and user experience improvements in the flashing workflow.

### What changed

- Removed WSL-specific release flow and simplified the app to USB-image writing workflows only.
- Added configurable post-write verification modes: `none`, `first block`, `sampled`, and full-device hash verification.
- Added stronger target guardrails to block obvious system-disk writes and require explicit opt-in for non-removable targets.
- Added write-sync reliability improvements before verification.
- Added better local image validation with clearer file-type and invalid-input errors.
- Added local checksum sidecar support (`.sha256` / `.md5`) for local images.
- Added per-session logging and post-write actions (`Eject Drive`, `Open Logs Folder`).
- Added UI search fields for release list and detected drives.
- Improved mobile layout behavior, Persian typography consistency, and theme token cleanup.
- Added an in-app About page that includes technical project details and embedded changelog view.

### Notes

- The release is packaged from the active `dev` branch workstream and includes the integrated UI/backend reliability changes completed in this cycle.

## v0.1.2 - 2026-05-15

This is a targeted hotfix release for write-flow behavior and macOS CI builds.

### What changed

- Fixed a macOS build failure in USB detection code by using the correct plist API (`as_boolean`).
- Fixed a write-flow regression where the UI could appear stuck on `Verifying checksum...` after flashing.
- Restored expected local ISO behavior: checksum verification is skipped completely for local sources.

### Notes

- This release keeps the broader `v0.1.1` packaging and workflow improvements, and focuses only on the regressions found afterward.

## v0.1.1 - 2026-05-15

This release focuses on reliability and packaging fixes across Linux and macOS.

### What changed

- Fixed write pipeline behavior so the app now shows a verification stage right after flashing reaches 100%.
- Fixed pipeline stage mapping so `verifying` is correctly reflected in the step progress UI.
- Added Linux runtime fallbacks for AppImage startup issues related to EGL/WebKit rendering.
- Added missing `plist` crate dependency required for macOS USB drive detection code.
- Updated GitHub release workflow for macOS builds:
- unified mac jobs on `macos-latest`
- explicitly installs both Rust macOS targets (`x86_64-apple-darwin`, `aarch64-apple-darwin`)
- Rewrote `README.md` to be clearer and more useful for users and contributors.

### Notes

- The accessibility warning `atk-bridge ... unknown signature` may still appear on some Linux systems and is generally non-fatal.
- The main Linux startup crash addressed here is the EGL display initialization failure seen in some AppImage environments.
