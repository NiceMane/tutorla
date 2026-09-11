"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik");
  return (client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      /* Google dönüşünde oturumu URL'den al */
      detectSessionInUrl: true,
      storageKey: "tutorla-auth",
    },
  }));
}
