"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@/i18n/navigation";

export function AppHeader({ right }: { right?: React.ReactNode }) {
  const t = useTranslations("app.nav");
  const ta = useTranslations("auth");
  const { user, signOut, enabled } = useAuth();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-[1400px] items-center gap-4 px-[clamp(14px,3vw,28px)]">
        <Link href="/app" className="flex items-center gap-3" aria-label={t("panel")}>
          <Wordmark className="h-6 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {right}
          {enabled && user && (
            <>
              <span className="meta hidden max-w-[200px] truncate text-[13px] sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={async () => { await signOut(); router.replace("/giris"); }}
                className="rounded-[var(--radius-ui)] border border-line-2 px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-primary hover:text-primary"
              >
                {ta("signOut")}
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
