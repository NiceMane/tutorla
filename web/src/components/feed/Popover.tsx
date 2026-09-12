"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Dışına tıklayınca ve Esc ile kapanan küçük açılır kutu. */
export function Popover({ button, children }: { button: (p: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {button({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2 animate-[popIn_.16s_ease-out]">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
