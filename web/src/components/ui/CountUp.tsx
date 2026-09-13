"use client";
import { useEffect, useState } from "react";

/* Sayılar sıfırdan değerine akar. Küçük bir detay ama panel "canlandı" hissi
   veriyor; hareket kısıtlıysa doğrudan son değeri yazar. */
export function CountUp({ value, duration = 800, className }: { value: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || value === 0) {
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let start = 0;
    const from = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      /* yavaşlayarak bitsin */
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{shown}</span>;
}
