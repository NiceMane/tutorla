"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";

/* Gerçek arayüzün üstünde ilerleyen tanıtım turu.
   Ekran görüntüsü ya da video değil: kullanıcının kendi ekranındaki asıl
   öğeleri işaret ediyor, böylece turu bitirdiğinde nereye basacağını
   gerçekten biliyor.

   Hedefler data-tur="..." ile işaretli. Bir hedef o an ekranda yoksa
   (mobil navbar, dar ekran) adım merkezde kart olarak gösteriliyor. */

type Step = { key: string; target?: string };

const STEPS: Step[] = [
  { key: "hos" },
  { key: "dersler", target: "dersler" },
  { key: "sinav", target: "sinav-karti" },
  { key: "seans" },
  { key: "harita" },
  { key: "sokratik", target: "sokratik" },
  { key: "gecmis", target: "gecmis" },
  { key: "akis", target: "akis" },
  { key: "mesajlar", target: "mesajlar" },
  { key: "ara", target: "ara" },
  { key: "profil", target: "profil" },
  { key: "son" },
];

const PAD = 8;
type Box = { top: number; left: number; width: number; height: number };

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("app.tour");
  const router = useRouter();
  const { refreshProfile } = useApp();
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [mounted, setMounted] = useState(false);

  const step = STEPS[Math.min(i, STEPS.length - 1)];
  const last = i === STEPS.length - 1;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* Hedefin yerini bul ve pencere değişince güncelle. */
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const measure = () => {
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tur="${step.target}"]`) : null;
      if (!el || el.offsetParent === null) {
        setBox(null);
        return;
      }
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const r = el.getBoundingClientRect();
      setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    raf = requestAnimationFrame(measure);
    const again = setTimeout(measure, 260);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(again);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step.target, i]);

  /* Tur açıkken arkadaki sayfa kaymasın */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const finish = useCallback(async (skipped: boolean) => {
    onClose();
    setI(0);
    try {
      await getRepo().updateProfile({ tourDoneAt: new Date().toISOString() });
      await refreshProfile();
    } catch { /* tur bilgisi kritik değil: kaydedilemezse de kapanır */ }
    if (!skipped) router.push("/app/rehber" as "/app");
  }, [onClose, refreshProfile, router]);

  const next = useCallback(() => {
    if (last) void finish(false);
    else setI((x) => x + 1);
  }, [last, finish]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); void finish(true); }
      else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, next, finish]);

  if (!open || !mounted) return null;

  /* Kart konumu: hedefin altında yer varsa altında, yoksa üstünde;
     hedef yoksa ekranın ortasında. */
  const cardStyle: React.CSSProperties = box
    ? (() => {
        const below = box.top + box.height + 14;
        const altta = below + 190 < window.innerHeight;
        const left = Math.min(Math.max(12, box.left + box.width / 2 - 180), window.innerWidth - 372);
        return altta
          ? { top: below, left }
          : { top: Math.max(12, box.top - 14 - 190), left };
      })()
    : { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

  return createPortal(
    <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label={t("title")}>
      {/* Karartma: delik dışında dört parça — SVG maskesine gerek yok */}
      {box ? (
        <>
          <Dim style={{ top: 0, left: 0, right: 0, height: Math.max(0, box.top) }} onClick={() => void finish(true)} />
          <Dim style={{ top: box.top, left: 0, width: Math.max(0, box.left), height: box.height }} onClick={() => void finish(true)} />
          <Dim style={{ top: box.top, left: box.left + box.width, right: 0, height: box.height }} onClick={() => void finish(true)} />
          <Dim style={{ top: box.top + box.height, left: 0, right: 0, bottom: 0 }} onClick={() => void finish(true)} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute rounded-[10px] ring-2 ring-primary transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
        </>
      ) : (
        <Dim style={{ inset: 0 }} onClick={() => void finish(true)} />
      )}

      <div
        style={cardStyle}
        className="anim-pop absolute w-[min(360px,calc(100vw-24px))] rounded-[var(--radius-card)] border border-line bg-paper p-5 shadow-[0_24px_60px_-24px_color-mix(in_oklab,var(--ink)_55%,transparent)]"
      >
        <p className="meta text-[12px]">{t("step", { n: i + 1, total: STEPS.length })}</p>
        <h2 className="mt-1.5 text-[1.15rem] leading-tight">{t(`${step.key}.t`)}</h2>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-2">{t(`${step.key}.b`)}</p>

        <div className="mt-4 flex items-center gap-2">
          <span className="flex flex-1 gap-1" aria-hidden="true">
            {STEPS.map((s, n) => (
              <i
                key={s.key}
                className={`h-1 flex-1 rounded-full transition-colors ${n <= i ? "bg-primary" : "bg-surface-2"}`}
              />
            ))}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {i > 0 && (
            <button type="button" onClick={() => setI((x) => x - 1)} className="btn btn-ghost h-9 text-[13.5px]">
              {t("back")}
            </button>
          )}
          <button type="button" onClick={next} className="btn btn-primary h-9 text-[13.5px]">
            {last ? t("finish") : t("next")}
          </button>
          <button
            type="button"
            onClick={() => void finish(true)}
            className="meta ml-auto text-[13px] hover:text-ink"
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Dim({ style, onClick }: { style: React.CSSProperties; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      className="absolute cursor-default bg-[color-mix(in_oklab,var(--ink)_62%,transparent)] transition-all duration-300 ease-out motion-reduce:transition-none"
      style={style}
    />
  );
}
