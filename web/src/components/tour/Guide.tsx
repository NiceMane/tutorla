"use client";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ConceptIcon } from "@/components/app/ConceptIcon";
import { MomentChip } from "@/components/app/MomentChip";
import { useTour } from "./Tour";

/* Turun kalıcı hâli: tur arayüzü gezdiriyor, burası aynı şeyleri uzun uzun
   anlatıyor. Örnek sohbet gerçek seans bileşenlerinin stiliyle çiziliyor —
   kullanıcı burada gördüğünü seansta birebir tanısın. */
const SECTIONS = ["ters", "seans", "harita", "kanit", "sokratik", "mufredat", "akis", "mesaj", "arama", "profil", "ai"] as const;

/* Render içinde bileşen tanımlamak her çizimde yeni bir tip yaratır; dışarıda. */
function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">{children}</p>;
}

export function Guide() {
  const t = useTranslations("app.guide");
  const { start } = useTour();

  return (
    <main className="mx-auto w-full max-w-[820px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.8rem,3.6vw,2.6rem)]">{t("title")}</h1>
      <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.6] text-ink-2">{t("intro")}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={start} className="btn btn-primary">{t("start")}</button>
        <Link href="/app" className="btn btn-ghost">{t("back")}</Link>
      </div>

      {/* içindekiler */}
      <nav className="card mt-8 p-5" aria-label={t("toc")}>
        <p className="meta text-[12.5px] uppercase tracking-wide">{t("toc")}</p>
        <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {SECTIONS.map((k) => (
            <li key={k}>
              <a href={`#${k}`} className="text-[14.5px] text-ink-2 underline decoration-dotted underline-offset-4 hover:text-primary">
                {t(`s.${k}.t`)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="mt-10 flex flex-col gap-10">
        {/* 1 */}
        <section id="ters" className="scroll-mt-24">
          <h2 className="text-[1.3rem]">{t("s.ters.t")}</h2>
          <P>{t("s.ters.p1")}</P>
          <P>{t("s.ters.p2")}</P>
          <P>{t("s.ters.p3")}</P>
        </section>

        {/* 2 — örnek sohbet */}
        <section id="seans" className="scroll-mt-24">
          <h2 className="text-[1.3rem]">{t("s.seans.t")}</h2>
          <P>{t("s.seans.p1")}</P>
          <div className="card mt-4 flex flex-col gap-2.5 p-4 text-[14px]">
            <span className="max-w-[85%] self-start rounded-[9px] border border-line bg-surface-2 px-3.5 py-2.5 leading-[1.5]">{t("s.seans.d1")}</span>
            <span className="max-w-[85%] self-end rounded-[9px] bg-primary px-3.5 py-2.5 leading-[1.5] text-on-primary">{t("s.seans.d2")}</span>
            <MomentChip kind="causal" label={t("s.seans.dm")} />
            <span className="max-w-[85%] self-start rounded-[9px] border border-line bg-surface-2 px-3.5 py-2.5 leading-[1.5]">{t("s.seans.d3")}</span>
            <span className="meta self-start rounded-[var(--radius-ui)] border border-dashed border-accent px-2.5 py-1 text-[13px] !text-accent">
              {t("s.seans.dg")}
            </span>
          </div>
          <P>{t("s.seans.p2")}</P>
          <P>{t("s.seans.p3")}</P>
        </section>

        {/* 3 */}
        <section id="harita" className="scroll-mt-24">
          <h2 className="text-[1.3rem]">{t("s.harita.t")}</h2>
          <P>{t("s.harita.p1")}</P>
          <ul className="card mt-4 flex flex-col gap-2.5 p-4 text-[14.5px]">
            {(["untouched", "gap", "settled"] as const).map((st, n) => (
              <li key={st} className="flex items-center gap-2.5">
                <ConceptIcon status={st} />
                <span className={st === "untouched" ? "text-ink-3" : "text-ink-2"}>{t(`s.harita.l${n + 1}`)}</span>
              </li>
            ))}
          </ul>
          <P>{t("s.harita.p2")}</P>
          <P>{t("s.harita.p3")}</P>
        </section>

        {/* 4 */}
        <section id="kanit" className="scroll-mt-24">
          <h2 className="text-[1.3rem]">{t("s.kanit.t")}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="card p-5"><P>{t("s.kanit.p1")}</P></div>
            <div className="card p-5"><P>{t("s.kanit.p2")}</P></div>
          </div>
          <P>{t("s.kanit.p3")}</P>
        </section>

        {/* 5–8 */}
        {(["sokratik", "mufredat", "akis", "mesaj"] as const).map((k) => (
          <section key={k} id={k} className="scroll-mt-24">
            <h2 className="text-[1.3rem]">{t(`s.${k}.t`)}</h2>
            <P>{t(`s.${k}.p1`)}</P>
            {k !== "sokratik" && k !== "mesaj" && <P>{t(`s.${k}.p2`)}</P>}
          </section>
        ))}

        {/* arama — kısayol listesiyle */}
        <section id="arama" className="scroll-mt-24">
          <h2 className="text-[1.3rem]">{t("s.arama.t")}</h2>
          <P>{t("s.arama.p1")}</P>
          <ul className="card mt-4 flex flex-col gap-2 p-4">
            {([1, 2, 3, 4, 5] as const).map((n) => {
              const [key, ...rest] = t(`s.arama.k${n}`).split("—");
              return (
                <li key={n} className="flex flex-wrap items-baseline gap-2 text-[14.5px]">
                  <kbd className="rounded-[var(--radius-ui)] border border-line-2 bg-surface px-2 py-0.5 font-mono text-[12.5px]">{key.trim()}</kbd>
                  <span className="text-ink-2">{rest.join("—").trim()}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 10–11 */}
        {(["profil", "ai"] as const).map((k) => (
          <section key={k} id={k} className="scroll-mt-24">
            <h2 className="text-[1.3rem]">{t(`s.${k}.t`)}</h2>
            <P>{t(`s.${k}.p1`)}</P>
            <P>{t(`s.${k}.p2`)}</P>
          </section>
        ))}

        {/* ipuçları */}
        <section className="card border-primary/35 bg-[color-mix(in_oklab,var(--primary)_5%,transparent)] p-5">
          <h2 className="text-[1.1rem]">{t("tips.t")}</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {(["a", "b", "c"] as const).map((k) => (
              <li key={k} className="flex gap-2.5 text-[14.5px] leading-[1.55] text-ink-2">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {t(`tips.${k}`)}
              </li>
            ))}
          </ul>
        </section>
      </article>

      <div className="mt-10 flex flex-wrap gap-2">
        <button type="button" onClick={start} className="btn btn-primary">{t("start")}</button>
        <Link href="/app" className="btn btn-ghost">{t("back")}</Link>
      </div>

    </main>
  );
}
