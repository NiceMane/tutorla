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

const LINKS = [
  { href: "/app", key: "lessons" },
  { href: "/app/sokratik", key: "socratic" },
  { href: "/app/gecmis", key: "history" },
  { href: "/app/akis", key: "feed" },
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

  /* Okunmamış bildirim rozeti. 60 sn'de bir tazeleniyor — anlık akış
     (realtime) yerine basit yoklama; bu ölçekte yeterli. */
  useEffect(() => {
    if (!enabled || !user) return;
    let alive = true;
    const tick = async () => {
      try {
        const n = await getRepo().unreadCount();
        if (alive) setUnread(n);
      } catch { /* sessizce geç: rozet kritik değil */ }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [enabled, user, pathname]);

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

        <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="app">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`relative rounded-[var(--radius-ui)] px-3 py-2 text-[14.5px] font-medium transition-colors ${
                active(l.href) ? "bg-surface text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"
              }`}
            >
              {t(l.key)}
              {/* etkin sekmenin altındaki çizgi ortadan açılır */}
              <i
                className="pointer-events-none absolute inset-x-2 -bottom-px block h-[2px] origin-center rounded-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${active(l.href) ? 1 : 0})` }}
                aria-hidden="true"
              />
              {l.key === "notifications" && unread > 0 && (
                <span className="anim-pop ml-1.5 inline-grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white tabular-nums">
                  {unread > 9 ? "9+" : unread}
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
              className={`border-b border-line py-3 text-[16px] font-semibold transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
              } ${active(l.href) ? "text-primary" : ""}`}
            >
              {t(l.key)}
            </Link>
          ))}
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
    </header>
  );
}
