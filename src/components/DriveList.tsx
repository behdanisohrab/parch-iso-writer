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
      <div className="drive-empty-card">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-tertiary)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {t(language, 'noDrives')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {t(language, 'insertUsb')}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="radiogroup" aria-label="Detected USB Drives">
      {drives.map((drive) => {
        const tooSmall = minSizeBytes > 0 && drive.size_bytes < minSizeBytes;
        const disabled = !drive.is_removable;
        const isSelected = selected?.path === drive.path;

        return (
          <div
            key={drive.path}
            role="radio"
            tabIndex={disabled ? -1 : 0}
            aria-checked={isSelected}
            aria-disabled={disabled}
            className={`mac-drive-row ${isSelected ? 'selected' : ''}`}
            onClick={() => !disabled && onSelect(drive)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                onSelect(drive);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div className="drive-icon-box">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 2v10a6 6 0 0 0 12 0V2" />
                  <line x1="10" y1="2" x2="10" y2="6" />
                  <line x1="14" y1="2" x2="14" y2="6" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                </svg>
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="drive-name">
                  {drive.name || drive.model || 'Removable Device'}
                </div>
                <div className="drive-info-line">
                  <span className="drive-path-tag">{drive.path}</span>
                  <span className="mac-badge mac-badge-accent">
                    {formatBytes(drive.size_bytes)}
                  </span>
                  {drive.is_removable ? (
                    <span className="mac-badge mac-badge-blue">
                      {t(language, 'removableBadge')}
                    </span>
                  ) : (
                    <span className="mac-badge mac-badge-danger">
                      {t(language, 'systemDiskBadge')}
                    </span>
                  )}
                  {tooSmall && (
                    <span className="mac-badge mac-badge-warn">
                      {t(language, 'tooSmall')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mac-radio-circle" aria-hidden="true">
              {isSelected && <div className="mac-radio-inner" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
