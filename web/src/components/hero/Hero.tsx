"use client";
import dynamic from "next/dynamic";
import { useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion, useWebGL } from "@/lib/hooks";
import { scrollToSection } from "@/lib/scrollTo";
import { Wordmark } from "@/components/ui/Wordmark";
import { SessionMock } from "./SessionMock";

const Logo3D = dynamic(() => import("./Logo3D").then((m) => m.Logo3D), { ssr: false });

/* Sabitlenen hero: 260vh yükseklik, içi yapışkan tam ekran.
   Tek bir --p değişkeni (0→1) hem 3D logoyu hem metin/mockup katmanlarını sürer. */
export function Hero() {
  const t = useTranslations("hero");
  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const activeRef = useRef(false);
  const [mockActive, setMockActive] = useState(false);
  const webgl = useWebGL();
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      if (!section.current || !sticky.current || reduce) return;
      const el = sticky.current;
      /* Sayfa doğal hızıyla kayar; yumuşatma burada.
         scrub:0.6 → --p kaydırmanın arkasından 0,6 sn'de yetişir, böylece
         çentikli fare tekerleğinde bile 3D logo sıçramadan döner. */
      const proxy = { p: 0 };
      const tween = gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
        onUpdate: () => {
          progress.current = proxy.p;
          el.style.setProperty("--p", proxy.p.toFixed(4));
          const on = proxy.p > 0.55;
          if (on !== activeRef.current) {
            activeRef.current = on;
            setMockActive(on);
          }
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: section, dependencies: [reduce] },
  );

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(`#${id}`);
  };

  const Text = (
    <div className="hero-text container-x pointer-events-none relative z-20 flex h-full flex-col justify-between pb-8 pt-[104px] md:pb-10">
      <div>
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h1 className="max-w-[12ch] text-[clamp(2.7rem,6.6vw,6rem)] font-extrabold leading-[0.98] tracking-[-0.045em]">{t("title")}</h1>
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <ul className="meta space-y-1 text-[17px]">
          <li>· {t("bullet1")}</li>
          <li>· {t("bullet2")}</li>
        </ul>
        <div className="pointer-events-auto max-w-[40ch]">
          <p className="text-[1.1rem] leading-[1.45] text-ink-2 md:text-[1.2rem]">{t("lead")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#erken-erisim" onClick={go("erken-erisim")} className="btn btn-primary">{t("cta")}</a>
            <a href="#nasil" onClick={go("nasil")} className="btn btn-ghost">{t("secondary")}</a>
          </div>
        </div>
      </div>
    </div>
  );

  /* Hareket kapalıysa: sabitleme yok, statik logo, mockup hemen altında */
  if (reduce) {
    return (
      <section id="top" className="relative">
        <div className="relative h-dvh min-h-[640px]">
          <div className="absolute inset-0 grid place-items-center"><Wordmark className="w-[min(70vw,640px)]" title={t("fallbackAlt")} /></div>
          {Text}
        </div>
        <div className="container-x pb-16"><SessionMock active /></div>
      </section>
    );
  }

  return (
    <section ref={section} id="top" className="relative h-[260vh]">
      <div ref={sticky} className="sticky top-0 h-dvh overflow-hidden" style={{ "--p": 0 } as CSSProperties}>
        <div className="hero-logo absolute inset-0 z-10">
          {webgl === true ? (
            <Logo3D progress={progress} />
          ) : webgl === false ? (
            <div className="absolute inset-0 grid place-items-center"><Wordmark className="w-[min(70vw,640px)]" title={t("fallbackAlt")} /></div>
          ) : null}
        </div>
        {Text}
        <div className="hero-mock pointer-events-none absolute inset-x-0 top-[13vh] z-30 mx-auto w-[min(1120px,94vw)]">
          <SessionMock active={mockActive} />
        </div>
        <div className="hero-hint meta pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 text-[14px] md:flex">
          <span className="block h-8 w-px animate-pulse bg-ink-3" />
          {t("scroll")}
        </div>
      </div>
    </section>
  );
}
