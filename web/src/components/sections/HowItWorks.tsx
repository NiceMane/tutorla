import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";

function ContextVisual({ t }: { t: ReturnType<typeof useTranslations<"nasil">> }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="meta text-[13.5px]">{t("examLabel")}</span>
      <div className="flex flex-wrap gap-1.5"><span className="chip chip-on">YKS</span><span className="chip">SAT</span><span className="chip">TÜBİTAK</span></div>
      <span className="meta mt-1 text-[13.5px]">{t("subjectLabel")}</span>
      <div className="text-[15px] font-semibold">{t("subjects")}</div>
      <span className="meta mt-1 text-[13.5px]">{t("topicLabel")}</span>
      <div className="rounded-[var(--radius-ui)] bg-deep-2 px-3 py-2 text-[15px] font-semibold text-white">{t("topic")}</div>
    </div>
  );
}
function PersonaVisual() {
  return (
    <div className="flex items-end gap-3">
      {["border-2 border-primary", "border border-line-2", "border border-line-2"].map((b, i) => (
        <i key={i} className={`hatch block size-16 rounded-[30%] ${b}`} />
      ))}
    </div>
  );
}
function InputVisual({ t }: { t: ReturnType<typeof useTranslations<"mock">> }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[8px] border border-line-2 bg-paper px-3 py-2.5 text-[13px]">
      <span className="text-ink-3">{t("placeholder")}</span>
      <div className="flex flex-wrap gap-1.5">
        {(["write", "talk", "board", "photo"] as const).map((k) => (
          <b key={k} className="rounded-[var(--radius-ui)] border border-line px-2 py-0.5 text-[12px] font-semibold text-ink-2">{t(`tools.${k}`)}</b>
        ))}
      </div>
    </div>
  );
}
function MapVisual({ t }: { t: ReturnType<typeof useTranslations<"mock">> }) {
  const rows: [string, boolean | null][] = [[t("c1"), true], [t("c2"), true], [t("c3"), false], [t("c4"), null], [t("c5"), null]];
  return (
    <div className="flex flex-col gap-2 text-[14px]">
      <div className="flex items-baseline justify-between"><b className="font-semibold">{t("title")}</b><span className="meta !text-primary">%40</span></div>
      <div className="h-[5px] overflow-hidden rounded-[3px] bg-surface-2"><i className="block h-full w-[40%] bg-glow" /></div>
      <ul className="mt-1 flex flex-col gap-1">
        {rows.map(([s, v]) => (
          <li key={s} className={`flex items-center gap-2 ${v === null ? "text-ink-3" : "text-ink-2"}`}>
            <span className={`w-3 font-bold ${v ? "text-primary" : v === false ? "text-accent" : "text-ink-3"}`}>{v ? "✓" : "✕"}</span>{s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Yapışkan üst üste binen kartlar — Palmo'daki ürün kartları gibi */
export function HowItWorks() {
  const t = useTranslations("nasil");
  const tm = useTranslations("mock");
  const steps = [
    { n: "01", title: t("s1t"), text: t("s1d"), visual: <ContextVisual t={t} /> },
    { n: "02", title: t("s2t"), text: t("s2d"), visual: <PersonaVisual /> },
    { n: "03", title: t("s3t"), text: t("s3d"), visual: <InputVisual t={tm} /> },
    { n: "04", title: t("s4t"), text: t("s4d"), visual: <MapVisual t={tm} /> },
  ];
  return (
    <section id="nasil" className="container-x scroll-mt-20 py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,3.4rem)]">{t("title")}</h2>
      </Reveal>
      <ol className="mt-12 flex flex-col gap-5">
        {steps.map((s, i) => (
          <li key={s.n} className="sticky" style={{ top: `${96 + i * 14}px` }}>
            <div className="card grid gap-8 p-6 shadow-[0_18px_50px_-30px_rgba(34,39,26,.4)] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:p-9">
              <div>
                <span className="font-serif text-[2.4rem] font-light italic leading-none text-primary">{s.n}</span>
                <h3 className="mt-3 text-[1.5rem] md:text-[1.8rem]">{s.title}</h3>
                <p className="mt-3 max-w-[42ch] text-[1.02rem] leading-[1.55] text-ink-2">{s.text}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-line bg-paper p-5 md:self-center">{s.visual}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
