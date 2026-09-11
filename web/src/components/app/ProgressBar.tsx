export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div className={`h-[5px] overflow-hidden rounded-[3px] bg-surface-2 ${className}`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <i className="block h-full bg-glow transition-[width] duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
}
