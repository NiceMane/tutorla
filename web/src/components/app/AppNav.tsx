"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { Collapse } from "@/components/ui/Collapse";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { useAuth } from "@/lib/auth";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { Avatar } from "./Avatar";
import { NavIcon, type NavKey } from "./NavIcon";
import { SearchPalette } from "@/components/search/SearchPalette";

const LINKS: { href: string; key: NavKey }[] = [
  { href: "/app", key: "lessons" },
  { href: "/app/sokratik", key: "socratic" },
  { href: "/app/gecmis", key: "history" },
  { href: "/app/akis", key: "feed" },
  { href: "/app/mesajlar", key: "messages" },
  { href: "/app/bildirimler", key: "notifications" },
  { href: "/app/profil", key: "profile" },
] as const;

/* Uygulamanın kalıcı navbar'ı. Pazarlama navbar'ından ayrı: burada bölüm
   bağlantısı değil, sayfa bağlantısı var. */
export function AppNav() {
  const t = useTranslations("app.nav");
  const ta = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, enabled } = useAuth();
  const { profile } = useApp();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [unreadDm, setUnreadDm] = useState(0);
  const [search, setSearch] = useState(false);

  /* Okunmamış bildirim rozeti. 60 sn'de bir tazeleniyor — anlık akış
     (realtime) yerine basit yoklama; bu ölçekte yeterli. */
  useEffect(() => {
    if (!enabled || !user) return;
    let alive = true;
    const tick = async () => {
      try {
        const [n, dm] = await Promise.all([
          getRepo().unreadCount(),
          getRepo().unreadMessageCount().catch(() => 0),
        ]);
        if (alive) { setUnread(n); setUnreadDm(dm); }
      } catch { /* sessizce geç: rozet kritik değil */ }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [enabled, user, pathname]);

  /* ⌘K / Ctrl+K her yerden aramayı açar. Girdi alanındayken araya girmez. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* Seans ekranı odaklanmış bir çalışma alanı: kendi başlığı var ve tam ekran.
     Navbar orada görünmez. */
  if (pathname.includes("/seans/")) return null;

  const active = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-[1400px] items-center gap-3 px-[clamp(14px,3vw,28px)]">
        <Link href="/app" className="flex items-center" aria-label="Tutorla">
          <Wordmark className="h-6 w-auto" />
        </Link>

        <nav className="mx-auto hidden items-center gap-0.5 md:flex xl:gap-1" aria-label="app">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              data-tur={l.key === "lessons" ? "dersler" : l.key === "socratic" ? "sokratik" : l.key === "history" ? "gecmis" : l.key === "feed" ? "akis" : l.key === "messages" ? "mesajlar" : l.key === "profile" ? "profil" : undefined}
              aria-current={active(l.href) ? "page" : undefined}
              title={t(l.key)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-ui)] px-2.5 py-2 text-[14.5px] font-medium transition-colors xl:px-3 ${
                active(l.href) ? "bg-surface text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"
              }`}
            >
              <NavIcon name={l.key} className={active(l.href) ? "text-primary" : ""} />
              {/* Etiketler yalnızca yer varken; aradaki genişliklerde ikon konuşuyor. */}
              <span className="hidden lg:inline">{t(l.key)}</span>
              {/* etkin sekmenin altındaki çizgi ortadan açılır */}
              <i
                className="pointer-events-none absolute inset-x-2 -bottom-px block h-[2px] origin-center rounded-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${active(l.href) ? 1 : 0})` }}
                aria-hidden="true"
              />
              {((l.key === "notifications" && unread > 0) || (l.key === "messages" && unreadDm > 0)) && (
                <span className="anim-pop absolute -right-0.5 -top-0.5 inline-grid min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-white tabular-nums lg:static lg:ml-0.5">
                  {(() => { const n = l.key === "messages" ? unreadDm : unread; return n > 9 ? "9+" : n; })()}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {enabled && user && (
            <Link
              href="/app/profil"
              className="hidden items-center gap-2 rounded-[var(--radius-ui)] border border-line-2 px-2.5 py-1.5 text-[13px] text-ink-2 transition-colors hover:border-primary hover:text-primary sm:flex"
            >
              <Avatar profile={profile} size="sm" className="!size-6" />
              <span className="max-w-[140px] truncate">{profile?.displayName || profile?.handle || user.email}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSearch(true)}
            data-tur="ara"
            title={`${t("search")} (⌘K)`}
            aria-label={t("search")}
            className="grid size-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 text-ink-2 transition-colors hover:border-primary hover:text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
            </svg>
          </button>
          <Link
            href="/app/rehber"
            title={t("guide")}
            aria-label={t("guide")}
            className="hidden size-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 text-ink-2 transition-colors hover:border-primary hover:text-primary sm:grid"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M9.6 9.2a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6" /><path d="M12 17.3h.01" />
            </svg>
          </Link>
          <ThemeToggle />
          {enabled && user && (
            <button
              type="button"
              onClick={async () => { await signOut(); router.replace("/giris"); }}
              className="hidden rounded-[var(--radius-ui)] border border-line-2 px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-primary hover:text-primary md:block"
            >
              {ta("signOut")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? t("close") : t("menu")}
            className="grid size-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 text-ink-2 md:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      <Collapse open={open} className="md:hidden">
        <nav className="mx-auto flex w-full max-w-[1400px] flex-col border-t border-line px-[clamp(14px,3vw,28px)] py-2" aria-label="app-mobile">
          {LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${50 + i * 40}ms` : "0ms" }}
              className={`flex items-center gap-2.5 border-b border-line py-3 text-[16px] font-semibold transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
              } ${active(l.href) ? "text-primary" : ""}`}
            >
              <NavIcon name={l.key} width={18} height={18} />
              {t(l.key)}
            </Link>
          ))}
          <Link
            href="/app/rehber"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-b border-line py-3 text-[16px] font-semibold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M9.6 9.2a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.6" /><path d="M12 17.3h.01" />
            </svg>
            {t("guide")}
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); setSearch(true); }}
            className="flex items-center gap-2.5 border-b border-line py-3 text-left text-[16px] font-semibold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
            </svg>
            {t("search")}
          </button>
          {enabled && user && (
            <button
              type="button"
              onClick={async () => { setOpen(false); await signOut(); router.replace("/giris"); }}
              className="py-3 text-left text-[16px] font-semibold text-ink-2"
            >
              {ta("signOut")}
            </button>
          )}
        </nav>
      </Collapse>
      <SearchPalette open={search} onClose={() => setSearch(false)} />
    </header>
  );
}
