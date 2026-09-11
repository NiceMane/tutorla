/* Bölüm bağlantıları: tarayıcının kendi yumuşak kaydırması.
   Lenis kaldırıldı — sayfa doğal hızıyla kayar, yumuşatma sadece animasyonda. */
export const NAV_OFFSET = 72;

export function scrollToSection(hash: string) {
  const el = document.querySelector<HTMLElement>(hash);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  history.replaceState(null, "", hash);
}
