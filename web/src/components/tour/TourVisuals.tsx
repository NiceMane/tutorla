"use client";
import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";

/* Tur kartlarının üstündeki küçük canlı sahneler. Her biri özelliğin ne
   yaptığını bir cümle okumadan anlatmaya çalışıyor. Hepsi CSS animasyonu;
   adım değişince kart yeniden bağlandığı için sahne baştan oynuyor. */

export type Scene =
  | "welcome" | "lessons" | "socratic" | "history" | "feed"
  | "messages" | "notifications" | "search" | "profile" | "replay" | "final";

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function Frame({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-[10px] border border-line bg-[color-mix(in_oklab,var(--primary)_6%,var(--surface))] p-3 ${tall ? "h-[150px]" : "h-[118px]"}`}
    >
      {children}
    </div>
  );
}

const Bubble = ({ me, children, delay }: { me?: boolean; children: ReactNode; delay: number }) => (
  <span
    className={`tv-rise block max-w-[82%] rounded-[8px] px-2.5 py-1.5 text-[11.5px] leading-[1.35] ${
      me ? "ml-auto bg-primary text-on-primary" : "border border-line bg-paper text-ink-2"
    }`}
    style={d(delay)}
  >
    {children}
  </span>
);

export function TourVisual({ scene }: { scene: Scene }) {
  const t = useTranslations("app.tour.v");

  switch (scene) {
    case "welcome":
      return (
        <Frame tall>
          <div className="flex flex-col gap-1.5">
            <Bubble delay={0.15}>{t("w1")}</Bubble>
            <Bubble me delay={0.75}>{t("w2")}</Bubble>
            <span className="tv-pop self-start rounded-[6px] border border-dashed border-accent px-2 py-0.5 text-[11px] text-accent" style={d(1.35)}>
              {t("w3")}
            </span>
            <span className="tv-pop flex items-center gap-1.5 self-start text-[11px] font-semibold text-primary" style={d(1.9)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12.5 10 17 19 7" /></svg>
              {t("w4")}
            </span>
          </div>
        </Frame>
      );

    case "lessons":
      return (
        <Frame>
          <div className="tv-rise rounded-[8px] border border-line bg-paper p-2.5" style={d(0.1)}>
            <div className="flex items-center justify-between">
              <b className="text-[13px] font-extrabold">YKS</b>
              <span className="rounded-full bg-primary px-1.5 text-[9.5px] font-semibold text-on-primary">{t("ready")}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
              <i className="tv-grow block h-full w-full bg-glow" style={{ "--to": 0.42, "--d": ".45s" } as CSSProperties} />
            </div>
            <div className="mt-2 flex gap-1">
              {[t("l1"), t("l2"), t("l3")].map((x, n) => (
                <span key={x} className="tv-pop rounded-full border border-line px-1.5 text-[10px] text-ink-2" style={d(0.8 + n * 0.15)}>{x}</span>
              ))}
            </div>
          </div>
        </Frame>
      );

    case "socratic":
      return (
        <Frame>
          <div className="flex flex-col gap-1.5">
            <Bubble delay={0.1}>{t("s1")}</Bubble>
            <Bubble delay={0.7}>{t("s2")}</Bubble>
            <span className="tv-float absolute bottom-2 right-3 grid size-8 place-items-center rounded-full bg-primary text-[15px] font-bold text-on-primary">?</span>
          </div>
        </Frame>
      );

    case "history":
      return (
        <Frame>
          <div className="flex flex-col gap-1.5">
            {[[t("h1"), t("h1t")], [t("h2"), t("h2t")], [t("h3"), t("h3t")]].map(([name, when], n) => (
              <span key={name} className="tv-rise flex items-center justify-between rounded-[6px] border border-line bg-paper px-2 py-1 text-[11px]" style={d(0.1 + n * 0.2)}>
                <b className="font-semibold">{name}</b>
                <span className="text-ink-3">{when}</span>
              </span>
            ))}
          </div>
        </Frame>
      );

    case "feed":
      return (
        <Frame>
          <div className="tv-rise rounded-[8px] border border-line bg-paper p-2.5" style={d(0.1)}>
            <div className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-[30%] bg-surface-2 text-[11px]">🦉</span>
              <b className="text-[11px] font-semibold">{t("f1")}</b>
            </div>
            <p className="mt-1.5 text-[11px] leading-[1.35] text-ink-2">{t("f2")}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-full border border-line px-1.5 text-[10.5px]">👍 3</span>
              <span className="tv-pop rounded-full border border-primary bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-1.5 text-[10.5px] text-primary" style={d(0.9)}>🔥 1</span>
              <span className="tv-rise text-[10.5px] text-ink-3" style={d(1.2)}>2 {t("f3")}</span>
            </div>
          </div>
        </Frame>
      );

    case "messages":
      return (
        <Frame>
          <div className="flex flex-col gap-1.5">
            <Bubble delay={0.1}>{t("m1")}</Bubble>
            <Bubble me delay={0.7}>{t("m2")}</Bubble>
            <span className="tv-rise flex w-fit gap-1 rounded-[8px] border border-line bg-paper px-2.5 py-2" style={d(1.3)}>
              {[0, 1, 2].map((n) => (
                <i key={n} className="block size-1.5 animate-[thinkDot_1.1s_ease-in-out_infinite] rounded-full bg-ink-3" style={{ animationDelay: `${n * 0.16}s` }} />
              ))}
            </span>
          </div>
        </Frame>
      );

    case "notifications":
      return (
        <Frame>
          <div className="flex items-start gap-3">
            <span className="relative mt-1 grid size-9 shrink-0 place-items-center rounded-full border border-line bg-paper">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></svg>
              <span className="tv-pop absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-bold text-white" style={d(0.4)}>2</span>
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="tv-rise rounded-[6px] border border-line bg-paper px-2 py-1 text-[11px]" style={d(0.6)}>{t("n1")}</span>
              <span className="tv-rise rounded-[6px] border border-line bg-paper px-2 py-1 text-[11px]" style={d(0.85)}>{t("n2")}</span>
            </div>
          </div>
        </Frame>
      );

    case "search":
      return (
        <Frame>
          <div className="flex items-center gap-2 rounded-[6px] border border-line-2 bg-paper px-2 py-1.5 text-[12px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-ink-3"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
            <span className="tv-type" style={{ "--w": "5ch", "--n": 5, "--d": ".25s" } as CSSProperties}>turev</span>
            <i className="tv-caret -ml-1.5 block h-3.5 w-px bg-ink" />
            <span className="ml-auto rounded border border-line px-1 text-[9.5px] text-ink-3">⌘K</span>
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {[t("r1"), t("r2")].map((x, n) => (
              <span key={x} className={`tv-rise flex items-center justify-between rounded-[6px] px-2 py-1 text-[11px] ${n === 0 ? "bg-paper font-semibold" : "text-ink-2"}`} style={d(1.2 + n * 0.18)}>
                {x}<span className="text-[9.5px] uppercase text-ink-3">{t("topic")}</span>
              </span>
            ))}
          </div>
        </Frame>
      );

    case "profile":
      return (
        <Frame>
          <div className="flex items-center gap-2.5">
            <span className="tv-pop grid size-10 place-items-center rounded-[30%] border border-line bg-paper text-[20px]" style={d(0.1)}>🦊</span>
            <div className="flex-1">
              <div className="flex justify-between text-[10.5px] text-ink-3"><span>{t("p1")}</span><span>%88</span></div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                <i className="tv-grow block h-full w-full bg-glow" style={{ "--to": 0.88, "--d": ".35s" } as CSSProperties} />
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {[t("p2"), t("p3"), t("p4")].map((x, n) => (
              <span key={x} className="tv-pop rounded-full border border-primary/50 px-1.5 text-[10.5px] text-primary" style={d(0.9 + n * 0.15)}>{x}</span>
            ))}
          </div>
        </Frame>
      );

    case "replay":
      return (
        <Frame>
          <div className="grid h-full place-items-center">
            <span className="tv-float grid size-12 place-items-center rounded-full border-2 border-primary text-[22px] font-bold text-primary">?</span>
          </div>
        </Frame>
      );

    case "final": {
      const colors = ["var(--primary)", "var(--accent)", "#8FC4D6", "#E0A55A", "#4E9BB5"];
      return (
        <Frame tall>
          <div className="grid h-full place-items-center">
            {Array.from({ length: 18 }, (_, n) => {
              const angle = (n / 18) * Math.PI * 2;
              const dist = 60 + (n % 3) * 18;
              return (
                <i
                  key={n}
                  className="tv-confetti"
                  style={{
                    background: colors[n % colors.length],
                    "--x": `${Math.cos(angle) * dist}px`, "--y": `${Math.sin(angle) * dist * 0.7}px`,
                    "--r": `${(n % 2 ? 1 : -1) * (180 + n * 20)}deg`, "--d": `${0.15 + (n % 4) * 0.05}s`,
                  } as CSSProperties}
                />
              );
            })}
            <span className="tv-pop grid size-14 place-items-center rounded-full bg-primary text-on-primary" style={d(0.05)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12.5 10 17 19 7" /></svg>
            </span>
          </div>
        </Frame>
      );
    }
  }
}
