import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import DriveList from '../components/DriveList';
import { useStore } from '../store';
import type { UsbDrive } from '../releases';
import { t } from '../i18n';

export default function DriveStep() {
  const { drives, setDrives, selectedDrive, setSelectedDrive, selectedRelease, language } = useStore();

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

  return (
    <div className="drive-step">
      <div className="step-hint">
        {t(language, 'selectUsbHint')}
      </div>
      <DriveList
        drives={drives}
        selected={selectedDrive}
        onSelect={setSelectedDrive}
        minSizeBytes={minSizeBytes}
      />
    </div>
  );
}
