import { useStore } from '../store';
import { t } from '../i18n';

export type CategoryFilterType = 'all' | 'flagship' | 'lightweight' | 'minimal' | 'special';

const CATEGORIES: { id: CategoryFilterType; labelKey: 'all' | 'flagship' | 'lightweight' | 'minimal' | 'special' }[] = [
  { id: 'all', labelKey: 'all' },
  { id: 'flagship', labelKey: 'flagship' },
  { id: 'lightweight', labelKey: 'lightweight' },
  { id: 'minimal', labelKey: 'minimal' },
  { id: 'special', labelKey: 'special' },
];

export default function ArchFilter({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  const { language } = useStore();

  return (
    <div className="filter-chip-bar" role="tablist" aria-label="Edition Categories">
      {CATEGORIES.map((cat) => {
        const isSelected = (selected === null && cat.id === 'all') || selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            className={`mac-filter-chip ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(cat.id === 'all' ? null : cat.id)}
            role="tab"
            aria-selected={isSelected}
          >
            {t(language, cat.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
