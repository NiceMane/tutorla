"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* Odak tuzaklı, animasyonlu diyalog.
   Kapanırken de animasyon olsun diye bileşen hemen sökülmüyor: önce "closing"
   durumuna geçiyor, geçiş bitince DOM'dan çıkıyor. */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open, onClose, title, children, footer, wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  /* Açılış: önce DOM'a gir, sonraki karede görünür ol (geçiş tetiklensin).
     Durum değişiklikleri bilerek kareye erteleniyor — etkinin gövdesinde
     senkron setState zincirleme render demek. */
  useEffect(() => {
    if (open) {
      let second = 0;
      const first = requestAnimationFrame(() => {
        setMounted(true);
        second = requestAnimationFrame(() => setShown(true));
      });
      return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
    }
    const frame = requestAnimationFrame(() => setShown(false));
    const timer = setTimeout(() => setMounted(false), 240);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [open]);

  /* Sayfanın arkası kaymasın + açan öğeye odağı geri ver. */
  useEffect(() => {
    if (!mounted) return;
    restore.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      restore.current?.focus?.();
    };
  }, [mounted]);

  /* İlk odak panelin içine. */
  useEffect(() => {
    if (!shown) return;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();
  }, [shown]);

  /* Esc belgede dinleniyor: odak panelin dışına kaçmışsa (örneğin bir öğe
     kaldırıldıysa) React'in onKeyDown'ı hiç tetiklenmiyordu. */
  useEffect(() => {
    if (!mounted) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", onEsc, true);
    return () => document.removeEventListener("keydown", onEsc, true);
  }, [mounted, onClose]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  if (!mounted) return null;

  /* Gövdeye taşınıyor: animasyonlu bir ata öğe (transform: matrix(1,0,0,1,0,0))
     position:fixed için içeren blok oluşturuyor ve diyalog ekranın ortasına
     değil formun ortasına oturuyordu. */
  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-end justify-center p-0 transition-opacity duration-200 sm:items-center sm:p-6 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="kapat"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[color-mix(in_oklab,var(--ink)_55%,transparent)] backdrop-blur-[2px]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-card)] border border-line bg-paper shadow-[0_24px_60px_-24px_color-mix(in_oklab,var(--ink)_45%,transparent)] outline-none transition-[transform,opacity,rotate,scale,translate] duration-200 ease-out motion-reduce:transition-none sm:rounded-[var(--radius-card)] ${
          wide ? "sm:max-w-[720px]" : "sm:max-w-[460px]"
        } ${shown ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-[.97]"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-[1.05rem]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="kapat"
            className="grid size-8 place-items-center rounded-[var(--radius-ui)] text-ink-2 transition-colors hover:bg-surface hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
