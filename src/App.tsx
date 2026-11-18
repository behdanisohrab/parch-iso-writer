import { useState } from 'react';
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
  const {
    step,
    setStep,
    selectedRelease,
    sourceMode,
    selectedDrive,
    localFilePath,
    language,
    setLanguage,
  } = useStore();

  const canContinueStep1 =
    sourceMode === 'download' ? selectedRelease !== null : localFilePath !== null;
  const canContinueStep2 = selectedDrive !== null;

  const canContinue = () => {
    if (step === 1) return canContinueStep1;
    if (step === 2) return canContinueStep2;
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
      <header className="app-toolbar">
        <div className="toolbar-brand">
          <div className="toolbar-logo" aria-hidden="true">
            <ParchLogo size={20} />
          </div>
          <div className="toolbar-title-wrap">
            <span className="toolbar-title">{t(language, 'appTitle')}</span>
            <span className="toolbar-version">v0.1.4</span>
          </div>
        </div>

        {page === 'app' && (
          <nav className="toolbar-stepper" aria-label="Installation Steps">
            <button
              type="button"
              className={`step-pill ${step === 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}
              onClick={() => setStep(1)}
            >
              <span className="step-pill-num">{step > 1 ? '✓' : '1'}</span>
              <span>{t(language, 'source')}</span>
            </button>
            <button
              type="button"
              className={`step-pill ${step === 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}
              disabled={!canContinueStep1}
              onClick={() => canContinueStep1 && setStep(2)}
            >
              <span className="step-pill-num">{step > 2 ? '✓' : '2'}</span>
              <span>{t(language, 'drive')}</span>
            </button>
            <button
              type="button"
              className={`step-pill ${step === 3 ? 'active' : ''}`}
              disabled={!canContinueStep1 || !canContinueStep2}
              onClick={() => canContinueStep1 && canContinueStep2 && setStep(3)}
            >
              <span className="step-pill-num">3</span>
              <span>{t(language, 'write')}</span>
            </button>
          </nav>
        )}

        <div className="toolbar-controls">
          <div className="segmented-switcher" role="group" aria-label="Language">
            <button
              type="button"
              className={`segment-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={`segment-btn ${language === 'fa' ? 'active' : ''}`}
              onClick={() => setLanguage('fa')}
            >
              فا
            </button>
          </div>
          <button
            type="button"
            className={`segment-btn ${page === 'about' ? 'active' : ''}`}
            onClick={() => setPage(page === 'about' ? 'app' : 'about')}
          >
            {t(language, 'about')}
          </button>
        </div>
      </header>

      <main className="app-viewport">
        {page === 'about' ? (
          <AboutPage onBack={() => setPage('app')} />
        ) : (
          <>
            {step === 1 && <SourceStep />}
            {step === 2 && <DriveStep />}
            {step === 3 && <WriteStep />}
          </>
        )}
      </main>

      {page === 'app' && step < 3 && (
        <footer className="app-action-bar">
          <button
            type="button"
            className="mac-btn mac-btn-ghost"
            onClick={handleBack}
            disabled={step === 1}
          >
            {language === 'fa' ? (
              <>
                <span>{t(language, 'back')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                <span>{t(language, 'back')}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="mac-btn mac-btn-primary"
            disabled={!canContinue()}
            onClick={handleNext}
          >
            {language === 'fa' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                <span>{t(language, 'continue')}</span>
              </>
            ) : (
              <>
                <span>{t(language, 'continue')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  );
}
