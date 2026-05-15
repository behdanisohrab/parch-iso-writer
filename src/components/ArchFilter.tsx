import { ARCH_LABELS } from '../releases';
import { useStore } from '../store';
import { t } from '../i18n';

const ARCHES = ['x86_64', 'aarch64', 'rpi-aarch64', 'wsl'] as const;

export default function ArchFilter({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (arch: string | null) => void;
}) {
  const { language } = useStore();
  return (
    <div className="arch-filter">
      <button
        className={`btn ${selected === null ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: 11, padding: '5px 12px' }}
        onClick={() => onSelect(null)}
      >
        {t(language, 'all')}
      </button>
      {ARCHES.map((arch) => (
        <button
          key={arch}
          className={`btn ${selected === arch ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: 11, padding: '5px 12px' }}
          onClick={() => onSelect(arch === selected ? null : arch)}
        >
          {ARCH_LABELS[arch] || arch}
        </button>
      ))}
    </div>
  );
}
