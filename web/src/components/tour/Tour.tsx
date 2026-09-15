"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";
import { NavIcon, type NavKey } from "@/components/app/NavIcon";
import { TourVisual, type Scene } from "./TourVisuals";

/* İlk girişte açılan animasyonlu tanıtım.
   1) Karşılama popup'ı — ürünün fikri tek sahnede.
   2) Özellik adımları — spot ışığı gerçek arayüzdeki öğenin üstüne kayıyor,
      yanında küçük canlı sahnesiyle bir kart beliriyor.
   3) Kapanış popup'ı — ilk konuya yönlendiriyor.
   Bir kez gösteriliyor (profiles.tour_done_at); navbar'daki ? ile tekrar izlenir. */

type Step = { key: string; target: string; scene: Scene; icon: NavKey | "search" | "help" };

const STEPS: Step[] = [
  { key: "dersler", target: "dersler", scene: "lessons", icon: "lessons" },
  { key: "sinav", target: "sinav-karti", scene: "welcome", icon: "lessons" },
  { key: "sokratik", target: "sokratik", scene: "socratic", icon: "socratic" },
  { key: "gecmis", target: "gecmis", scene: "history", icon: "history" },
  { key: "akis", target: "akis", scene: "feed", icon: "feed" },
  { key: "mesajlar", target: "mesajlar", scene: "messages", icon: "messages" },
  { key: "bildirimler", target: "bildirimler", scene: "notifications", icon: "notifications" },
  { key: "ara", target: "ara", scene: "search", icon: "search" },
  { key: "profil", target: "profil", scene: "profile", icon: "profile" },
  { key: "tekrar", target: "rehber", scene: "replay", icon: "help" },
];

type Phase = "welcome" | "steps" | "final";
type Box = { top: number; left: number; width: number; height: number };

const PAD = 7;
const CARD_W = 340;

const TourCtx = createContext<{ start: () => void }>({ start: () => {} });
export const useTour = () => useContext(TourCtx);

/* ------------------------------------------------------------ sağlayıcı */
export function TourProvider({ children }: { children: ReactNode }) {
  const { ready, profile } = useApp();
  const pathname = usePathname();
  const [manual, setManual] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* Otomatik açılma render sırasında türetiliyor: tanışmayı bitirmiş, turu
     görmemiş, odaklı bir ekranda (seans, tanışma) olmayan kullanıcı. */
  const auto =
    ready && Boolean(profile?.onboardedAt) && !profile?.tourDoneAt &&
    !pathname.startsWith("/app/seans") && !pathname.startsWith("/app/baslangic");

  const open = manual || (auto && !dismissed);
  const value = useMemo(() => ({ start: () => setManual(true) }), []);

  return (
    <TourCtx.Provider value={value}>
      {children}
      {open && <Tour onClose={() => { setManual(false); setDismissed(true); }} />}
    </TourCtx.Provider>
  );
}

/* Hedef öğe birkaç yüz milisaniye içinde gelebilir (sınav kartları veriyle
   yükleniyor); kısa bir süre bekle, görünür olanı döndür. */
function waitFor(selector: string, timeout = 3000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const el = all.find((x) => x.offsetParent !== null && x.getBoundingClientRect().width > 0);
      if (el) return resolve(el);
      if (performance.now() - started > timeout) return resolve(null);
      setTimeout(tick, 80);
    };
    tick();
  });
}

