import type { Release } from '../releases';
import { useStore } from '../store';

const EDITION_COLORS: Record<string, { bg: string; color: string }> = {
  gnome: { bg: 'rgba(10, 132, 255, 0.18)', color: '#0a84ff' },
  plasma: { bg: 'rgba(100, 210, 255, 0.18)', color: '#64d2ff' },
  hyprland: { bg: 'rgba(0, 210, 180, 0.18)', color: '#00d2b4' },
  xfce: { bg: 'rgba(94, 92, 230, 0.18)', color: '#af52de' },
  cosmic: { bg: 'rgba(255, 159, 10, 0.18)', color: '#ff9f0a' },
  lite: { bg: 'rgba(48, 209, 88, 0.18)', color: '#30d158' },
  mini: { bg: 'rgba(235, 235, 245, 0.15)', color: '#ebebf5' },
  immutable: { bg: 'rgba(191, 90, 242, 0.18)', color: '#bf5af2' },
};

export default function ReleaseCard({
  release,
  selected,
  onSelect,
}: {
  release: Release;
  selected: boolean;
  onSelect: () => void;
}) {
  const { language } = useStore();
  const isTarXz = release.kind === 'ImgTarXz';
  const edKey = release.edition.toLowerCase();
  const style = EDITION_COLORS[edKey] || { bg: 'rgba(255, 255, 255, 0.1)', color: '#fff' };

  const description = language === 'fa' ? release.description_fa : release.description;

  return (
    <div
      role="radio"
      tabIndex={0}
      aria-checked={selected}
      className={`mac-release-row ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="mac-release-leading">
        <div
          className="edition-monogram"
          style={{
            background: selected ? 'var(--accent)' : style.bg,
            color: selected ? 'var(--accent-contrast)' : style.color,
          }}
          aria-hidden="true"
        >
          {release.edition.slice(0, 2).toUpperCase()}
        </div>
        <div className="mac-release-meta">
          <div className="mac-release-title-row">
            <span className="mac-release-name">{release.name}</span>
            <span className="mac-release-edition-tag">{release.edition}</span>
          </div>
          <span className="mac-release-desc" title={description}>
            {description}
          </span>
        </div>
      </div>

      <div className="mac-release-trailing">
        <span className="mac-badge mac-badge-neutral">{release.arch}</span>
        {isTarXz ? (
          <span className="mac-badge mac-badge-accent">.tar.xz</span>
        ) : (
          <span className="mac-badge mac-badge-neutral">ISO</span>
        )}
        <div className="mac-radio-circle" aria-hidden="true">
          {selected && <div className="mac-radio-inner" />}
        </div>
      </div>
    </div>
  );
}
