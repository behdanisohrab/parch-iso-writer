import { useStore } from '../store';
import { t } from '../i18n';
import ParchLogo from '../components/ParchLogo';
import changelogRaw from '../../CHANGELOG.md?raw';

export default function AboutPage({ onBack }: { onBack: () => void }) {
  const { language } = useStore();

  return (
    <div className="about-view">
      <div className="about-box">
        <div style={{ width: 48, height: 48, filter: 'drop-shadow(0 0 10px rgba(0, 210, 180, 0.4))' }}>
          <ParchLogo size={48} />
        </div>

        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t(language, 'aboutTitle')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {t(language, 'aboutSubtitle')}
          </div>
        </div>

        <div className="about-features">
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {t(language, 'aboutWhat')}
          </div>
          <div>• {t(language, 'aboutFact1')}</div>
          <div>• {t(language, 'aboutFact2')}</div>
          <div>• {t(language, 'aboutFact3')}</div>
          <div>• {t(language, 'aboutFact4')}</div>
        </div>

        <div style={{ width: '100%', maxHeight: 120, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--apple-border)', padding: 10, textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap' }}>
          {changelogRaw}
        </div>

        <button type="button" className="mac-btn mac-btn-secondary" style={{ width: '100%' }} onClick={onBack}>
          {t(language, 'backToApp')}
        </button>
      </div>
    </div>
  );
}
