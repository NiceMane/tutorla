import type { SVGProps } from "react";

export type NavKey = "lessons" | "socratic" | "history" | "feed" | "messages" | "notifications" | "profile";

/* Tek çizgi kalınlığı, tek kutu (24), tek dil. Navbar'da etiketle birlikte,
   dar ekranda etiket yerine kullanılıyor. */
const PATHS: Record<NavKey, React.ReactNode> = {
  /* açık kitap — derslerim */
  lessons: <><path d="M12 6.5C10.6 5.2 8.8 4.5 6.5 4.5H3v13h3.5c2.3 0 4.1.7 5.5 2" /><path d="M12 6.5c1.4-1.3 3.2-2 5.5-2H21v13h-3.5c-2.3 0-4.1.7-5.5 2" /><path d="M12 6.5v15" /></>,
  /* soru baloncuğu — sokratik */
  socratic: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L4 21l1.1-3.9A8.4 8.4 0 1 1 21 11.5Z" /><path d="M9.6 9.3a2.4 2.4 0 0 1 4.6.9c0 1.6-2.2 1.9-2.2 3.3" /><path d="M12 16.6h.01" /></>,
  /* saat — geçmiş */
  history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.3l3.3 2" /></>,
  /* kartlar — akış */
  feed: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /></>,
  /* zarf — mesajlar */
  messages: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="m3.5 7.5 7.3 5a2 2 0 0 0 2.4 0l7.3-5" /></>,
  /* zil — bildirimler */
  notifications: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></>,
  /* kişi — profil */
  profile: <><circle cx="12" cy="8.5" r="3.7" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
};

export function NavIcon({ name, ...rest }: { name: NavKey } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
