"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth, type AuthError } from "@/lib/auth";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const t = useTranslations("auth");
  const { user, ready, enabled, signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<AuthError | null>(null);
  const [confirm, setConfirm] = useState(false);

  /* Zaten girmişse uygulamaya al */
  useEffect(() => {
    if (ready && user) router.replace(next as "/app");
  }, [ready, user, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr("email");
    if (password.length < 8) return setErr("short");

    setBusy(true);
    const res = mode === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (res === "confirm") return setConfirm(true);
    if (res) return setErr(res);
    router.replace(next as "/app");
  }

  async function google() {
    setErr(null);
    setBusy(true);
    const res = await signInWithGoogle(`${window.location.origin}${next}`);
    if (res) {
      setBusy(false);
      setErr(res);
    }
  }

  const errText: Record<AuthError, string> = {
    invalid: t("errInvalid"), short: t("errShort"), email: t("errEmail"),
    google: t("errGoogle"), generic: t("errGeneric"),
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
        <div className="w-full max-w-[380px]">
          {confirm ? (
            <div className="card p-7" role="status">
              <h1 className="text-[1.5rem]">{t("checkMail")}</h1>
              <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">{t("checkMailText")}</p>
              <button type="button" onClick={() => { setConfirm(false); setMode("signin"); }} className="btn btn-ghost mt-5">
                {t("signIn")}
              </button>
            </div>
          ) : (
            <>
              <p className="eyebrow">{mode === "signin" ? t("subtitle") : t("subtitleSignup")}</p>
              <h1 className="mt-2 text-[clamp(1.7rem,4vw,2.2rem)]">
                {mode === "signin" ? t("title") : t("titleSignup")}
              </h1>

              {!enabled ? (
                <p className="mt-6 text-[15px] text-ink-2">
                  Supabase yapılandırılmadığı için giriş devre dışı. Uygulama tarayıcı deposuyla çalışıyor.
                </p>
              ) : (
                <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="meta text-[14px]">{t("email")}</span>
                    <input
                      type="email" value={email} autoComplete="email" disabled={busy}
                      onChange={(e) => { setEmail(e.target.value); setErr(null); }}
                      className="h-11 rounded-[var(--radius-ui)] border border-line-2 bg-surface px-3.5 outline-none focus:border-primary disabled:opacity-60"
                      placeholder="ad@ornek.com"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="meta text-[14px]">{t("password")}</span>
                    <input
                      type="password" value={password} disabled={busy}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      onChange={(e) => { setPassword(e.target.value); setErr(null); }}
                      className="h-11 rounded-[var(--radius-ui)] border border-line-2 bg-surface px-3.5 outline-none focus:border-primary disabled:opacity-60"
                      placeholder="••••••••"
                    />
                  </label>

                  {err && <p className="text-[14px] text-accent" role="alert">{errText[err]}</p>}

                  <button type="submit" disabled={busy} className="btn btn-primary justify-center disabled:opacity-60">
                    {busy ? t("working") : mode === "signin" ? t("signIn") : t("signUp")}
                  </button>

                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-line" />
                    <span className="meta text-[13px]">{t("or")}</span>
                    <span className="h-px flex-1 bg-line" />
                  </div>

                  <button type="button" onClick={google} disabled={busy} className="btn btn-ghost justify-center disabled:opacity-60">
                    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
                      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.9H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.3h2.9c1.7-1.6 2.7-3.9 2.7-6.6z" />
                      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
                      <path fill="#FBBC05" d="M3.9 10.6a5.4 5.4 0 0 1 0-3.4V4.9H.9a9 9 0 0 0 0 8.1l3-2.4z" />
                      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 4.9l3 2.3C4.6 5.1 6.6 3.6 9 3.6z" />
                    </svg>
                    {t("google")}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
                    className="meta mt-1 text-[14px] underline decoration-dotted underline-offset-4 hover:text-primary"
                  >
                    {mode === "signin" ? t("toSignup") : t("toSignin")}
                  </button>
                </form>
              )}

              <Link href="/" className="meta mt-8 block text-[13.5px] hover:text-ink">← {t("backHome")}</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
