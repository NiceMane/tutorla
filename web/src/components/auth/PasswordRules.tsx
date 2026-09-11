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
          <li key={id} className={`flex items-center gap-2 text-[13.5px] ${ok ? "text-primary" : "text-ink-3"}`}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              {ok ? <path d="M3 8.5l3.2 3L13 4.5" /> : <circle cx="8" cy="8" r="3.2" />}
            </svg>
            {label}
          </li>
        );
      })}
    </ul>
  );
}
