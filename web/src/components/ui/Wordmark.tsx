import { LOGO_LETTERS, LOGO_MARK, LOGO_UNDERSCORE, LOGO_VIEWBOX } from "@/lib/logoPaths";

/* Tema renklerini CSS değişkenlerinden alan inline kilit — her boyutta keskin */
export function Wordmark({ className = "", title = "Tutorla" }: { className?: string; title?: string }) {
  const m = LOGO_MARK;
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label={title}>
      <rect x={m.x} y={m.y} width={m.w} height={m.h} rx={m.rx} fill="var(--logo-mark)" />
      {LOGO_LETTERS.map((d, i) => (
        <path key={i} d={d} fill="var(--logo-ink)" />
      ))}
      <path d={LOGO_UNDERSCORE} fill="var(--logo-mark)" />
    </svg>
  );
}
