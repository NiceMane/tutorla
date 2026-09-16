import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/ui/Wordmark";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-5 text-center">
      <div className="anim-fade-up max-w-[44ch]">
        <Wordmark className="mx-auto h-8 w-auto" />
        <h1 className="mt-6 text-[clamp(1.6rem,3.4vw,2.2rem)]">{t("notFoundTitle")}</h1>
        <p className="mt-3 text-ink-2">{t("notFoundBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">{t("home")}</Link>
          <Link href="/app" className="btn btn-ghost">{t("toApp")}</Link>
        </div>
      </div>
    </main>
  );
}
