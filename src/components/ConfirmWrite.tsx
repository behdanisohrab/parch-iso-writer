import { useStore } from '../store';
import { t } from '../i18n';

export default function ConfirmWrite({
  deviceName,
  checked,
  onChange,
}: {
  deviceName: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { language } = useStore();

  return (
    <div className="mac-alert-box">
      <div className="mac-alert-header">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>{t(language, 'destructive')}</span>
      </div>
      <div className="mac-alert-body">
        {t(language, 'destructiveText').replace('{device}', deviceName)}
      </div>
      <label className="mac-checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{t(language, 'confirmErase')}</span>
      </label>
    </div>
  );
}
