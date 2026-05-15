use serde::{Deserialize, Serialize};

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
    pub name: &'static str,
    pub edition: &'static str,
    pub arch: &'static str,
    pub kind: ReleaseKind,
    pub url: &'static str,
    pub checksum_url: Option<&'static str>,
    pub checksum_kind: ChecksumKind,
    pub description: &'static str,
    pub description_fa: &'static str,
}

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
    Release {
        id: "plasma",
        name: "Parch Linux Plasma",
        edition: "plasma",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/plasma/ParchLinux-plasma-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/plasma/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "KDE Plasma desktop with full Parch customization.",
        description_fa: "میزکار KDE Plasma با شخصی‌سازی کامل پارچ.",
    },
    Release {
        id: "xfce",
        name: "Parch Linux XFCE",
        edition: "xfce",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/XFCE/ParchLinux-XFCE-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/XFCE/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Lightweight XFCE desktop, ideal for older hardware.",
        description_fa: "میزکار سبک XFCE، مناسب برای سخت‌افزار قدیمی.",
    },
    Release {
        id: "cosmic",
        name: "Parch Linux COSMIC",
        edition: "cosmic",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/cosmic/ParchLinux-cosmic-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/cosmic/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "COSMIC desktop by System76 — modern and Wayland-native.",
        description_fa: "میزکار COSMIC توسط System76 — مدرن و بومی Wayland.",
    },
    Release {
        id: "mini",
        name: "Parch Linux Mini",
        edition: "mini",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/mini/Parchlinux-mini-latest.iso",
        checksum_url: None,
        checksum_kind: ChecksumKind::None,
        description: "Minimal ISO, no desktop environment. For advanced users.",
        description_fa: "ISO حداقلی، بدون محیط میزکار. برای کاربران حرفه‌ای.",
    },
    Release {
        id: "aarch64-plasma",
        name: "Parch Linux Plasma (aarch64)",
        edition: "plasma",
        arch: "aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/aarch64/plasma/ParchLinux-aarch64-plasma-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/aarch64/plasma/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "KDE Plasma for generic 64-bit ARM boards.",
        description_fa: "KDE Plasma برای بردهای ۶۴ بیتی ARM.",
    },
    Release {
        id: "aarch64-xfce",
        name: "Parch Linux XFCE (aarch64)",
        edition: "xfce",
        arch: "aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/aarch64/xfce/ParchLinux-aarch64-xfce-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/aarch64/xfce/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "XFCE for generic 64-bit ARM boards.",
        description_fa: "XFCE برای بردهای ۶۴ بیتی ARM.",
    },
    Release {
        id: "aarch64-barebone",
        name: "Parch Linux Barebone (aarch64)",
        edition: "barebone",
        arch: "aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/aarch64/barebone/ParchLinux-aarch64-barebone-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/aarch64/barebone/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "Headless/minimal ARM image. No desktop.",
        description_fa: "تصویر ARM بدون میزکار. حداقلی.",
    },
    Release {
        id: "aarch64-trinity",
        name: "Parch Linux Trinity (aarch64)",
        edition: "trinity",
        arch: "aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/aarch64/trinity/ParchLinux-aarch64-trinity-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/aarch64/trinity/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "Trinity desktop for generic ARM boards.",
        description_fa: "میزکار Trinity برای بردهای ARM.",
    },
    Release {
        id: "rpi-plasma",
        name: "Parch Linux Plasma (Raspberry Pi)",
        edition: "plasma",
        arch: "rpi-aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/rpi-aarch64/plasma/ParchLinux-rpi-aarch64-plasma-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/rpi-aarch64/plasma/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "KDE Plasma optimized for Raspberry Pi.",
        description_fa: "KDE Plasma بهینه‌سازی شده برای Raspberry Pi.",
    },
    Release {
        id: "rpi-xfce",
        name: "Parch Linux XFCE (Raspberry Pi)",
        edition: "xfce",
        arch: "rpi-aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/rpi-aarch64/xfce/ParchLinux-rpi-aarch64-xfce-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/rpi-aarch64/xfce/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "XFCE optimized for Raspberry Pi.",
        description_fa: "XFCE بهینه‌سازی شده برای Raspberry Pi.",
    },
    Release {
        id: "rpi-barebone",
        name: "Parch Linux Barebone (Raspberry Pi)",
        edition: "barebone",
        arch: "rpi-aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/rpi-aarch64/barebone/ParchLinux-rpi-aarch64-barebone-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/rpi-aarch64/barebone/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "Headless Raspberry Pi image.",
        description_fa: "تصویر Raspberry Pi بدون میزکار.",
    },
    Release {
        id: "rpi-trinity",
        name: "Parch Linux Trinity (Raspberry Pi)",
        edition: "trinity",
        arch: "rpi-aarch64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/rpi-aarch64/trinity/ParchLinux-rpi-aarch64-trinity-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/rpi-aarch64/trinity/sha256sum.txt"),
        checksum_kind: ChecksumKind::Sha256,
        description: "Trinity desktop for Raspberry Pi.",
        description_fa: "میزکار Trinity برای Raspberry Pi.",
    },
    Release {
        id: "wsl",
        name: "Parch Linux WSL",
        edition: "wsl",
        arch: "x86_64",
        kind: ReleaseKind::Wsl,
        url: "https://mirror.parchlinux.ir/wsl/parchlinux-wsl-latest.wsl",
        checksum_url: Some("https://mirror.parchlinux.ir/wsl/parchlinux-wsl-latest.wsl.SHA256"),
        checksum_kind: ChecksumKind::Sha256,
        description: "Windows Subsystem for Linux image. Not flashable to USB.",
        description_fa: "تصویر زیرسیستم ویندوز برای لینوکس. قابل فلش به USB نیست.",
    },
];

pub fn parse_checksum_file(content: &str, target_filename: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.splitn(2, "  ").collect();
        if parts.len() == 2 && parts[1].trim().ends_with(target_filename) {
            return Some(parts[0].trim().to_string());
        }
    }
    let trimmed = content.trim();
    if trimmed.len() == 64 && trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
        return Some(trimmed.to_string());
    }
    if trimmed.len() == 32 && trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
        return Some(trimmed.to_string());
    }
    None
}


