import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ArchFilter from '../components/ArchFilter';
import ReleaseCard from '../components/ReleaseCard';
import DropZone from '../components/DropZone';
import { useStore } from '../store';
import type { Release } from '../releases';
import { t } from '../i18n';

const CATEGORY_MAP: Record<string, string[]> = {
  flagship: ['gnome', 'plasma'],
  lightweight: ['xfce', 'lite'],
  minimal: ['hyprland', 'mini'],
  special: ['immutable', 'cosmic'],
};

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
    releaseSearch,
    setReleaseSearch,
    language,
  } = useStore();

  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    invoke<Release[]>('get_releases').then(setReleases).catch(console.error);
  }, []);

  const q = releaseSearch.trim().toLowerCase();
  const filtered = releases.filter((r) => {
    if (archFilter && CATEGORY_MAP[archFilter]) {
      const allowed = CATEGORY_MAP[archFilter];
      if (!allowed.includes(r.id.toLowerCase()) && !allowed.includes(r.edition.toLowerCase())) {
        return false;
      }
    }
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.edition.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.description_fa.includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="step-fixed-header">
        <div className="step-header-row">
          <div className="mac-segmented" role="tablist">
            <button
              type="button"
              className={`mac-segmented-item ${sourceMode === 'download' ? 'active' : ''}`}
              onClick={() => setSourceMode('download')}
              role="tab"
              aria-selected={sourceMode === 'download'}
            >
              {t(language, 'download')}
            </button>
            <button
              type="button"
              className={`mac-segmented-item ${sourceMode === 'local' ? 'active' : ''}`}
              onClick={() => setSourceMode('local')}
              role="tab"
              aria-selected={sourceMode === 'local'}
            >
              {t(language, 'localFile')}
            </button>
          </div>

          {sourceMode === 'download' && (
            <ArchFilter selected={archFilter} onSelect={setArchFilter} />
          )}
        </div>

        {sourceMode === 'download' && (
          <div className="mac-search-wrap">
            <svg
              className="mac-search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="mac-search-input"
              value={releaseSearch}
              onChange={(e) => setReleaseSearch(e.target.value)}
              placeholder={t(language, 'searchReleases')}
              aria-label={t(language, 'searchReleases')}
            />
          </div>
        )}
      </div>

      <div className="step-scroll-content">
        {sourceMode === 'download' ? (
          <div className="release-grid" role="radiogroup" aria-label="Official Releases">
            {filtered.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                selected={selectedRelease?.id === release.id}
                onSelect={() => setSelectedRelease(release)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DropZone onFileSelected={(path) => setLocalFilePath(path)} />

            {localFilePath && (
              <div className="mac-file-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {localFilePath.split('/').pop() || localFilePath}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {localFilePath}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mac-btn mac-btn-secondary"
                  style={{ height: 28, minWidth: 64, fontSize: 11 }}
                  onClick={() => setLocalFilePath(null)}
                >
                  {t(language, 'cancel')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
