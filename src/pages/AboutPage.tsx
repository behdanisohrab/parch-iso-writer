import { useStore } from '../store';
import { t } from '../i18n';
import changelogRaw from '../../CHANGELOG.md?raw';

export default function AboutPage({ onBack }: { onBack: () => void }) {
  const { language } = useStore();

  return (
    <div className="about-page">
      <div className="card about-hero">
        <div className="about-title">{t(language, 'aboutTitle')}</div>
        <div className="about-subtitle">{t(language, 'aboutSubtitle')}</div>
      </div>

      <div className="card about-section">
        <div className="about-section-title">{t(language, 'aboutWhat')}</div>
        <ul className="about-list">
          <li>{t(language, 'aboutFact1')}</li>
          <li>{t(language, 'aboutFact2')}</li>
          <li>{t(language, 'aboutFact3')}</li>
          <li>{t(language, 'aboutFact4')}</li>
        </ul>
      </div>

      <div className="card about-section">
        <div className="about-section-title">{t(language, 'changelog')}</div>
        <pre className="about-changelog">{changelogRaw}</pre>
      </div>

      <div className="nav-buttons">
        <button className="btn btn-ghost" onClick={onBack}>
          {t(language, 'backToApp')}
        </button>
      </div>
    </div>
  );
}
