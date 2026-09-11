"use client";
import type { ReactNode } from "react";

/* Yüksekliği bilinmeyen içeriği yumuşakça açıp kapatır.
   grid-template-rows 0fr→1fr, max-height tahminine göre daha doğru:
   içerik ne kadar uzun olursa olsun animasyon kesilmiyor.
   Kapalıyken içerik DOM'da kalır ama inert — klavye ve ekran okuyucu görmez. */
export function Collapse({
  open,
  children,
  className = "",
  duration = 280,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      } ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      <div className="min-h-0 overflow-hidden" inert={!open}>
        {children}
      </div>
    </div>
  );
}
