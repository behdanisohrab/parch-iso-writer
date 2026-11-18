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
        const downloadDest = `/tmp/parch-iso-writer/${filename}`;

        await invoke('download_release', {
          url: selectedRelease.url,
          destPath: downloadDest,
        });

        if (cancelRef.current) return;

        if (selectedRelease.checksum_url && selectedRelease.checksum_kind !== 'None') {
          setStage('verifying');
          const expected = await invoke<string>('fetch_checksum', {
            checksumUrl: selectedRelease.checksum_url,
            targetFilename: filename,
          });

          const ok = await invoke<boolean>('verify_checksum', {
            filePath: downloadDest,
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
          sourcePath = await invoke<string>('extract_img_from_tar_xz', {
            archivePath: downloadDest,
            destDir: '/tmp/parch-iso-writer/extracted',
          });
        } else {
          sourcePath = downloadDest;
        }
      }

      if (sourceMode === 'local' && sourcePath) {
        const sidecarSha = `${sourcePath}.sha256`;
        const sidecarMd5 = `${sourcePath}.md5`;

        if (await exists(sidecarSha)) {
          setStage('verifying');
          const content = await readTextFile(sidecarSha);
          const expected = content.split(/\s+/)[0]?.trim();
          const ok = await invoke<boolean>('verify_checksum', {
            filePath: sourcePath,
            expected,
            kind: 'sha256',
          });
          setVerificationOk(ok);
          if (!ok) {
            setStage('error');
            setError('Local SHA256 checksum verification failed.');
            return;
          }
        } else if (await exists(sidecarMd5)) {
          setStage('verifying');
          const content = await readTextFile(sidecarMd5);
          const expected = content.split(/\s+/)[0]?.trim();
          const ok = await invoke<boolean>('verify_checksum', {
            filePath: sourcePath,
            expected,
            kind: 'md5',
          });
          setVerificationOk(ok);
          if (!ok) {
            setStage('error');
            setError('Local MD5 checksum verification failed.');
            return;
          }
        }

        if (sourcePath.endsWith('.tar.xz')) {
          setStage('extracting');
          sourcePath = await invoke<string>('extract_img_from_tar_xz', {
            archivePath: sourcePath,
            destDir: '/tmp/parch-iso-writer/extracted',
          });
        }
      }

      if (cancelRef.current) return;

      if (!selectedDrive) {
        setStage('error');
        setError('No USB drive selected.');
        return;
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
        setError(
          typeof err === 'string'
            ? err
            : (err as Error).message || 'Unknown error during flashing'
        );
      }
    }
  }, [
    sourceMode,
    selectedRelease,
    localFilePath,
    selectedDrive,
    setStage,
    setError,
    setVerificationOk,
    setDownloadProgress,
    setExtractProgress,
    setFlashProgress,
    verifyMode,
    allowNonRemovable,
  ]);

  const handleCancel = async () => {
    cancelRef.current = true;
    await Promise.all([
      invoke('cancel_download').catch(() => {}),
      invoke('cancel_flash').catch(() => {}),
    ]);
    setStage('idle');
  };

  const sourceName = selectedRelease
    ? selectedRelease.name
    : localFilePath
    ? localFilePath.split('/').pop() || localFilePath
    : 'N/A';

  const sourceSub = selectedRelease
    ? selectedRelease.url.split('/').pop()
    : localFilePath || '';

  const isActive =
    stage === 'downloading' ||
    stage === 'verifying' ||
    stage === 'extracting' ||
    stage === 'flashing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="step-scroll-content">
        <div className="summary-strip">
          <div className="summary-strip-item">
            <span className="summary-strip-label">{t(language, 'sourceLabel')}</span>
            <span className="summary-strip-val" title={sourceName}>
              {sourceName}
            </span>
            <span className="summary-strip-sub">{sourceSub}</span>
          </div>

          <div className="summary-strip-item">
            <span className="summary-strip-label">{t(language, 'targetLabel')}</span>
            <span className="summary-strip-val">
              {selectedDrive?.name || selectedDrive?.model || 'No drive'}
            </span>
            <span className="summary-strip-sub">
              {selectedDrive
                ? `${selectedDrive.path} (${formatBytes(selectedDrive.size_bytes)})`
                : 'Select target'}
            </span>
          </div>
        </div>

        {stage === 'idle' && selectedDrive && (
          <ConfirmWrite
            deviceName={selectedDrive.name || selectedDrive.path}
            checked={confirmChecked}
            onChange={setConfirmChecked}
          />
        )}

        {stage === 'idle' && (
          <div className="mac-card" style={{ padding: '10px 14px' }}>
            <div className="mac-settings-row">
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t(language, 'verifyMode')}
              </label>
              <select
                className="mac-select"
                value={verifyMode}
                onChange={(e) => setVerifyMode(e.target.value as VerifyMode)}
                aria-label={t(language, 'verifyMode')}
              >
                <option value="first_block">{t(language, 'quickVerify')}</option>
                <option value="sampled">{t(language, 'sampledVerify')}</option>
                <option value="full">{t(language, 'fullVerify')}</option>
                <option value="none">{t(language, 'noVerify')}</option>
              </select>
            </div>

            <label className="mac-checkbox-label" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={allowNonRemovable}
                onChange={(e) => setAllowNonRemovable(e.target.checked)}
              />
              <span>{t(language, 'allowNonRemovable')}</span>
            </label>
          </div>
        )}

        {stage === 'error' && error && (
          <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--system-red-dim)', border: '1px solid rgba(255, 69, 58, 0.35)', color: 'var(--system-red)' }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{t(language, 'error')}</div>
            <div style={{ fontSize: 11 }}>{error}</div>
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
      </div>

      <footer className="app-action-bar" style={{ margin: '0 -20px', padding: '0 20px' }}>
        <button
          type="button"
          className="mac-btn mac-btn-ghost"
          onClick={() => setStep(2)}
          disabled={isActive}
        >
          {t(language, 'back')}
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {stage === 'idle' && (
            <button
              type="button"
              className="mac-btn mac-btn-primary"
              disabled={!selectedDrive || !confirmChecked}
              onClick={start}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{t(language, 'startWriting')}</span>
            </button>
          )}

          {isActive && (
            <button
              type="button"
              className="mac-btn mac-btn-danger"
              onClick={handleCancel}
            >
              {t(language, 'cancel')}
            </button>
          )}

          {stage === 'done' && (
            <>
              <button
                type="button"
                className="mac-btn mac-btn-secondary"
                onClick={() =>
                  invoke('eject_drive', {
                    devicePath: selectedDrive?.path || '',
                  })
                }
              >
                {t(language, 'ejectDrive')}
              </button>
              <button
                type="button"
                className="mac-btn mac-btn-secondary"
                onClick={() => invoke('open_logs_folder')}
              >
                {t(language, 'openLogs')}
              </button>
              <button
                type="button"
                className="mac-btn mac-btn-primary"
                onClick={reset}
              >
                {t(language, 'writeAnother')}
              </button>
            </>
          )}

          {stage === 'error' && (
            <button
              type="button"
              className="mac-btn mac-btn-primary"
              onClick={start}
            >
              {t(language, 'retry')}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
