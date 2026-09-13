"use client";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/* Ortak iskelet / boş durum / hata bileşenleri.
   Önceden her ekran kendi pulse div'ini yazıyordu, hata gösterimi ise
   çoğu yerde hiç yoktu. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-card)] bg-surface-2/60 motion-reduce:animate-none ${className}`} />;
}

export function SkeletonList({ count = 3, height = "h-32" }: { count?: number; height?: string }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className={height} />)}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {body && <p className="meta max-w-[42ch] text-[14px]">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
      <p className="font-semibold">{t("errorTitle")}</p>
      <p className="meta max-w-[46ch] text-[14px]">{message || t("errorBody")}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn btn-ghost">{t("retry")}</button>}
    </div>
  );
}
