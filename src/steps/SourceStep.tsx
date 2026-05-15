import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ArchFilter from '../components/ArchFilter';
import ReleaseCard from '../components/ReleaseCard';
import DropZone from '../components/DropZone';
import { useStore } from '../store';
import type { Release } from '../releases';
import { t } from '../i18n';

export default function SourceStep() {
  const {
    sourceMode,
    setSourceMode,
    selectedRelease,
    setSelectedRelease,
    localFilePath,
    setLocalFilePath,
    archFilter,
    setArchFilter,
    language,
  } = useStore();

  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    invoke<Release[]>('get_releases').then(setReleases).catch(console.error);
  }, []);

  const filtered = archFilter
    ? releases.filter((r) => r.arch === archFilter)
    : releases;

  return (
    <div className="source-step">
      <div className="source-tabs">
        <button
          className={`btn ${sourceMode === 'download' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, padding: '7px 16px', fontSize: 12 }}
          onClick={() => setSourceMode('download')}
        >
          {t(language, 'download')}
        </button>
        <button
          className={`btn ${sourceMode === 'local' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, padding: '7px 16px', fontSize: 12 }}
          onClick={() => setSourceMode('local')}
        >
          {t(language, 'localFile')}
        </button>
      </div>

      {sourceMode === 'download' ? (
        <>
          <ArchFilter selected={archFilter} onSelect={setArchFilter} />
          <div className="release-list">
            {filtered.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                selected={selectedRelease?.id === release.id}
                onSelect={() => setSelectedRelease(release)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <DropZone
            onFileSelected={(path) => {
              setLocalFilePath(path);
            }}
          />
          {localFilePath && (
            <div className="card local-file-selected">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l3 3 7-7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{localFilePath}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
