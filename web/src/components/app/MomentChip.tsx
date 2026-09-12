"use client";
import { useTranslations } from "next-intl";
import type { MomentKind } from "@/lib/domain";

/* Boşluk etiketinin olumlu ikizi. Boşluk kesik kenarlıklı amber; bu düz kenarlıklı
   birincil renk — ikisi yan yana durduğunda karışmasınlar. */
export function MomentIcon({ kind }: { kind: MomentKind }) {
  const d: Record<MomentKind, string> = {
    persistence: "M12 3v18M7 8l5-5 5 5",              // yukarı ok — devam etti
    causal: "M5 12h6m0 0l-2-2m2 2l-2 2M13 6h6v12h-6", // neden → sonuç
    concrete: "M4 7h16M4 12h10M4 17h7",               // somut liste
    simplify: "M4 8h16M6 12h12M9 16h6",               // daralan
    curiosity: "M12 19V9M8 13l4-4 4 4M5 5h14",        // ileri sıçrama
  };
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d={d[kind]} />
    </svg>
  );
}

export function MomentChip({ kind, label }: { kind: MomentKind; label: string }) {
  const t = useTranslations("app.moment");
  return (
    <div className="flex items-center gap-2 self-start rounded-[var(--radius-ui)] border border-primary/45 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-2.5 py-1 text-[13px] text-primary">
      <MomentIcon kind={kind} />
      <span className="font-semibold">{t(`kind.${kind}`)}</span>
      <span className="meta !text-primary/85">— {label}</span>
    </div>
  );
}
