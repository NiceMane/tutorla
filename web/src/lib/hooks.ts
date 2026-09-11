"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/* Sunucuda false, istemcide mount sonrası true — hydration güvenli */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

let webglCache: boolean | null = null;
function detectWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
function webglSnapshot(): boolean {
  if (webglCache === null) webglCache = detectWebGL();
  return webglCache;
}
const nullSnapshot = () => null;
/* null = henüz bilinmiyor (sunucu), true/false = istemci sonucu */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(noop, webglSnapshot, nullSnapshot);
}

export function useScrolled(threshold = 24) {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("scroll", cb, { passive: true });
      return () => window.removeEventListener("scroll", cb);
    },
    () => window.scrollY > threshold,
    () => false,
  );
}

/* data-theme değişince CSS değişkenlerini yeniden okur; anahtar string olarak döner */
export function useThemeVars(names: string[], serverValue: string) {
  return useSyncExternalStore(
    (cb) => {
      const mo = new MutationObserver(cb);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => mo.disconnect();
    },
    () => names.map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()).join("|"),
    () => serverValue,
  );
}
