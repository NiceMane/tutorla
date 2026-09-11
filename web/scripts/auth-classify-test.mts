import { __classify } from "../src/lib/auth.tsx";

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
let fails = 0;
for (const [msg, want] of cases) {
  const got = __classify(msg);
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? "✓" : "✗"} ${want.padEnd(8)} ← "${msg.slice(0, 52)}"${ok ? "" : `  (çıkan: ${got})`}`);
}
console.log(fails ? `\n${fails} BAŞARISIZ` : "\nhepsi geçti");
process.exit(fails ? 1 : 0);
