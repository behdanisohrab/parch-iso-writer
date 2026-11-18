# Changelog

## v0.1.4 - 2026-11-18

This release brings a complete UI overhaul based on Apple Human Interface Guidelines (HIG) and syncs official Parch Linux releases with the current mirror.

### What changed

- Completely redesigned frontend using macOS HIG principles:
  - Pinned top toolbar and bottom action bar ensuring no UI overlap or crowding when the window is resized small.
  - Dedicated scrollable viewport for release and drive lists with smooth momentum scrolling.
  - Apple-style segmented controls, inset search fields, and compact list cards.
  - Apple Dark Mode aesthetic with vibrant Parch teal accent.
- Synchronized official releases with active Parch Linux mirror (`mirror.parchlinux.ir`):
  - Fixed download 404 errors caused by filename case-sensitivity on the mirror server.
  - Added official editions: Hyprland (RC), Lite, and Immutable (`.tar.xz`).
  - Removed deprecated/offline ARM release links.
  - Improved checksum verification parser with automated unit tests.
- Bumped app version to 0.1.4 and updated packaging PKGBUILD.

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
