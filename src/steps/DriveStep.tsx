import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import DriveList from '../components/DriveList';
import { useStore } from '../store';
import type { UsbDrive } from '../releases';
import { t } from '../i18n';

export default function DriveStep() {
  const {
    drives,
    setDrives,
    selectedDrive,
    setSelectedDrive,
    selectedRelease,
    language,
    driveSearch,
    setDriveSearch,
  } = useStore();

  useEffect(() => {
    invoke<UsbDrive[]>('list_usb_drives')
      .then((currentDrives) => setDrives(currentDrives))
      .catch(() => setDrives([]));

    const unlisten = listen<UsbDrive[]>('usb_changed', (event) => {
      setDrives(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [setDrives]);

  const minSizeBytes = selectedRelease
    ? selectedRelease.kind === 'ImgTarXz'
      ? 2 * 1024 * 1024 * 1024
      : 4 * 1024 * 1024 * 1024
    : 0;

  const q = driveSearch.trim().toLowerCase();
  const filteredDrives = drives.filter((d) => {
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.path.toLowerCase().includes(q) ||
      d.vendor.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="step-fixed-header">
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {t(language, 'selectUsbHint')}
        </div>

        <div className="mac-search-wrap">
          <svg
            className="mac-search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="mac-search-input"
            value={driveSearch}
            onChange={(e) => setDriveSearch(e.target.value)}
            placeholder={t(language, 'searchDrives')}
            aria-label={t(language, 'searchDrives')}
          />
        </div>
      </div>

      <div className="step-scroll-content">
        <DriveList
          drives={filteredDrives}
          selected={selectedDrive}
          onSelect={setSelectedDrive}
          minSizeBytes={minSizeBytes}
        />
      </div>
    </div>
  );
}
