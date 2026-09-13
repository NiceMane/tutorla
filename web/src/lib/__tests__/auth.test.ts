import { describe, expect, it } from "vitest";
import { __classify } from "@/lib/auth";

/* Supabase hata mesajlarının kullanıcıya doğru cümleye çevrilmesi.
   Hız sınırı mesajı "email rate limit exceeded" olduğu için bir zamanlar
   "geçersiz e-posta" diye etiketleniyordu; sıra bu yüzden önemli. */
describe("auth hata sınıflandırması", () => {
  const cases: [string, string][] = [
    ["For security purposes, you can only request this after 26 seconds.", "rate"],
    ["email rate limit exceeded", "rate"],
    ["Too many requests", "rate"],
    ["User already registered", "taken"],
    ["Invalid login credentials", "invalid"],
    ["Password should be at least 6 characters.", "short"],
    ["Unsupported provider: provider is not enabled", "google"],
    ["Unable to validate email address: invalid format", "email"],
    ["Something exploded", "generic"],
  ];
  it.each(cases)("%s → %s", (msg, want) => {
    expect(__classify(msg)).toBe(want);
  });
});
