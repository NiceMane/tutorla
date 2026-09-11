import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/ui/Wordmark";

const NAV = [
  ["ters", "ters"], ["nasil", "nasil"], ["personalar", "personalar"], ["neden", "neden"], ["erken-erisim", "erken"],
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const n = useTranslations("nav");
  return (
    <footer className="border-t border-line bg-paper">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark className="h-8 w-auto" />
          <p className="mt-4 max-w-[36ch] text-[15px] text-ink-2">{t("tagline")}</p>
        </div>
        <div>
          <span className="meta text-[14px]">{t("sections")}</span>
          <ul className="mt-3 flex flex-col gap-2">
            {NAV.map(([id, key]) => (
              <li key={id}><a href={`#${id}`} className="text-[15px] font-medium text-ink-2 hover:text-ink">{n(key)}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <span className="meta text-[14px]">{t("social")}</span>
          <ul className="mt-3 flex flex-col gap-2 text-[15px] font-medium text-ink-3">
            <li>Instagram <span className="meta text-[13px]">@tutorla</span></li>
            <li>X <span className="meta text-[13px]">@tutorla</span></li>
            <li>LinkedIn <span className="meta text-[13px]">tutorla</span></li>
          </ul>
        </div>
      </div>
      {/* Palmo'daki dev "PALMO" — bizde tam kilit, kenardan kenara */}
      <div className="container-x overflow-hidden pb-4">
        <Wordmark className="w-full" />
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-line py-5 text-[13.5px] text-ink-3 sm:flex-row sm:justify-between">
        <span>{t("rights")}</span>
        <span className="meta">{t("made")}</span>
      </div>
    </footer>
  );
}