/* ------------------------------------------------------------------ tur */
function Tour({ onClose }: { onClose: () => void }) {
  const t = useTranslations("app.tour");
  const router = useRouter();
  const pathname = usePathname();
  const { profile, refreshProfile } = useApp();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [viaMenu, setViaMenu] = useState(false);
  const [vw, setVw] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  const [vh, setVh] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  const target = useRef<HTMLElement | null>(null);

  const step = STEPS[i];
  const mobile = vw < 768;

  /* Arkadaki sayfa kaymasın */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const measure = useCallback(() => {
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    const el = target.current;
    if (!el) { setBox(null); return; }
    const r = el.getBoundingClientRect();
    setBox({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, []);

  /* Adım değişince hedefi bul; masaüstünde yoksa mobil menü düğmesine düş. */
  useEffect(() => {
    if (phase !== "steps") return;
    let alive = true;
    (async () => {
      let el = await waitFor(`[data-tur="${step.target}"]`, step.target === "sinav-karti" ? 3500 : 900);
      let menu = false;
      if (!el && step.target !== "sinav-karti") {
        el = await waitFor('[data-tur="menu"]', 400);
        menu = Boolean(el);
      }
      if (!alive) return;
      target.current = el;
      setViaMenu(menu);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      measure();
      setTimeout(() => alive && measure(), 380);
    })();
    return () => { alive = false; };
  }, [phase, i, step.target, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const persist = useCallback(async () => {
    try {
      await getRepo().updateProfile({ tourDoneAt: new Date().toISOString() });
      await refreshProfile();
    } catch { /* kaydedilemese de tur kapanır */ }
  }, [refreshProfile]);

  const close = useCallback(() => { void persist(); onClose(); }, [persist, onClose]);

  const begin = useCallback(() => {
    /* Adımların çoğu sınav listesindeki öğeleri işaret ediyor. */
    if (pathname !== "/app") router.push("/app");
    setI(0);
    setPhase("steps");
  }, [pathname, router]);

  const next = useCallback(() => {
    if (phase === "welcome") return begin();
    if (phase === "final") return close();
    if (i === STEPS.length - 1) { setBox(null); setPhase("final"); }
    else setI((x) => x + 1);
  }, [phase, i, begin, close]);

  const back = useCallback(() => {
    if (phase === "steps" && i > 0) setI((x) => x - 1);
    else if (phase === "steps") setPhase("welcome");
    else if (phase === "final") setPhase("steps");
  }, [phase, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [next, back, close]);

  const name = profile?.displayName?.split(" ")[0] ?? "";

  /* ---- karşılama ve kapanış: ortada popup ---- */
  if (phase !== "steps") {
    const welcome = phase === "welcome";
    return createPortal(
      <div className="fixed inset-0 z-[150] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={t("title")}>
        <div className="tour-backdrop absolute inset-0 bg-[color-mix(in_oklab,#0f120c_62%,transparent)]" />
        <div key={phase} className="tour-modal relative w-full max-w-[440px] rounded-[16px] border border-line bg-paper p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)]">
          {welcome && (
            <div className="mb-4 flex flex-wrap gap-1.5" aria-hidden="true">
              {(["lessons", "socratic", "feed", "messages", "profile"] as NavKey[]).map((k, n) => (
                <span key={k} className="tv-pop grid size-9 place-items-center rounded-[30%] border border-line bg-surface text-primary" style={{ "--d": `${0.1 + n * 0.08}s` } as React.CSSProperties}>
                  <NavIcon name={k} />
                </span>
              ))}
            </div>
          )}
          <p className="eyebrow">{welcome ? t("welcome.eyebrow") : t("final.eyebrow")}</p>
          <h2 className="mt-2 text-[1.55rem] leading-tight">
            {welcome ? t("welcome.title", { name: name || t("friend") }) : t("final.title")}
          </h2>
          <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-2">{welcome ? t("welcome.body") : t("final.body")}</p>
          <div className="mt-4">
            <TourVisual scene={welcome ? "welcome" : "final"} />
          </div>
          {welcome && <p className="meta mt-3 text-[12.5px]">{t("welcome.duration")}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {welcome ? (
              <>
                <button type="button" onClick={begin} className="btn btn-primary">{t("welcome.start")}</button>
                <button type="button" onClick={close} className="btn btn-ghost">{t("welcome.later")}</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { close(); router.push("/app/sinav/YKS" as "/app"); }}
                  className="btn btn-primary"
                >
                  {t("final.cta")}
                </button>
                <button type="button" onClick={() => { close(); router.push("/app/rehber" as "/app"); }} className="btn btn-ghost">
                  {t("final.guide")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  /* ---- özellik adımları: spot ışığı + kart ---- */
  const CARD_H = 330;
  let card: React.CSSProperties;
  let arrow: { side: "top" | "bottom"; x: number } | null = null;

  if (mobile || !box) {
    /* Telefonda kart alttan gelen yaprak; hedef yoksa ortada. */
    card = mobile
      ? { left: 12, right: 12, bottom: 12 }
      : { left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: CARD_W };
  } else {
    const below = box.top + box.height + 14;
    const fitsBelow = below + CARD_H < vh;
    const left = Math.min(Math.max(12, box.left + box.width / 2 - CARD_W / 2), vw - CARD_W - 12);
    card = fitsBelow ? { top: below, left, width: CARD_W } : { top: Math.max(12, box.top - 14 - CARD_H), left, width: CARD_W };
    arrow = { side: fitsBelow ? "top" : "bottom", x: Math.min(Math.max(20, box.left + box.width / 2 - left), CARD_W - 20) };
  }

  return createPortal(
    <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label={t("title")}>
      {/* tıklamaları yakala ama kapatma: yanlışlıkla turu kaçırmasın */}
      <div className="absolute inset-0" />
      {box ? (
        <div className="tour-spot" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} />
      ) : (
        <div className="tour-backdrop absolute inset-0 bg-[color-mix(in_oklab,#0f120c_62%,transparent)]" />
      )}

      <div
        key={i}
        className="tour-card absolute rounded-[14px] border border-line bg-paper p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,.6)]"
        style={{ ...card, "--tour-dy": arrow?.side === "bottom" ? "-10px" : "10px" } as React.CSSProperties}
      >
        {arrow && (
          <span
            aria-hidden="true"
            className="absolute size-3 rotate-45 border-line bg-paper"
            style={{
              left: arrow.x - 6,
              ...(arrow.side === "top"
                ? { top: -6.5, borderLeftWidth: 1, borderTopWidth: 1 }
                : { bottom: -6.5, borderRightWidth: 1, borderBottomWidth: 1 }),
            }}
          />
        )}

        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-primary">
            {step.icon === "search" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
            ) : step.icon === "help" ? (
              <b className="text-[15px]">?</b>
            ) : (
              <NavIcon name={step.icon} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="meta text-[11.5px]">{t("step", { n: i + 1, total: STEPS.length })}</p>
            <h2 className="text-[1.05rem] leading-tight">{t(`${step.key}.t`)}</h2>
          </div>
        </div>

        <div className="mt-3"><TourVisual scene={step.scene} /></div>

        <p className="mt-3 text-[13.5px] leading-[1.5] text-ink-2">{t(`${step.key}.b`)}</p>
        {viaMenu && <p className="meta mt-1.5 text-[12px]">{t("viaMenu")}</p>}

        <div className="mt-3.5 flex gap-1" aria-hidden="true">
          {STEPS.map((s, n) => (
            <i key={s.key} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= i ? "bg-primary" : "bg-surface-2"}`} />
          ))}
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <button type="button" onClick={back} className="btn btn-ghost h-9 text-[13.5px]">{t("back")}</button>
          <button type="button" onClick={next} className="btn btn-primary h-9 text-[13.5px]">
            {i === STEPS.length - 1 ? t("done") : t("next")}
          </button>
          <button type="button" onClick={close} className="meta ml-auto text-[12.5px] hover:text-ink">{t("skip")}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
