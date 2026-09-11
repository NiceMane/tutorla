import type { ConceptStatus } from "@/lib/domain";

/* Figtree'de ✓ ve ✕ glifi yok — inline SVG, renkleri token'lardan alıyor. */
export function ConceptIcon({ status }: { status: ConceptStatus }) {
  const cls = status === "settled" ? "text-primary" : status === "gap" ? "text-accent" : "text-ink-3";
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${cls}`} aria-hidden="true">
      {status === "settled" ? <path d="M3 8.5l3.2 3L13 4.5" /> : <path d="M4 4l8 8M12 4l-8 8" />}
    </svg>
  );
}
