"use client";
import { useTranslations } from "next-intl";
import { MOMENT_KINDS, type MomentKind } from "@/lib/domain";
import { MomentIcon } from "./MomentChip";

/* Birikmiş davranış kanıtı. Ürünün "not degil, davranis" tarafı —
   sıfır olanları da gösteriyoruz ki neyin ölçüldüğü görünsün. */
export function TeachingEvidence({
  counts,
  compact = false,
}: {
  counts: Partial<Record<MomentKind, number>>;
  compact?: boolean;
}) {
  const t = useTranslations("app.moment");
  const any = MOMENT_KINDS.some((k) => (counts[k] ?? 0) > 0);
  if (!any && compact) return null;
  return (
    <ul className={compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
      {MOMENT_KINDS.map((k) => {
        const n = counts[k] ?? 0;
        if (compact && n === 0) return null;
        return (
          <li
            key={k}
            className={`flex items-center gap-2 text-[13.5px] ${n > 0 ? "text-primary" : "text-ink-3"}`}
            title={t(`desc.${k}`)}
          >
            <MomentIcon kind={k} />
            <span className={n > 0 ? "font-semibold" : ""}>{t(`kind.${k}`)}</span>
            <span className="meta ml-auto tabular-nums">{n > 0 ? `×${n}` : "—"}</span>
          </li>
        );
      })}
    </ul>
  );
}
