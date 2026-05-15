import type { AppStep } from '../releases';
import './StepIndicator.css';

export default function StepIndicator({
  current,
  labels,
}: {
  current: AppStep;
  labels: { source: string; drive: string; write: string };
}) {
  const STEPS: { num: AppStep; label: string }[] = [
    { num: 1, label: labels.source },
    { num: 2, label: labels.drive },
    { num: 3, label: labels.write },
  ];

  return (
    <div className="step-indicator">
      {STEPS.map((s, i) => (
        <div key={s.num} className="step-item-wrapper">
          <div className={`step-item ${current === s.num ? 'active' : ''} ${current > s.num ? 'done' : ''}`}>
            <div className="step-circle">
              {current > s.num ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : s.num}
            </div>
            <div className="step-label">{s.label}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-connector ${current > s.num ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
