import type { UsbDrive } from '../releases';
import { formatBytes } from '../releases';
import { useStore } from '../store';
import { t } from '../i18n';

export default function DriveList({
  drives,
  selected,
  onSelect,
  minSizeBytes,
}: {
  drives: UsbDrive[];
  selected: UsbDrive | null;
  onSelect: (d: UsbDrive) => void;
  minSizeBytes: number;
}) {
  const { language } = useStore();
  if (drives.length === 0) {
    return (
      <div className="card drive-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <div className="drive-empty-title">{t(language, 'noDrives')}</div>
        <div className="drive-empty-subtitle">
          {t(language, 'insertUsb')}
        </div>
      </div>
    );
  }

  return (
    <div className="drive-list">
      {drives.map((drive) => {
        const tooSmall = minSizeBytes > 0 && drive.size_bytes < minSizeBytes;
        const disabled = !drive.is_removable;

        return (
          <button
            key={drive.path}
            className={`card drive-item ${selected?.path === drive.path ? 'selected' : ''} ${tooSmall ? 'warn' : ''}`}
            disabled={disabled}
            onClick={() => !disabled && onSelect(drive)}
            title={disabled ? 'This disk is not removable and cannot be flashed.' : ''}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drive-item-icon">
              <rect x="3" y="6" width="18" height="12" rx="2"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <div className="drive-item-meta">
              <div className="drive-item-name">{drive.name}</div>
              <div className="drive-item-path">
                {drive.path} - {formatBytes(drive.size_bytes)}
                {tooSmall && (
                  <span className="drive-chip-warn">{t(language, 'tooSmall')}</span>
                )}
                {!drive.is_removable && (
                  <span className="drive-chip-danger">{t(language, 'notRemovable')}</span>
                )}
              </div>
            </div>
            {selected?.path === drive.path && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="drive-item-check">
                <circle cx="8" cy="8" r="7" stroke="var(--accent)" strokeWidth="2"/>
                <path d="M5 8l2 2 4-4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
