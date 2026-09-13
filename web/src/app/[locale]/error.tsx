"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/* Rota içinde yakalanmayan hata: beyaz ekran yerine kendi dilimizde bir sayfa. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error("Rota hatası:", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-5 text-center">
      <div className="max-w-[44ch]">
        <p className="eyebrow">{t("errorTitle")}</p>
        <h1 className="mt-3 text-[clamp(1.6rem,3.4vw,2.2rem)]">{t("errorTitle")}</h1>
        <p className="mt-3 text-ink-2">{t("errorBody")}</p>
        {error.digest && <p className="meta mt-2 text-[12.5px]">#{error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">{t("retry")}</button>
          <Link href="/" className="btn btn-ghost">{t("home")}</Link>
        </div>
      </div>
    </main>
  );
}
