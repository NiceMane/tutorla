import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "./TiltCard";

export function Personas() {
  const t = useTranslations("personalar");
  const items = [1, 2, 3].map((i) => ({ name: t(`p${i}n`), trait: t(`p${i}t`), quote: t(`p${i}q`) }));
  return (
    <section id="personalar" className="scroll-mt-20 border-y border-line bg-surface py-24 md:py-32">
      <div className="container-x">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-4">{t("eyebrow")}</p>
            <h2 className="max-w-[20ch] text-[clamp(1.9rem,4.2vw,3.4rem)]">{t("title")}</h2>
          </div>
          <p className="meta text-[15px]">{t("note")}</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <TiltCard className="card flex h-full flex-col gap-5 bg-paper p-6">
                <div className={`hatch grid size-20 place-items-center rounded-[30%] border ${i === 0 ? "border-2 border-primary" : "border-line-2"}`}>
                  <span className="meta text-[12px]">{t("placeholder")}</span>
                </div>
                <div>
                  <h3 className="font-serif text-[1.7rem] font-light italic tracking-normal">{p.name}</h3>
                  <p className="mt-2 text-[15px] leading-[1.5] text-ink-2">{p.trait}</p>
                </div>
                <div className="mt-auto rounded-[9px] border border-line bg-surface-2 px-3.5 py-3 text-[14.5px] leading-[1.5]">{p.quote}</div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
