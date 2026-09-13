/* Yüzde çubuğu. Genişlik yerine scaleX: hem daha akıcı (yalnız birleştirme
   katmanında çalışır) hem de göründüğü anda sıfırdan dolabiliyor. */
export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-[5px] overflow-hidden rounded-[3px] bg-surface-2 ${className}`}
      role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
    >
      <i className="bar-fill block h-full w-full bg-glow" style={{ "--pct": percent / 100 } as React.CSSProperties} />
    </div>
  );
}
