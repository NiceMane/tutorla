"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik");
  return (client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "tutorla-auth" },
  }));
}

/* GEÇİCİ: auth ekranları (e-posta + Google) yazılana kadar tek geliştirme hesabı.
   RLS gerçek bir auth.uid() istediği için sahte kullanıcı yerine gerçek oturum açıyoruz.
   Yayına çıkmadan önce burası silinecek — bkz. docs/proje-dosyasi.md açık işler. */
let sessionPromise: Promise<void> | null = null;

export function ensureSession(): Promise<void> {
  return (sessionPromise ??= (async () => {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    if (data.session) return;

    const email = process.env.NEXT_PUBLIC_DEV_EMAIL;
    const password = process.env.NEXT_PUBLIC_DEV_PASSWORD;

    /* Geliştirme hesabı tanımlıysa onu kullan. Anonim girişi önce denemiyoruz
       çünkü panelde kapalıyken her açılışta konsola 422 düşüyor. */
    if (email && password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (!error) return;
      console.warn("Geliştirme hesabıyla giriş başarısız, anonim giriş deneniyor:", error.message);
    }

    /* Doğru yol: anonim giriş — her cihaz kendi hesabını alır.
       Supabase panelinde Authentication → Sign In / Providers → Anonymous sign-ins ile açılır. */
    const anon = await sb.auth.signInAnonymously();
    if (anon.error) {
      throw new Error(
        `Oturum açılamadı (${anon.error.message}). Supabase panelinde anonim girişi aç ` +
          "ya da .env.local içine geliştirme hesabı bilgilerini koy.",
      );
    }
  })());
}
