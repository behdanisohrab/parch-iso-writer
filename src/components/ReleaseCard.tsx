import type { Release } from '../releases';

export default function ReleaseCard({
  release,
  selected,
  onSelect,
}: {
  release: Release;
  selected: boolean;
  onSelect: () => void;
}) {
  const isImgTarXz = release.kind === 'ImgTarXz';

  return (
    <button
      className={`card release-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="release-card-header">
        <div className="release-card-title-wrap">
          <div className="release-card-icon">
            {release.edition.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="release-card-name">{release.name}</div>
            <div className="release-card-edition">{release.edition}</div>
          </div>
        </div>
        {selected && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="release-card-check">
            <circle cx="8" cy="8" r="7" stroke="var(--accent)" strokeWidth="2"/>
            <path d="M5 8l2 2 4-4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      <div className="release-card-badges">
        <span className="badge">{release.arch}</span>
        {isImgTarXz && <span className="badge badge-accent">.tar.xz</span>}
      </div>

      <div className="release-card-description">
        {release.description}
      </div>
    </button>
  );
}
