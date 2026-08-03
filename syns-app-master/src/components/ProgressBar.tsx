interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'var(--accent-blue)',
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-sm font-semibold text-text">{pct}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-bg-tertiary"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
