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
    <div className="progress-block">
      <div className="progress-label">{label}</div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="progress-meta">
        <span>
          {clamped.toFixed(0)}%
          {current !== undefined && total !== undefined && total > 0
            ? `  -  ${formatBytes(current)} / ${formatBytes(total)}`
            : ''}
        </span>
        <span>
          {speed !== undefined && speed > 0 ? formatSpeed(speed) : ''}
          {eta !== undefined && eta > 0 ? `  -  ETA ${formatEta(eta)}` : ''}
        </span>
      </div>
    </div>
  );
}
