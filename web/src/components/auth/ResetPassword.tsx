"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth, type AuthError } from "@/lib/auth";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { PasswordField } from "./PasswordField";
import { PasswordRules, passwordOk } from "./PasswordRules";

/* Sıfırlama e-postasındaki bağlantı buraya düşer. Supabase bağlantıdaki
   parçayı (#access_token=…) okuyup geçici bir oturum açar; biz yalnızca yeni
   şifreyi yazarız. Oturum yoksa bağlantı süresi dolmuş demektir. */
export function ResetPassword() {
  const t = useTranslations("auth");
  const { ready, user, enabled, updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<AuthError | "mismatch" | "weak" | null>(null);

  const mismatch = password2.length > 0 && password !== password2;

  /* Şifre değiştikten sonra uygulamaya al. */
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => router.replace("/app"), 2400);
    return () => clearTimeout(id);
  }, [done, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    if (!passwordOk(password)) return setErr("weak");
    if (password !== password2) return setErr("mismatch");
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (res) return setErr(res);
    setDone(true);
  }

  const errText: Record<AuthError | "mismatch" | "weak", string> = {
    invalid: t("errInvalid"), short: t("errShort"), email: t("errEmail"),
    google: t("errGoogle"), generic: t("errGeneric"), rate: t("errRate"),
    taken: t("errTaken"), mismatch: t("errMismatch"), weak: t("errWeak"),
  };

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-paper">
      <header className="flex h-[60px] items-center gap-3 px-[clamp(14px,3vw,28px)]">
        <Link href="/" className="flex items-center" aria-label="Tutorla">
          <Wordmark className="h-6 w-auto" />
        </Link>
        <div className="ml-auto"><ThemeToggle /></div>
      </header>

      <main className="grid place-items-center px-5 pb-16">
        <div className="anim-fade-up w-full max-w-[380px]">
          {done ? (
            <div className="card anim-fade-up p-7" role="status">
              <h1 className="text-[1.5rem]">{t("resetDoneTitle")}</h1>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">{t("resetDoneText")}</p>
            </div>
          ) : !ready ? (
            <p className="meta text-[14px]">{t("working")}</p>
          ) : !enabled || !user ? (
            <div className="card anim-fade-up p-7" role="alert">
              <h1 className="text-[1.5rem]">{t("resetExpiredTitle")}</h1>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">{t("resetExpiredText")}</p>
              <Link href="/giris" className="btn btn-primary mt-5">{t("signIn")}</Link>
            </div>
          ) : (
            <>
              <p className="eyebrow">{t("resetEyebrow")}</p>
              <h1 className="mt-2 text-[clamp(1.7rem,4vw,2.2rem)]">{t("resetTitle")}</h1>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">{t("resetFor")} <b className="font-semibold text-ink">{user.email}</b></p>

              <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
                <PasswordField
                  label={t("newPassword")} value={password}
                  onChange={(v) => { setPassword(v); setErr(null); }}
                  visible={show} onToggleVisible={() => setShow((v) => !v)}
                  autoComplete="new-password" disabled={busy} invalid={err === "weak"}
                />
                <PasswordField
                  label={t("passwordAgain")} value={password2}
                  onChange={(v) => { setPassword2(v); setErr(null); }}
                  visible={show} onToggleVisible={() => setShow((v) => !v)}
                  autoComplete="new-password" disabled={busy} invalid={mismatch || err === "mismatch"}
                />
                {mismatch && <p className="anim-fade-in -mt-2 text-[13.5px] text-accent">{t("errMismatch")}</p>}
                <PasswordRules password={password} />
                {err && <p className="anim-fade-in text-[14px] text-accent" role="alert">{errText[err]}</p>}
                <button
                  type="submit"
                  disabled={busy || !passwordOk(password) || password !== password2}
                  className="btn btn-primary justify-center disabled:opacity-50"
                >
                  {busy ? t("working") : t("resetSubmit")}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
