"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "@/lib/gsap";
import { MARK_T, MARK_TRANSFORM, MARK_U } from "@/lib/logoPaths";

const noop = () => () => {};
function shouldShowSnapshot() {
  try {
    if (sessionStorage.getItem("tutorla-loaded") === "1") return false;
  } catch {}
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Kısa yükleme perdesi: oturumda bir kez, ≤1.3 sn, sayaç 0→100 */
export function Loader() {
  const wanted = useSyncExternalStore(noop, shouldShowSnapshot, () => false);
  const [done, setDone] = useState(false);
  const show = wanted && !done;
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const t = useTranslations("loader");

  useEffect(() => {
    if (!show || !root.current || !num.current) return;
    document.documentElement.style.overflow = "hidden";
    const counter = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        try {
          sessionStorage.setItem("tutorla-loaded", "1");
        } catch {}
        setDone(true);
      },
    });
    tl.to(counter, {
      v: 100,
      duration: 1.05,
      ease: "power2.inOut",
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
      },
    })
      .to(root.current.querySelector(".mark"), { scale: 0.92, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "-=0.05")
      .to(root.current, { yPercent: -100, duration: 0.7, ease: "power4.inOut" }, "-=0.15");
    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[60] flex items-center justify-center bg-paper" aria-live="polite" aria-label={t("label")}>
      <svg className="mark size-[min(28vw,140px)]" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="24" fill="var(--deep)" />
        <g transform={MARK_TRANSFORM} fill="var(--deep-ink)">
          <path d={MARK_T} />
          <path d={MARK_U} />
        </g>
      </svg>
      <div className="absolute bottom-8 left-[clamp(18px,4vw,40px)] flex items-end gap-2 font-sans text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-none tracking-[-0.045em] text-ink">
        <span ref={num} className="tabular-nums">000</span>
        <span className="meta pb-2 text-[1rem]">%</span>
      </div>
    </div>
  );
}
