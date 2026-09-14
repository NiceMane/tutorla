"use client";
/* Oturum durumu. RLS zaten veritabanında koruyor; buradaki iş kullanıcıyı
   doğru ekrana yönlendirmek ve kim olduğunu göstermek. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

export type AuthError = "invalid" | "short" | "email" | "google" | "rate" | "taken" | "generic";

type AuthState = {
  ready: boolean;
  user: User | null;
  /* Supabase yapılandırılmamışsa uygulama tarayıcı deposuyla çalışır,
     giriş ekranı da devre dışı kalır. */
  enabled: boolean;
  signIn(email: string, password: string): Promise<AuthError | null>;
  signUp(email: string, password: string): Promise<AuthError | "confirm" | null>;
  signInWithGoogle(redirectTo: string): Promise<AuthError | null>;
  /* Şifre sıfırlama e-postası gönderir; bağlantı /sifre-yenile sayfasına döner. */
  requestPasswordReset(email: string): Promise<AuthError | null>;
  /* Sıfırlama bağlantısıyla gelen oturumda yeni şifreyi yazar. */
  updatePassword(password: string): Promise<AuthError | null>;
  signOut(): Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

function classify(message: string): AuthError {
  const m = message.toLowerCase();
  /* Sıra önemli: "email rate limit exceeded" mesajı "email" içerdiği için
     hız sınırı kontrolü e-posta kontrolünden ÖNCE gelmeli. */
  if (
    m.includes("rate limit") ||
    m.includes("too many") ||
    /* Supabase'in kısıtlama mesajı bu kalıpta gelir ve "rate" kelimesi geçmez */
    m.includes("for security purposes") ||
    m.includes("you can only request this after")
  )
    return "rate";
  if (m.includes("already registered") || m.includes("already been registered")) return "taken";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "invalid";
  if (m.includes("password") && m.includes("least")) return "short";
  if (m.includes("provider") || m.includes("not enabled")) return "google";
  if (m.includes("email")) return "email";
  return "generic";
}

/* Mesaj eşlemesini testten doğrulayabilmek için dışarı açıyoruz. */
export const __classify = classify;

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = supabaseConfigured;
  const [ready, setReady] = useState(!enabled);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const sb = getSupabase();
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user: session?.user ?? null,
      enabled,
      async signIn(email, password) {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        return error ? classify(error.message) : null;
      },
      async signUp(email, password) {
        /* Doğrulama bağlantısı kullanıcının kaydolduğu adrese dönmeli.
           Belirtilmezse Supabase'in Site URL'i kullanılır — o da hâlâ
           localhost'u gösteriyorsa bağlantı boşluğa düşer. */
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) return classify(error.message);
        /* Oturum gelmediyse e-posta doğrulaması bekleniyor demektir */
        return data.session ? null : "confirm";
      },
      async signInWithGoogle(redirectTo) {
        const { error } = await getSupabase().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        return error ? classify(error.message) : null;
      },
      async requestPasswordReset(email) {
        const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/sifre-yenile`,
        });
        return error ? classify(error.message) : null;
      },
      async updatePassword(password) {
        const { error } = await getSupabase().auth.updateUser({ password });
        return error ? classify(error.message) : null;
      },
      async signOut() {
        await getSupabase().auth.signOut();
      },
    }),
    [ready, session, enabled],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth, AuthProvider içinde çağrılmalı");
  return v;
}
