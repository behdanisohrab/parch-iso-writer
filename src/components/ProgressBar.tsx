import { formatBytes, formatSpeed, formatEta } from '../releases';

export default function ProgressBar({
  percent,
  current,
  total,
  speed,
  eta,
  label,
}: {
  percent: number;
  current?: number;
  total?: number;
  speed?: number;
  eta?: number;
  label: string;
}) {
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="mac-progress-box">
      <div className="mac-progress-info">
        <span className="mac-progress-stage">{label}</span>
        <span className="mac-progress-pct">{clamped.toFixed(0)}%</span>
      </div>

      <div
        className="mac-progress-track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="mac-progress-fill" style={{ width: `${clamped}%` }} />
      </div>

      <div className="mac-progress-meta">
        <span>
          {current !== undefined && total !== undefined && total > 0
            ? `${formatBytes(current)} / ${formatBytes(total)}`
            : ''}
        </span>
        <span>
          {speed !== undefined && speed > 0 ? formatSpeed(speed) : ''}
          {eta !== undefined && eta > 0 ? ` (ETA: ${formatEta(eta)})` : ''}
        </span>
      </div>
    </div>
  );
}
