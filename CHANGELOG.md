# Changelog

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
