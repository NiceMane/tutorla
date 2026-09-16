"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "./ThemeToggle";
import { scrollToSection } from "@/lib/scrollTo";
import { useScrolled } from "@/lib/hooks";
import { Collapse } from "@/components/ui/Collapse";
import { MenuIcon } from "@/components/ui/MenuIcon";

export const SECTIONS = ["ters", "nasil", "personalar", "neden", "sss", "erken-erisim"] as const;
/* Üst şeritte "Erken erişim" hem bağlantı hem düğme olarak iki kez duruyordu;
   masaüstünde düğme yeterli. Mobil panelde altısı da kalıyor. */
const BAR = SECTIONS.filter((id) => id !== "erken-erisim");
const LABEL: Record<(typeof SECTIONS)[number], "ters" | "nasil" | "personalar" | "neden" | "sss" | "erken"> = {
  ters: "ters",
  nasil: "nasil",
  personalar: "personalar",
  neden: "neden",
  sss: "sss",
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
        <a href="#top" onClick={go("top")} className="flex shrink-0 items-center gap-3" aria-label="Tutorla">
          <Wordmark className="h-7 w-auto" />
          {/* Rozet yalnızca gerçekten yer varken: dar ekranda menüyü sıkıştırıyordu. */}
          <span className="meta hidden whitespace-nowrap text-[13px] 2xl:inline">{t("badge")}</span>
        </a>

        <nav className="mx-auto hidden items-center gap-0.5 lg:flex xl:gap-1" aria-label="main">
          {BAR.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={go(id)}
              className="whitespace-nowrap rounded-[var(--radius-ui)] px-2.5 py-2 text-[14px] font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink xl:px-3 xl:text-[14.5px]"
            >
              {t(LABEL[id])}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <Link
            href={pathname}
            locale={locale === "tr" ? "en" : "tr"}
            className="grid h-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 px-2.5 text-[12.5px] font-semibold tracking-wide text-ink-2 transition-colors hover:border-primary hover:text-primary"
            aria-label={t("lang")}
          >
            {locale === "tr" ? "EN" : "TR"}
          </Link>
          <ThemeToggle />
          <Link
            href="/giris"
            className="hidden h-9 items-center whitespace-nowrap rounded-[var(--radius-ui)] px-2.5 text-[14px] font-semibold text-ink-2 transition-colors hover:text-primary sm:inline-flex"
          >
            {t("login")}
          </Link>
          <a href="#erken-erisim" onClick={go("erken-erisim")} className="btn btn-primary hidden h-9 whitespace-nowrap px-4 text-[14px] sm:inline-flex">
            {t("cta")}
          </a>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-[var(--radius-ui)] border border-line-2 text-ink-2 lg:hidden"
            aria-expanded={open}
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((o) => !o)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* mobil panel */}
      <Collapse open={open} className="lg:hidden">
        <nav className="container-x flex flex-col border-t border-line bg-paper py-3" aria-label="mobile">
          {SECTIONS.map((id, i) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={go(id)}
              style={{ transitionDelay: open ? `${60 + i * 45}ms` : "0ms" }}
              className={`border-b border-line py-3.5 text-[17px] font-semibold transition-[opacity,transform,rotate,scale,translate] duration-300 ease-out motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
              }`}
            >
              {t(LABEL[id])}
            </a>
          ))}
          <div
            style={{ transitionDelay: open ? `${60 + SECTIONS.length * 45}ms` : "0ms" }}
            className={`mt-3 flex flex-col gap-2 transition-[opacity,transform,rotate,scale,translate] duration-300 ease-out motion-reduce:transition-none ${
              open ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
            }`}
          >
            <a href="#erken-erisim" onClick={go("erken-erisim")} className="btn btn-primary justify-center">
              {t("cta")}
            </a>
            <Link href="/giris" onClick={() => setOpen(false)} className="btn btn-ghost justify-center">
              {t("login")}
            </Link>
          </div>
        </nav>
      </Collapse>
    </header>
  );
}
