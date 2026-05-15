import { useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { useStore } from '../store';
import PipelineProgress from '../components/PipelineProgress';
import ConfirmWrite from '../components/ConfirmWrite';
import type {
  ProgressInfo,
  FlashProgressInfo,
  Release,
  VerifyMode,
} from '../releases';
import { formatBytes } from '../releases';
import { t } from '../i18n';

function getPipelineKind(release: Release | null, sourceMode: string) {
  if (sourceMode === 'local') return 'local' as const;
  if (!release) return 'Iso' as const;
  if (release.kind === 'ImgTarXz') return 'ImgTarXz' as const;
  return 'Iso' as const;
}

function getOverallProgress(
  stage: string,
  downloadProgress: ProgressInfo | null,
  extractProgress: number | null,
  flashProgress: FlashProgressInfo | null,
): number {
  switch (stage) {
    case 'downloading':
      return downloadProgress && downloadProgress.total_bytes > 0
        ? (downloadProgress.downloaded_bytes / downloadProgress.total_bytes) * 100
        : 0;
    case 'verifying':
      return 100;
    case 'extracting':
      return extractProgress ?? 0;
    case 'flashing':
      return flashProgress && flashProgress.total_bytes > 0
        ? (flashProgress.written_bytes / flashProgress.total_bytes) * 100
        : 0;
    case 'done':
      return 100;
    default:
      return 0;
  }
}

export default function WriteStep() {
  const {
    sourceMode,
    selectedRelease,
    localFilePath,
    selectedDrive,
    stage,
    setStage,
    downloadProgress,
    setDownloadProgress,
    extractProgress,
    setExtractProgress,
    flashProgress,
    setFlashProgress,
    verificationOk,
    setVerificationOk,
    error,
    setError,
    confirmChecked,
    setConfirmChecked,
    verifyMode,
    setVerifyMode,
    allowNonRemovable,
    setAllowNonRemovable,
    setStep,
    reset,
    language,
  } = useStore();

  const cancelRef = useRef(false);

  useEffect(() => {
    const unlisten1 = listen<ProgressInfo>('download_progress', (e) => {
      setDownloadProgress(e.payload);
    });
    const unlisten2 = listen<{ percent: number }>('extract_progress', (e) => {
      setExtractProgress(e.payload.percent);
    });
    const unlisten3 = listen<FlashProgressInfo>('flash_progress', (e) => {
      setFlashProgress(e.payload);
    });
    return () => {
      unlisten1.then((f) => f());
      unlisten2.then((f) => f());
      unlisten3.then((f) => f());
    };
  }, [setDownloadProgress, setExtractProgress, setFlashProgress]);

  const pipelineKind = getPipelineKind(selectedRelease, sourceMode);

  const overallProgress = getOverallProgress(stage, downloadProgress, extractProgress, flashProgress);

  const progressLabel = stage === 'downloading'
    ? t(language, 'downloading')
    : stage === 'verifying'
    ? t(language, 'verifying')
    : stage === 'extracting'
    ? t(language, 'extracting')
    : stage === 'flashing'
    ? t(language, 'writing')
    : stage === 'done'
    ? 'Complete'
    : '';

  const progressSublabel = stage === 'downloading' && downloadProgress
    ? `${formatBytes(downloadProgress.downloaded_bytes)} / ${formatBytes(downloadProgress.total_bytes)}`
    : stage === 'flashing' && flashProgress
    ? `${formatBytes(flashProgress.written_bytes)} / ${formatBytes(flashProgress.total_bytes)}`
    : '';

  const start = useCallback(async () => {
    cancelRef.current = false;
    setError(null);
    setVerificationOk(null);
    setDownloadProgress(null);
    setExtractProgress(null);
    setFlashProgress(null);

    try {
      let sourcePath = localFilePath || '';

      if (sourceMode === 'download' && selectedRelease) {
        setStage('downloading');

        const filename = selectedRelease.url.split('/').pop() || 'download.iso';
        const destPath = `/tmp/parch-iso-writer/${filename}`;

        await invoke('download_release', {
          url: selectedRelease.url,
          destPath,
        });

        if (cancelRef.current) return;

        if (selectedRelease.checksum_url && selectedRelease.checksum_kind !== 'None') {
          setStage('verifying');

          const expected = await invoke<string>('fetch_checksum', {
            checksumUrl: selectedRelease.checksum_url,
            targetFilename: filename,
          });

          const ok = await invoke<boolean>('verify_checksum', {
            filePath: destPath,
            expected,
            kind: selectedRelease.checksum_kind === 'Md5' ? 'md5' : 'sha256',
          });

          setVerificationOk(ok);

          if (!ok) {
            setStage('error');
            setError('Checksum verification failed. The download may be corrupt.');
            return;
          }
        } else {
          setVerificationOk(true);
        }

        if (selectedRelease.kind === 'ImgTarXz') {
          setStage('extracting');
          const extractPath = `/tmp/parch-iso-writer/extracted`;
          sourcePath = await invoke<string>('extract_img_from_tar_xz', {
            archivePath: destPath,
            destDir: extractPath,
          });
        } else {
          sourcePath = destPath;
        }
      }
      if (sourceMode === 'local' && sourcePath) {
        const shaPath = `${sourcePath}.sha256`;
        const md5Path = `${sourcePath}.md5`;
        if (await exists(shaPath)) {
          setStage('verifying');
          const line = (await readTextFile(shaPath)).split('\n')[0]?.trim() || '';
          const expected = line.split(/\s+/)[0] || '';
          if (!expected) throw new Error('Invalid .sha256 file');
          const ok = await invoke<boolean>('verify_checksum', { filePath: sourcePath, expected, kind: 'sha256' });
          setVerificationOk(ok);
          if (!ok) throw new Error('Local SHA256 checksum mismatch');
        } else if (await exists(md5Path)) {
          setStage('verifying');
          const line = (await readTextFile(md5Path)).split('\n')[0]?.trim() || '';
          const expected = line.split(/\s+/)[0] || '';
          if (!expected) throw new Error('Invalid .md5 file');
          const ok = await invoke<boolean>('verify_checksum', { filePath: sourcePath, expected, kind: 'md5' });
          setVerificationOk(ok);
          if (!ok) throw new Error('Local MD5 checksum mismatch');
        }
      }

      setStage('flashing');

      await invoke('flash_image', {
        sourcePath,
        devicePath: selectedDrive?.path || '',
        options: {
          verifyMode,
          allowNonRemovable,
        },
      });

      if (!cancelRef.current) setStage('done');
    } catch (err: unknown) {
      if (!cancelRef.current) {
        setStage('error');
        setError(typeof err === 'string' ? err : (err as Error).message || 'Unknown error');
      }
    }
  }, [sourceMode, selectedRelease, localFilePath, selectedDrive, pipelineKind, setStage, setError, setVerificationOk, setDownloadProgress, setExtractProgress, setFlashProgress, verifyMode, allowNonRemovable]);

  const handleCancel = async () => {
    cancelRef.current = true;
    await Promise.all([
      invoke('cancel_download').catch(() => {}),
      invoke('cancel_flash').catch(() => {}),
    ]);
    setStage('idle');
  };

  const sourceLabel = selectedRelease
    ? `${selectedRelease.name}  (${selectedRelease.url.split('/').pop()})`
    : localFilePath
    ? localFilePath.split('/').pop() || localFilePath
    : 'N/A';

  const isActive = stage === 'downloading' || stage === 'verifying' || stage === 'extracting' || stage === 'flashing';

  return (
    <div className="write-step">
      <div className="card summary-card">
        <div className="summary-title">
          {t(language, 'summary')}
        </div>
        <div className="summary-content">
          <div>
            <span className="summary-key">{t(language, 'sourceLabel')}: </span>
            {sourceLabel}
            {downloadProgress?.total_bytes
              ? `  (${formatBytes(downloadProgress.total_bytes)})`
              : ''}
          </div>
          {pipelineKind !== 'local' && selectedDrive && (
            <div>
              <span className="summary-key">{t(language, 'targetLabel')}: </span>
              {selectedDrive.name}  {selectedDrive.path}  ({formatBytes(selectedDrive.size_bytes)})
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <div className="card logo-progress-card">
          <div className="logo-progress-ring-wrap">
            <svg width={104} height={104} viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={326.73}
                strokeDashoffset={326.73 * (1 - overallProgress / 100)}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <div className="logo-progress-pct">{overallProgress.toFixed(0)}%</div>
          </div>
          <div className="logo-progress-label">{progressLabel}</div>
          {progressSublabel && <div className="logo-progress-sublabel">{progressSublabel}</div>}
        </div>
      )}

      {stage === 'error' && error && (
        <div className="card write-error-card">
          <div className="write-error-title">{t(language, 'error')}</div>
          <div className="write-error-body">{error}</div>
        </div>
      )}

      {pipelineKind !== 'local' && stage === 'idle' && (
        <ConfirmWrite
          deviceName={selectedDrive?.name || ''}
          checked={confirmChecked}
          onChange={setConfirmChecked}
        />
      )}
      {stage === 'idle' && (
        <div className="card confirm-write">
          <label>{t(language, 'verifyMode')}</label>
          <select
            value={verifyMode}
            onChange={(e) => setVerifyMode(e.target.value as VerifyMode)}
            aria-label={t(language, 'verifyMode')}
          >
            <option value="first_block">{t(language, 'quickVerify')}</option>
            <option value="sampled">{t(language, 'sampledVerify')}</option>
            <option value="full">{t(language, 'fullVerify')}</option>
            <option value="none">{t(language, 'noVerify')}</option>
          </select>
          <label className="confirm-write-check">
            <input
              type="checkbox"
              checked={allowNonRemovable}
              onChange={(e) => setAllowNonRemovable(e.target.checked)}
            />
            {t(language, 'allowNonRemovable')}
          </label>
        </div>
      )}

      <PipelineProgress
        kind={pipelineKind}
        stage={stage}
        downloadProgress={downloadProgress}
        extractProgress={extractProgress}
        flashProgress={flashProgress}
        verificationOk={verificationOk}
      />

      <div className="nav-buttons">
        <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={isActive}>
          {t(language, 'back')}
        </button>
        <div className="write-actions">
          {stage === 'idle' && (
            <button
              className="btn btn-primary"
              disabled={
                pipelineKind !== 'local' &&
                (!selectedDrive || !confirmChecked)
              }
              onClick={start}
            >
              {t(language, 'startWriting')}
            </button>
          )}
          {isActive && (
            <button className="btn btn-secondary" onClick={handleCancel}>
              {t(language, 'cancel')}
            </button>
          )}
          {stage === 'done' && (
            <>
              <button className="btn btn-secondary" onClick={() => invoke('eject_drive', { devicePath: selectedDrive?.path || '' })}>
                {t(language, 'ejectDrive')}
              </button>
              <button className="btn btn-secondary" onClick={() => invoke('open_logs_folder')}>
                {t(language, 'openLogs')}
              </button>
              <button className="btn btn-primary" onClick={reset}>
                {t(language, 'writeAnother')}
              </button>
            </>
          )}
          {stage === 'error' && (
            <button className="btn btn-primary" onClick={start}>
              {t(language, 'retry')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
