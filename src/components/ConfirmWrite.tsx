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
    <div className="card confirm-write">
      <div className="confirm-write-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1L1 14h14L8 1z"/>
          <line x1="8" y1="6" x2="8" y2="9"/>
          <circle cx="8" cy="11.5" r="0.5" fill="var(--warning)" stroke="none"/>
        </svg>
        <span className="confirm-write-title">{t(language, 'destructive')}</span>
      </div>
      <div className="confirm-write-text">
        {t(language, 'destructiveText').replace('{device}', deviceName)}
      </div>
      <label className="confirm-write-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="confirm-write-checkbox"
        />
        {t(language, 'confirmErase')}
      </label>
    </div>
  );
}
