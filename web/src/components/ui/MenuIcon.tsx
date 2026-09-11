"use client";

/* Üç çizgi ↔ çarpı. Çizgiler yerinde dönerek birleşiyor, ikon takas edilmiyor. */
export function MenuIcon({ open }: { open: boolean }) {
  const bar = "absolute left-0 block h-[1.8px] w-[18px] rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none";
  return (
    <span className="relative block size-[18px]" aria-hidden="true">
      <span className={`${bar} top-[4px] ${open ? "translate-y-[5px] rotate-45" : ""}`} />
      <span
        className={`${bar} top-[9px] transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span className={`${bar} top-[14px] ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
    </span>
  );
}
