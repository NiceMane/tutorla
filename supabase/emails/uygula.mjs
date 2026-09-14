#!/usr/bin/env node
/* Şablonları Supabase paneline elle yapıştırmak yerine tek komutla uygular.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... node supabase/emails/uygula.mjs
 *
 * Jeton: supabase.com/dashboard/account/tokens (kişisel erişim jetonu).
 * Jeton yoksa şablonları panelden de yapıştırabilirsin — README'de yazıyor.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REF = process.env.SUPABASE_PROJECT_REF || "bupgkfzkuanzysdpteiy";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

/* Panel alanı → (dosya, konu satırı) */
const TEMPLATES = {
  confirmation:     ["confirmation.html",     "Tutorla hesabını doğrula"],
  invite:           ["invite.html",           "Tutorla'ya davet edildin"],
  magic_link:       ["magic-link.html",       "Tutorla giriş bağlantın"],
  email_change:     ["email-change.html",     "Tutorla e-posta adresi değişikliğini onayla"],
  recovery:         ["recovery.html",         "Tutorla şifreni sıfırla"],
  reauthentication: ["reauthentication.html", "Tutorla doğrulama kodun"],
};

if (!TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN yok. supabase.com/dashboard/account/tokens adresinden bir jeton al.");
  process.exit(1);
}

const body = {};
for (const [key, [file, subject]] of Object.entries(TEMPLATES)) {
  body[`mailer_templates_${key}_content`] = readFileSync(join(HERE, file), "utf8");
  body[`mailer_subjects_${key}`] = subject;
}

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`Hata ${res.status}: ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}
console.log(`${Object.keys(TEMPLATES).length} şablon uygulandı → ${REF}`);
