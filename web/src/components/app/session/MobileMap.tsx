"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Collapse } from "@/components/ui/Collapse";

/* Anlayış haritası mobilde sağ panele sığmıyor — açılır panel olarak burada.
   Ürünün çekirdek geri bildirimi; telefonda görünmemesi olmaz. */
export function MobileMap({ percent, children }: { percent: number; children: ReactNode }) {
  const t = useTranslations("app.session");
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-b border-line lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-[clamp(12px,2.5vw,20px)] py-2.5 text-left"
      >
        <span className="meta text-[13px]">{t("map")}</span>
        <span className="min-w-0 flex-1">
          <span className="block h-[5px] overflow-hidden rounded-[3px] bg-surface-2">
            <i className="bar-fill block h-full w-full bg-glow" style={{ "--pct": percent / 100 } as React.CSSProperties} />
          </span>
        </span>
        <span className="meta shrink-0 text-[13px] !text-primary tabular-nums">%{percent}</span>
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <Collapse open={open}>
        <div className="border-t border-line px-[clamp(12px,2.5vw,20px)] py-3">{children}</div>
      </Collapse>
    </div>
  );
}
