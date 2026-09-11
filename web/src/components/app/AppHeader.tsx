"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";

export function AppHeader({ right }: { right?: React.ReactNode }) {
  const t = useTranslations("app.nav");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[60px] w-full max-w-[1400px] items-center gap-4 px-[clamp(14px,3vw,28px)]">
        <Link href="/app" className="flex items-center gap-3" aria-label={t("panel")}>
          <Wordmark className="h-6 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
