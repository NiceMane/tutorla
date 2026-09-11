"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "./ThemeToggle";
import { scrollToSection } from "@/lib/scrollTo";
import { useScrolled } from "@/lib/hooks";

export const SECTIONS = ["ters", "nasil", "personalar", "neden", "erken-erisim"] as const;
const LABEL: Record<(typeof SECTIONS)[number], "ters" | "nasil" | "personalar" | "neden" | "erken"> = {
  ters: "ters",
  nasil: "nasil",
  personalar: "personalar",
  neden: "neden",
  "erken-erisim": "erken",
};

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(24);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToSection(`#${id}`);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open
          ? "border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-[72px] items-center gap-4">
        <a href="#top" onClick={go("top")} className="flex items-center gap-3" aria-label="Tutorla">
          <Wordmark className="h-7 w-auto" />
          <span className="meta hidden text-[13px] sm:inline">{t("badge")}</span>
        </a>

        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="main">
          {SECTIONS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={go(id)}
              className="rounded-[var(--radius-ui)] px-3 py-2 text-[14.5px] font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            >
              {t(LABEL[id])}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href={pathname}
            locale={locale === "tr" ? "en" : "tr"}
            className="grid h-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 px-2.5 text-[12.5px] font-semibold tracking-wide text-ink-2 transition-colors hover:border-primary hover:text-primary"
            aria-label={t("lang")}
          >
            {locale === "tr" ? "EN" : "TR"}
          </Link>
          <ThemeToggle />
          <a href="#erken-erisim" onClick={go("erken-erisim")} className="btn btn-primary hidden h-9 px-4 text-[14px] sm:inline-flex">
            {t("cta")}
          </a>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 text-ink-2 lg:hidden"
            aria-expanded={open}
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* mobil panel */}
      <div className={`lg:hidden ${open ? "block" : "hidden"} border-t border-line bg-paper`}>
        <nav className="container-x flex flex-col py-3" aria-label="mobile">
          {SECTIONS.map((id) => (
            <a key={id} href={`#${id}`} onClick={go(id)} className="border-b border-line py-3.5 text-[17px] font-semibold last:border-b-0">
              {t(LABEL[id])}
            </a>
          ))}
          <a href="#erken-erisim" onClick={go("erken-erisim")} className="btn btn-primary mt-3 justify-center sm:hidden">
            {t("cta")}
          </a>
        </nav>
      </div>
    </header>
  );
}
