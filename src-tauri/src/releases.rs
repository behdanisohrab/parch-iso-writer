use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReleaseKind {
    Iso,
    ImgTarXz,
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
        edition: "GNOME",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/gnome/Parchlinux-gnome-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/gnome/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Full-featured, refined GNOME desktop experience.",
        description_fa: "میزکار کامل، روان و مدرن گنوم برای کاربری روزمره.",
    },
    Release {
        id: "plasma",
        name: "Parch Linux Plasma 6",
        edition: "Plasma",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/plasma/Parchlinux-plasma-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/plasma/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Modern KDE Plasma 6 desktop with custom Parch configurations.",
        description_fa: "میزکار مدرن KDE Plasma 6 همراه با شخصی‌سازی ویژه پارچ.",
    },
    Release {
        id: "hyprland",
        name: "Parch Linux Hyprland (RC)",
        edition: "Hyprland",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/hyprland/Parchlinux-hyprland-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/hyprland/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Dynamic Wayland tiling compositor configured out of the box.",
        description_fa: "محیط کاشی‌کاری مدرن و پویای ویلند برای کاربران کیبورد‌محور.",
    },
    Release {
        id: "xfce",
        name: "Parch Linux XFCE",
        edition: "XFCE",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/XFCE/Parchlinux-XFCE-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/XFCE/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Fast, traditional desktop optimized for efficiency and lighter specs.",
        description_fa: "میزکار سنتی، سبک و سریع مناسب مصرف کم منابع و سخت‌افزارهای ضعیف‌تر.",
    },
    Release {
        id: "cosmic",
        name: "Parch Linux COSMIC",
        edition: "COSMIC",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/cosmic/ParchLinux-cosmic-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/cosmic/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "System76 COSMIC desktop environment built in Rust.",
        description_fa: "محیط میزکار مدرن COSMIC توسعه‌یافته با زبان راست.",
    },
    Release {
        id: "lite",
        name: "Parch Linux Lite",
        edition: "Lite",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/lite/Parchlinux-lite-latest.iso",
        checksum_url: Some("https://mirror.parchlinux.ir/lite/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Resource-conscious edition with essential pre-installed utilities.",
        description_fa: "نسخه کم‌حجم با ابزارهای ضروری و حداقل سرویس‌های پس‌زمینه.",
    },
    Release {
        id: "mini",
        name: "Parch Linux Mini",
        edition: "Mini",
        arch: "x86_64",
        kind: ReleaseKind::Iso,
        url: "https://mirror.parchlinux.ir/mini/Parchlinux-mini-latest.iso",
        checksum_url: None,
        checksum_kind: ChecksumKind::None,
        description: "Minimal base system without graphical desktop for custom setups.",
        description_fa: "پایه سیستم‌عامل حداقلی بدون محیط گرافیکی برای نصب‌های سفارشی.",
    },
    Release {
        id: "immutable",
        name: "Parch Linux Immutable",
        edition: "Immutable",
        arch: "x86_64",
        kind: ReleaseKind::ImgTarXz,
        url: "https://mirror.parchlinux.ir/immutable/Parchlinux-immutable-latest.tar.xz",
        checksum_url: Some("https://mirror.parchlinux.ir/immutable/md5sum.txt"),
        checksum_kind: ChecksumKind::Md5,
        description: "Read-only root filesystem architecture for high stability.",
        description_fa: "معماری روت فقط‌خواندنی برای پایداری و امنیت بالا.",
    },
];

pub fn parse_checksum_file(content: &str, target_filename: &str) -> Option<String> {
    let target_lower = target_filename.to_lowercase();
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let filename = parts[1].trim().trim_start_matches('*');
            if filename.to_lowercase().ends_with(&target_lower) {
                return Some(parts[0].trim().to_string());
            }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_checksum_file() {
        let content = "e26d97936ce3a874f0ae194e9fcf8b9b  out/Parchlinux-gnome-latest.iso\n8476893e34729afa705cd98954712187  out/Parchlinux-plasma-latest.iso";
        assert_eq!(
            parse_checksum_file(content, "Parchlinux-gnome-latest.iso"),
            Some("e26d97936ce3a874f0ae194e9fcf8b9b".to_string())
        );
        assert_eq!(
            parse_checksum_file(content, "Parchlinux-plasma-latest.iso"),
            Some("8476893e34729afa705cd98954712187".to_string())
        );
        assert_eq!(
            parse_checksum_file(content, "nonexistent.iso"),
            None
        );
    }
}
