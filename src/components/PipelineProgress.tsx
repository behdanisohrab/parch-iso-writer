import type { OperationStage } from '../releases';
import ProgressBar from './ProgressBar';
import type { ProgressInfo, FlashProgressInfo } from '../releases';
import { useStore } from '../store';
import { t } from '../i18n';

interface StageDef {
  key: OperationStage | 'checksum';
  label: string;
}

export default function PipelineProgress({
  kind,
  stage,
  downloadProgress,
  extractProgress,
  flashProgress,
  verificationOk,
}: {
  kind: 'Iso' | 'ImgTarXz' | 'local';
  stage: OperationStage;
  downloadProgress: ProgressInfo | null;
  extractProgress: number | null;
  flashProgress: FlashProgressInfo | null;
  verificationOk: boolean | null;
}) {
  const { language } = useStore();

  let stages: StageDef[];
  if (kind === 'local') {
    stages = [{ key: 'flashing', label: t(language, 'flashStep') }];
  } else if (kind === 'ImgTarXz') {
    stages = [
      { key: 'downloading', label: t(language, 'downloadStep') },
      { key: 'checksum', label: t(language, 'verifyStep') },
      { key: 'extracting', label: t(language, 'extractStep') },
      { key: 'flashing', label: t(language, 'flashStep') },
    ];
  } else {
    stages = [
      { key: 'downloading', label: t(language, 'downloadStep') },
      { key: 'checksum', label: t(language, 'verifyStep') },
      { key: 'flashing', label: t(language, 'flashStep') },
    ];
  }

  const stageOrder = stages.map((s) => s.key);
  const stageKey: OperationStage | 'checksum' = stage === 'verifying' ? 'checksum' : stage;
  const currentIdx = stage === 'done' ? stageOrder.length : stageOrder.indexOf(stageKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="mac-pipeline-track">
        {stages.map((s, i) => {
          const isCurrent = currentIdx === i;
          const isDone = currentIdx > i;

          return (
            <div key={s.key} className="mac-pipeline-node">
              <div
                className={`mac-pipeline-chip ${isDone ? 'done' : ''} ${
                  isCurrent ? 'current' : ''
                }`}
              >
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                )}
                <span>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className="mac-pipeline-line"
                  style={{
                    background: isDone ? 'var(--accent)' : 'var(--apple-border)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {stage === 'downloading' && downloadProgress && (
        <ProgressBar
          percent={
            downloadProgress.total_bytes > 0
              ? (downloadProgress.downloaded_bytes / downloadProgress.total_bytes) * 100
              : 0
          }
          current={downloadProgress.downloaded_bytes}
          total={downloadProgress.total_bytes}
          speed={downloadProgress.speed_bps}
          eta={downloadProgress.eta_secs}
          label={t(language, 'downloading')}
        />
      )}

      {stage === 'verifying' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--apple-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--apple-border)' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t(language, 'verifying')}</span>
        </div>
      )}

      {verificationOk === true && stage !== 'verifying' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--system-green)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-5" />
          </svg>
          <span>{t(language, 'checksumOk')}</span>
        </div>
      )}

      {verificationOk === false && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--system-red)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
          <span>{t(language, 'checksumFail')}</span>
        </div>
      )}

      {stage === 'extracting' && extractProgress !== null && (
        <ProgressBar percent={extractProgress} label={t(language, 'extracting')} />
      )}

      {stage === 'flashing' && flashProgress && (
        <ProgressBar
          percent={
            flashProgress.total_bytes > 0
              ? (flashProgress.written_bytes / flashProgress.total_bytes) * 100
              : 0
          }
          current={flashProgress.written_bytes}
          total={flashProgress.total_bytes}
          speed={flashProgress.speed_bps}
          label={t(language, 'writing')}
        />
      )}

      {stage === 'done' && (
        <div className="mac-success-hero">
          <div className="mac-success-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="mac-success-title">{t(language, 'ready')}</div>
          <div className="mac-success-desc">
            {language === 'fa'
              ? 'حافظه نصاب با موفقیت ساخته شد. می‌توانید سیستم خود را با این فلش‌مموری بوت کنید.'
              : 'The bootable drive was successfully created. You can now restart your computer and boot from this USB drive.'}
          </div>
        </div>
      )}
    </div>
  );
}
