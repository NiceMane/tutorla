import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

export function Reverse() {
  const t = useTranslations("ters");
  const col = (title: string, steps: string[], tutorla: boolean) => (
    <div className={`card flex flex-col gap-5 p-6 md:p-8 ${tutorla ? "border-primary/40" : ""}`}>
      <span className={`meta text-[17px] ${tutorla ? "!text-primary" : ""}`}>{title}</span>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-col gap-3">
            <div className={`flex items-center gap-3 text-[1.25rem] font-semibold tracking-[-0.02em] md:text-[1.45rem] ${!tutorla && i === 2 ? "text-ink-3 line-through decoration-accent decoration-2" : ""}`}>
              <span className="meta w-7 text-[15px] tabular-nums">0{i + 1}</span>
              {s}
            </div>
            {i < steps.length - 1 && <span className={`ml-[9px] ${tutorla ? "text-primary" : "text-ink-3"}`}><Arrow /></span>}
          </li>
        ))}
      </ol>
    </div>
  );
  return (
    <section id="ters" className="container-x scroll-mt-20 py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,3.4rem)]">{t("title")}</h2>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <Reveal>{col(t("classicTitle"), [t("classic1"), t("classic2"), t("classic3")], false)}</Reveal>
        <Reveal delay={0.1}>{col(t("tutorlaTitle"), [t("t1"), t("t2"), t("t3")], true)}</Reveal>
      </div>
      <Reveal className="mt-14 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <blockquote className="max-w-[52ch] text-[1.25rem] leading-[1.45] text-ink md:text-[1.5rem]">{t("quote")}</blockquote>
        <p className="meta max-w-[28ch] text-[16px] !text-accent">{t("gapNote")}</p>
      </Reveal>
    </section>
  );
}
