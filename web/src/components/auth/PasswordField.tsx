"use client";
import { useId } from "react";
import { useTranslations } from "next-intl";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: string;
  disabled?: boolean;
  invalid?: boolean;
};

/* Göz düğmesi alanın içinde; type değişince imleç kaymasın diye tek input kullanıyoruz. */
export function PasswordField({ label, value, onChange, visible, onToggleVisible, autoComplete, disabled, invalid }: Props) {
  const t = useTranslations("auth");
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="meta text-[14px]">{label}</span>
      <span className="relative block">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full rounded-[var(--radius-ui)] border bg-surface pl-3.5 pr-11 outline-none disabled:opacity-60 ${
            invalid ? "border-accent" : "border-line-2 focus:border-primary"
          }`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={disabled}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          title={visible ? t("hidePassword") : t("showPassword")}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-3 transition-colors hover:text-primary disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible ? (
              <>
                <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.6" />
              </>
            ) : (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 6.2A9.9 9.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.3 4" />
                <path d="M6.5 7.7A16.8 16.8 0 0 0 2 12s3.6 6.5 10 6.5a9.7 9.7 0 0 0 3.9-.8" />
                <path d="M9.6 9.8a2.6 2.6 0 0 0 3.5 3.6" />
              </>
            )}
          </svg>
        </button>
      </span>
    </label>
  );
}
