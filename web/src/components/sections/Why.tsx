import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";

export function Why() {
  const t = useTranslations("neden");
  const cards = [1, 2, 3].map((i) => ({ title: t(`c${i}t`), text: t(`c${i}d`) }));
  const rot = ["-rotate-2", "rotate-1", "-rotate-1"];
  const exams = [1, 2, 3].map((i) => ({ name: t(`e${i}`), sub: t(`e${i}d`) }));
  return (
    <section id="neden" className="container-x scroll-mt-20 py-24 md:py-32">
      <Reveal>
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,3.4rem)]">{t("title")}</h2>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.1}>
            <div className={`card ${rot[i]} h-full p-7 transition-transform duration-300 hover:rotate-0`}>
              <h3 className="font-serif text-[1.55rem] font-light italic tracking-normal text-primary">{c.title}</h3>
              <p className="mt-3 text-[1rem] leading-[1.55] text-ink-2">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-20 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
        <div>
          <h3 className="text-[1.6rem] md:text-[2rem]">{t("examsTitle")}</h3>
          <p className="mt-4 max-w-[50ch] text-[1.05rem] leading-[1.55] text-ink-2">{t("examsText")}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {exams.map((e) => (
            <div key={e.name} className="card flex flex-col items-start gap-2 p-5">
              <span className="text-[1.5rem] font-extrabold tracking-[-0.03em] md:text-[2rem]">{e.name}</span>
              <span className="meta text-[14px]">{e.sub}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
