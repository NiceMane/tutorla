"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { Collapse } from "@/components/ui/Collapse";

const IDS = ["1", "2", "3", "4", "5", "6"] as const;

export function Faq() {
  const t = useTranslations("faq");
  const [open, setOpen] = useState<string | null>("1");

  return (
    <section id="sss" className="container-x scroll-mt-20 py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,3.4rem)]">{t("title")}</h2>
      </Reveal>

      <Reveal className="mt-10 max-w-[70ch]">
        <ul className="card divide-y divide-[var(--border)] overflow-hidden">
          {IDS.map((id) => {
            const isOpen = open === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className="flex-1 text-[1.05rem] font-semibold">{t(`q${id}`)}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" aria-hidden="true"
                    className={`shrink-0 text-ink-3 transition-[transform,rotate,scale,translate] duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <Collapse open={isOpen}>
                  <p className="px-5 pb-4 text-[1rem] leading-[1.6] text-ink-2">{t(`a${id}`)}</p>
                </Collapse>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
