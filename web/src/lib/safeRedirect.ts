/* Giriş sonrası dönülecek adres kullanıcıdan geliyor (?next=…).
   Doğrulanmazsa "açık yönlendirme" olur: saldırgan tutorla.app/giris?next=…
   bağlantısını paylaşır, kullanıcı giriş yapar ve kendini başka bir sitede
   bulur. Kural basit: yalnızca tek eğik çizgiyle başlayan kendi yolumuz. */
export function safeNext(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  /* "//evil.com" protokolsüz adres; "/\evil.com" bazı tarayıcılarda aynı kapıya çıkar */
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.includes("\\") || /[\x00-\x1f]/.test(raw)) return fallback;
  return raw;
}
