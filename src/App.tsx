import { useState } from 'react';
import StepIndicator from './components/StepIndicator';
import SourceStep from './steps/SourceStep';
import DriveStep from './steps/DriveStep';
import WriteStep from './steps/WriteStep';
import ParchLogo from './components/ParchLogo';
import AboutPage from './pages/AboutPage';
import { useStore } from './store';
import { t } from './i18n';
import './styles/globals.css';

export default function App() {
  const [page, setPage] = useState<'app' | 'about'>('app');
  const { step, setStep, selectedRelease, sourceMode, selectedDrive, language, setLanguage } = useStore();

  const canContinue = () => {
    if (step === 1) {
      if (sourceMode === 'download') return selectedRelease !== null;
      return useStore.getState().localFilePath !== null;
    }
    if (step === 2) {
      return selectedDrive !== null;
    }
    return false;
  };

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as 1 | 2 | 3);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
  };

  return (
    <div className={`app ${language === 'fa' ? 'lang-fa' : ''}`}>
      <div className="titlebar">
        <div className="titlebar-logo" aria-hidden>
          <ParchLogo size={18} />
        </div>
        <div className="titlebar-meta">
          <span className="titlebar-text">{t(language, 'appTitle')}</span>
          <span className="titlebar-subtext">{t(language, 'appSubtitle')}</span>
        </div>
        <div className="lang-switcher">
          <button className={`lang-btn ${page === 'about' ? 'active' : ''}`} onClick={() => setPage(page === 'about' ? 'app' : 'about')}>
            {t(language, 'about')}
          </button>
          <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
          <button className={`lang-btn ${language === 'fa' ? 'active' : ''}`} onClick={() => setLanguage('fa')}>فا</button>
        </div>
        <span className="titlebar-driver">v0.1.3</span>
      </div>

      <div className="content">
        {page === 'about' ? (
          <AboutPage onBack={() => setPage('app')} />
        ) : (
          <>
            <StepIndicator current={step} labels={{ source: t(language, 'source'), drive: t(language, 'drive'), write: t(language, 'write') }} />

            <div className="step-content">
              {step === 1 && <SourceStep />}
              {step === 2 && <DriveStep />}
              {step === 3 && <WriteStep />}
            </div>

            {step < 3 && (
              <div className="nav-buttons">
                <button
                  className="btn btn-ghost"
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  {t(language, 'back')}
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!canContinue()}
                  onClick={handleNext}
                >
                  {t(language, 'continue')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
