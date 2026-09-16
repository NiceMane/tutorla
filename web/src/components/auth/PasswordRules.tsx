"use client";
import { useTranslations } from "next-intl";

export type RuleId = "length" | "letter" | "digit";

export function checkPassword(pw: string): Record<RuleId, boolean> {
  return {
    length: pw.length >= 8,
    letter: /\p{L}/u.test(pw),
    digit: /\d/.test(pw),
  };
}

export const passwordOk = (pw: string) => Object.values(checkPassword(pw)).every(Boolean);

/* Canlı koşul listesi — yalnızca hesap açarken gösterilir. */
export function PasswordRules({ password }: { password: string }) {
  const t = useTranslations("auth");
  const state = checkPassword(password);
  const rows: [RuleId, string][] = [
    ["length", t("ruleLength")],
    ["letter", t("ruleLetter")],
    ["digit", t("ruleDigit")],
  ];
  return (
    <ul className="flex flex-col gap-1.5" aria-label={t("rules")}>
      {rows.map(([id, label]) => {
        const ok = state[id];
        return (
          <li className={`flex items-center gap-2 text-[13.5px] transition-colors duration-300 ${ok ? "text-primary" : "text-ink-3"}`} key={id}>
            {/* Koşul sağlanınca tik yerine oturur: daire küçülür, tik büyüyerek gelir. */}
            <span className="relative grid size-[13px] shrink-0 place-items-center">
              <svg
                width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                className={`absolute transition-[transform,opacity,rotate,scale,translate] duration-300 ease-out motion-reduce:transition-none ${ok ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
              >
                <path d="M3 8.5l3.2 3L13 4.5" />
              </svg>
              <svg
                width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
                aria-hidden="true"
                className={`absolute transition-[transform,opacity,rotate,scale,translate] duration-300 ease-out motion-reduce:transition-none ${ok ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
              >
                <circle cx="8" cy="8" r="3.2" />
              </svg>
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}
