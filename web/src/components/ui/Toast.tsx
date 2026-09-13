"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Tone = "ok" | "err";
type Item = { id: number; text: string; tone: Tone };

const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => {});

/* Kısa onaylar için tek yer. Önceden "kaydedildi" yazısı formun dibinde
   beliriyordu ve silme işlemlerinde hiçbir geri bildirim yoktu. */
export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);

  const show = useCallback((text: string, tone: Tone = "ok") => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, text, tone }]);
    setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 2800);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setItems((list) => list.filter((y) => y.id !== x.id))}
            className={`anim-toast pointer-events-auto max-w-[92vw] rounded-[var(--radius-ui)] border px-4 py-2.5 text-[13.5px] shadow-[0_12px_32px_-16px_color-mix(in_oklab,var(--ink)_60%,transparent)] ${
              x.tone === "err"
                ? "border-accent bg-[color-mix(in_oklab,var(--accent)_12%,var(--paper))] text-accent"
                : "border-line-2 bg-paper text-ink"
            }`}
          >
            {x.text}
          </button>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
