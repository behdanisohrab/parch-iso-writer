import type { OperationStage } from '../releases';
import ProgressBar from './ProgressBar';
import type { ProgressInfo, FlashProgressInfo } from '../releases';
import { useStore } from '../store';
import { t } from '../i18n';

interface StageDef {
  key: OperationStage | 'checksum';
  label: string;
}

function StageBadge({ currentIdx, idx, stage, label, isError }: {
  currentIdx: number; idx: number; stage: OperationStage; label: string; isError: boolean;
}) {
  const current = currentIdx === idx;
  const done = currentIdx > idx;
  return (
    <div className={`pipeline-badge ${done ? 'done' : ''} ${current ? 'current' : ''} ${isError && current ? 'error' : ''}`}>
      {done && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {isError && current && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
      {!done && !(isError && current) && <span>{idx + 1}</span>}
      <span>{label}</span>
    </div>
  );
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
    stages = [
      { key: 'flashing', label: t(language, 'flashStep') },
    ];
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

  const stageOrder = stages.map(s => s.key);
  const stageKey: OperationStage | 'checksum' = stage === 'verifying' ? 'checksum' : stage;
  const currentIdx = stage === 'done' ? stageOrder.length : stageOrder.indexOf(stageKey);
  const isError = stage === 'error';

  return (
    <div className="card pipeline-card">
      <div className="pipeline-trackline">
        {stages.map((s, i) => (
          <div key={s.key} className="pipeline-trackline-node">
            <StageBadge currentIdx={currentIdx} idx={i} stage={stage} label={s.label} isError={isError} />
            {i < stages.length - 1 && (
              <div
                className="pipeline-connector"
                style={{ background: currentIdx > i ? 'var(--accent)' : 'var(--border)' }}
              />
            )}
          </div>
        ))}
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
        <div className="pipeline-note">
          {t(language, 'verifying')}
        </div>
      )}

      {verificationOk === true && stage !== 'verifying' && (
        <div className="pipeline-note ok">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t(language, 'checksumOk')}
        </div>
      )}
      {verificationOk === false && (
        <div className="pipeline-note error">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {t(language, 'checksumFail')}
        </div>
      )}

      {stage === 'extracting' && extractProgress !== null && (
        <ProgressBar
          percent={extractProgress}
          label={t(language, 'extracting')}
        />
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
        <div className="pipeline-success">
          {t(language, 'ready')}
        </div>
      )}

      {stage === 'error' && (
        <div className="pipeline-failed">
          {t(language, 'operationFailed')}
        </div>
      )}
    </div>
  );
}
