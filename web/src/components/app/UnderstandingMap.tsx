"use client";
import { useTranslations } from "next-intl";
import type { Concept, ConceptStatus } from "@/lib/domain";
import { ProgressBar } from "./ProgressBar";
import { ConceptIcon } from "./ConceptIcon";

export type MapProps = {
  topicName: string;
  concepts: Concept[];
  states: Record<string, ConceptStatus>;
  /* Bir kez boşluk olup sonra oturan kavramlar — anlatarak kapatılanlar */
  closed: Set<string>;
  targetId: string | null;
  percent: number;
  settled: number;
  asked: number;
  note: string | null;
  /* Mobil şeritte başlık ve yüzde zaten var; panelde tekrarlamasın */
  showHeader?: boolean;
};

/* Hem masaüstü sağ panelinde hem mobil açılır panelinde kullanılır. */
export function UnderstandingMap({ topicName, concepts, states, closed, targetId, percent, settled, asked, note, showHeader = true }: MapProps) {
  const t = useTranslations("app.session");
  const closedCount = concepts.filter((c) => states[c.id] === "settled" && closed.has(c.id)).length;
  return (
    <div className="flex flex-col gap-3.5">
      {showHeader && (
        <div className="flex flex-col gap-2">
          <span className="meta text-[13.5px]">{t("map")}</span>
          <div className="flex items-baseline justify-between">
            <b className="text-[14px] font-semibold">{topicName}</b>
            <span className="meta text-[13.5px] !text-primary tabular-nums">%{percent}</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      )}
      <ul className="flex flex-col gap-1.5 text-[13.5px]">
        {concepts.map((c) => {
          const st = states[c.id] ?? "untouched";
          const viaTeaching = st === "settled" && closed.has(c.id);
          return (
            <li
              key={c.id}
              className={`flex items-center gap-2 rounded-[var(--radius-ui)] px-1.5 py-1 transition-colors duration-300 ${
                c.id === targetId ? "bg-surface-2" : ""
              } ${st === "untouched" ? "text-ink-3" : "text-ink-2"}`}
            >
              <ConceptIcon status={st} />
              <span className="truncate">{c.name}</span>
              {viaTeaching && (
                <span
                  className="meta anim-pop ml-auto shrink-0 text-[11.5px] !text-primary"
                  title={t("closedHint")}
                >
                  {t("closedByTeaching")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {closedCount > 0 && (
        <p className="anim-fade-up rounded-[var(--radius-ui)] border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_7%,transparent)] px-2.5 py-2 text-[12.5px] leading-[1.45] text-primary">
          <b className="font-semibold">{closedCount}</b> {t("closedByTeaching")} — {t("closedHint")}
        </p>
      )}
      <div className="flex gap-5">
        <div>
          <b className="block text-[22px] font-bold tracking-[-0.03em] tabular-nums">{asked}</b>
          <span className="meta text-[13px]">{t("asked")}</span>
        </div>
        <div>
          <b className="block text-[22px] font-bold tracking-[-0.03em] tabular-nums">
            {settled}/{concepts.length}
          </b>
          <span className="meta text-[13px]">{t("settled")}</span>
        </div>
      </div>
      {note && (
        <p className="border-t border-line pt-3 text-[13px] leading-[1.5] text-ink-2">
          <span className="meta">{t("noteLabel")}</span> {note}
        </p>
      )}
    </div>
  );
}
