import { supabaseConfigured } from "@/lib/supabase";
import { LocalRepo } from "./local";
import { SupabaseRepo } from "./supabase";
import type { Repo } from "./types";

let cached: Repo | null = null;

/* Ortam değişkenleri varsa Supabase, yoksa tarayıcı deposu.
   Böylece .env.local olmadan da uygulama çalışır. */
export function getRepo(): Repo {
  return (cached ??= supabaseConfigured ? new SupabaseRepo() : new LocalRepo());
}

export type { Curriculum, Repo, SessionDetail } from "./types";
