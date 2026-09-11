"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/hooks";
import { Wordmark } from "@/components/ui/Wordmark";

type Phase = 0 | 1 | 2 | 3 | 4;

const Check = ({ on }: { on: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={on ? "text-primary" : "text-accent"}>
    {on ? <path d="M3 8.5l3.2 3L13 4.5" /> : <path d="M4 4l8 8M12 4l-8 8" />}
  </svg>
);

/* Marka dosyasındaki üç kolonlu seans ekranı — orta kolon kendi kendine yazılır */
export function SessionMock({ active }: { active: boolean }) {
  const t = useTranslations("mock");
  const reduce = useReducedMotion();
  const ai1 = t("ai1"), me1 = t("me1"), ai2 = t("ai2");
  const [st, setSt] = useState<{ phase: Phase; chars: number }>({ phase: 0, chars: 0 });

  useEffect(() => {
    if (!active || reduce) return;
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        await sleep(450);
        if (!alive) return;
        setSt({ phase: 0, chars: 0 });
        const seq: [Phase, string, number][] = [[1, ai1, 20], [2, me1, 13], [3, ai2, 20]];
        for (const [phase, text, ms] of seq) {
          for (let i = 1; i <= text.length; i++) {
            if (!alive) return;
            setSt({ phase, chars: i });
            await sleep(ms);
          }
          await sleep(620);
        }
        if (!alive) return;
        setSt({ phase: 4, chars: Infinity });
        await sleep(5600);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active, reduce, ai1, me1, ai2]);

  const view = reduce ? { phase: 4 as Phase, chars: Infinity } : st;
  const bubble = (n: Phase, text: string) => {
    if (view.phase < n) return null;
    const typing = view.phase === n && view.chars < text.length;
    const shown = view.phase === n ? text.slice(0, view.chars) : text;
    const mine = n === 2;
    return (
      <div className={`max-w-[85%] rounded-[9px] px-3.5 py-2.5 leading-[1.5] ${mine ? "self-end bg-primary text-on-primary" : "border border-line bg-surface-2"}`}>
        {shown}
        {typing && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current" aria-hidden="true" />}
      </div>
    );
  };

  const topics: [string, string, "on" | "off" | ""][] = [
    [t("topics.limit"), "100", ""],
    [t("topics.turev"), "92", ""],
    [t("topics.zincir"), "40", "on"],
    [t("topics.kapali"), "—", "off"],
    [t("topics.integral"), "—", "off"],
  ];

  return (
    <div className="card grid overflow-hidden text-[13px] shadow-[0_24px_60px_-30px_rgba(34,39,26,.35)] md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[212px_minmax(0,1fr)_246px]" role="img" aria-label={t("title")}>
      {/* sol: koyu panel */}
      <aside className="hidden flex-col gap-4 bg-deep p-4 text-deep-ink md:flex">
        <div className="[--logo-ink:var(--deep-ink)] [--logo-mark:var(--deep-primary)]">
          <Wordmark className="h-[18px] w-auto" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="meta text-[13px] !text-deep-mute">{t("exam")}</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="chip chip-on !border-deep-primary !bg-deep-primary !text-deep px-2 py-1 text-[11.5px]">YKS</span>
            <span className="chip !border-deep-line !text-deep-mute px-2 py-1 text-[11.5px]">SAT</span>
            <span className="chip !border-deep-line !text-deep-mute px-2 py-1 text-[11.5px]">TÜBİTAK</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="meta mb-1 text-[13px] !text-deep-mute">{t("subject")}</span>
          {topics.map(([name, pct, s]) => (
            <div key={name} className={`flex justify-between rounded-[var(--radius-ui)] px-2 py-1.5 ${s === "on" ? "bg-deep-2 font-semibold text-white" : "text-deep-mute"}`}>
              <span>{name}</span>
              <span className={`meta text-[13px] ${s === "on" ? "!text-deep-accent" : s === "off" ? "!text-deep-mute opacity-50" : "!text-deep-primary"}`}>{pct}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <span className="meta text-[13px] !text-deep-mute">{t("student")}</span>
          <div className="flex gap-1.5">
            <i className="block size-8 rounded-[30%] border-2 border-deep-primary bg-[repeating-linear-gradient(135deg,var(--deep-2)_0_4px,var(--deep)_4px_8px)]" />
            <i className="block size-8 rounded-[30%] border border-deep-line bg-[repeating-linear-gradient(135deg,var(--deep-2)_0_4px,var(--deep)_4px_8px)]" />
            <i className="block size-8 rounded-[30%] border border-deep-line bg-[repeating-linear-gradient(135deg,var(--deep-2)_0_4px,var(--deep)_4px_8px)]" />
          </div>
          <span className="meta text-[12.5px] !text-deep-mute">{t("persona")}</span>
        </div>
      </aside>

      {/* orta: sohbet */}
      <div className="flex min-h-[380px] min-w-0 flex-col gap-3.5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h3 className="text-[19px]">{t("title")}</h3>
            <span className="meta text-[13.5px]">{t("crumbs")}</span>
          </div>
          <span className="meta flex items-center gap-1.5 text-[13.5px] !text-primary">
            <i className="block size-1.5 rounded-full bg-primary" /> 12:40
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {bubble(1, ai1)}
          {bubble(2, me1)}
          {bubble(3, ai2)}
          {view.phase >= 4 && (
            <div className="meta self-start rounded-[var(--radius-ui)] border border-dashed border-accent px-2.5 py-1 text-[13px] !text-accent">
              {t("gap")}
            </div>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2.5 rounded-[8px] border border-line-2 bg-paper px-3 py-2.5">
          <span className="text-ink-3">{t("placeholder")}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["write", "talk", "board", "photo"] as const).map((k) => (
              <b key={k} className="rounded-[var(--radius-ui)] border border-line px-2 py-0.5 text-[12px] font-semibold text-ink-2">
                {t(`tools.${k}`)}
              </b>
            ))}
            <span className="meta ml-auto text-[12px]">{t("tools.send")}</span>
          </div>
        </div>
      </div>

      {/* sağ: analiz */}
      <aside className="hidden flex-col gap-3.5 border-l border-line bg-paper p-4 lg:flex">
        <div className="flex flex-col gap-2">
          <span className="meta text-[13.5px]">{t("map")}</span>
          <div className="flex items-baseline justify-between">
            <b className="font-semibold">{t("title")}</b>
            <span className="meta text-[13.5px] !text-primary tabular-nums">%40</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-[3px] bg-surface-2">
            <i className="block h-full w-[40%] bg-glow" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-ink-2">
          <div className="flex items-center gap-2"><Check on /> {t("c1")}</div>
          <div className="flex items-center gap-2"><Check on /> {t("c2")}</div>
          <div className="flex items-center gap-2"><Check on={false} /> {t("c3")}</div>
          <div className="flex items-center gap-2 text-ink-3"><span className="text-ink-3"><Check on={false} /></span> {t("c4")}</div>
          <div className="flex items-center gap-2 text-ink-3"><span className="text-ink-3"><Check on={false} /></span> {t("c5")}</div>
        </div>
        <div className="flex gap-5">
          <div><b className="block text-[22px] font-bold tracking-[-0.03em] tabular-nums">4</b><span className="meta text-[13px]">{t("asked")}</span></div>
          <div><b className="block text-[22px] font-bold tracking-[-0.03em] tabular-nums">2/5</b><span className="meta text-[13px]">{t("settled")}</span></div>
        </div>
        <p className={`border-t border-line pt-3 text-[13px] leading-[1.5] text-ink-2 transition-opacity duration-500 ${view.phase >= 4 ? "opacity-100" : "opacity-0"}`}>
          <span className="meta">{t("noteLabel")}</span> {t("note")}
        </p>
      </aside>
    </div>
  );
}
