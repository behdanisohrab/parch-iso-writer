# Release Definitions and Data Model

The releases module defines the static catalog of Parch Linux releases that the application can download. Located in `src-tauri/src/releases.rs`.

## Data Types

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReleaseKind {
    Iso,
    ImgTarXz,
    Wsl,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChecksumKind {
    Md5,
    Sha256,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Release {
    pub id: &'static str,
    pub name: &'static str,       // "Parch Linux GNOME"
    pub edition: &'static str,    // "gnome"
    pub arch: &'static str,       // "x86_64", "aarch64", "rpi", "wsl"
    pub kind: ReleaseKind,
    pub url: &'static str,
    pub checksum_url: Option<&'static str>,
    pub checksum_kind: ChecksumKind,
    pub description: &'static str,     // English
    pub description_fa: &'static str,  // Persian
}
```

## Static Release Catalog

The `RELEASES` constant is a static slice of 14 entries covering all Parch Linux editions:

```rust
pub const RELEASES: &[Release] = &[
    Release {
        id: "gnome",
        name: "Parch Linux GNOME",
        edition: "gnome",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/gnome/ParchLinux-gnome-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/gnome/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Full-featured GNOME desktop, recommended for most users.",
        description_fa: "میزکار کامل گنوم، توصیه‌شده برای بیشتر کاربران.",
    },
    // ... 13 more releases
];
```

Release categories:
- **x86_64 Desktop (Iso)**: GNOME, Plasma, XFCE, COSMIC, Mini
- **aarch64 ARM (ImgTarXz)**: Plasma, XFCE, Barebone, Trinity
- **Raspberry Pi (ImgTarXz)**: Plasma, XFCE, Barebone, Trinity
- **WSL (Wsl)**: Windows Subsystem for Linux (not flashable, skips DriveStep)

## Checksum Parsing

The `fetch_checksum` Tauri command downloads a checksum file and uses `parse_checksum_file` to find the matching hash. The parser handles two formats:

```rust
/// Standard: "hash  filename" (two spaces), or raw (only hash string)
pub fn parse_checksum_file(content: &str, target_filename: &str) -> Option<String> {
    for line in content.lines() {
        let trimmed = line.trim();
        if let Some((hash, _)) = trimmed.split_once("  ") {
            if _ == target_filename {
                return Some(hash.to_string());
            }
        }
    }
    // Fallback: if content is a single hex string (32/64 chars), return it
    None
}
```

## Frontend Type Equivalents

`src/releases.ts` mirrors the Rust types with `Release`, `ReleaseKind`, `UsbDrive`, `ProgressInfo`, and `FlashProgressInfo` interfaces. It also provides formatting utilities:

```ts
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
```

## Architecture Labels

```rust
pub const ARCH_LABELS: &[(&str, &str)] = &[
    ("x86_64", "x86_64 (64-bit)"),
    ("aarch64", "AArch64 (ARM 64-bit)"),
    ("rpi", "Raspberry Pi"),
    ("wsl", "WSL (Windows Subsystem for Linux)"),
];

pub const ARCH_LABELS_SHORT: &[(&str, &str)] = &[
    ("x86_64", "x86"),
    ("aarch64", "ARM"),
    ("rpi", "RPi"),
    ("wsl", "WSL"),
];
```

These are used in the frontend ReleaseCard component for architecture filter badges.
