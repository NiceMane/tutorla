"use client";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { scrollToSection } from "@/lib/scrollTo";

export function Pricing() {
  const t = useTranslations("pricing");
  return (
    <section id="fiyat" className="scroll-mt-20 border-y border-line bg-surface py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-[56ch] text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 text-[clamp(1.9rem,4.2vw,3.4rem)]">{t("title")}</h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-[1.05rem] leading-[1.6] text-ink-2">{t("body")}</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/45 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-3 py-1 text-[13px] font-semibold text-primary">
            {t("badge")}
          </p>
          <div className="mt-7">
            <a
              href="#erken-erisim"
              onClick={(e) => { e.preventDefault(); scrollToSection("#erken-erisim"); }}
              className="btn btn-primary"
            >
              {t("cta")}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
