"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/* Supabase'deki waitlist tablosuna yazar.
   Tabloda select politikası yok: herkes kaydolabilir, kimse listeyi okuyamaz. */
export function EarlyAccess() {
  const t = useTranslations("erken");
  const [email, setEmail] = useState("");
  const [exam, setExam] = useState<"YKS" | "TÜBİTAK" | "SAT">("YKS");
  const [state, setState] = useState<"idle" | "invalid" | "sending" | "done" | "already" | "failed">("idle");
  const locale = useLocale();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return setState("invalid");

    /* Ortam değişkenleri yoksa (ör. .env.local olmadan çalıştırma) formu
       kilitlemek yerine kabul etmiş gibi davran — geliştirme kolaylığı. */
    if (!supabaseConfigured) return setState("done");

    setState("sending");
    const { error } = await getSupabase()
      .from("waitlist")
      .insert({ email: value, exam, locale });

    if (!error) return setState("done");
    /* 23505 = unique ihlali; zaten kayıtlı olmak hata değil */
    if (error.code === "23505") return setState("already");
    console.error("Bekleme listesi kaydı başarısız:", error.message);
    setState("failed");
  };

  return (
    <section id="erken-erisim" className="scroll-mt-20 border-t border-line bg-deep py-24 text-deep-ink md:py-32">
      <div className="container-x grid gap-12 md:grid-cols-2 md:items-center">
        <Reveal>
          <p className="eyebrow mb-4 !text-deep-primary">{t("eyebrow")}</p>
          <h2 className="text-[clamp(2rem,4.6vw,3.8rem)] text-deep-ink">{t("title")}</h2>
          <p className="mt-5 max-w-[46ch] text-[1.1rem] leading-[1.5] text-deep-mute">{t("text")}</p>
          <p className="meta mt-6 text-[14px] !text-deep-mute">{t("honest")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          {state === "done" || state === "already" ? (
            <div className="rounded-[var(--radius-card)] border border-deep-line bg-deep-2 p-8" role="status">
              <h3 className="text-[1.6rem] text-deep-ink">
                {state === "already" ? t("already") : t("successTitle")}
              </h3>
              <p className="mt-2 text-deep-mute">{t("successText")}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-deep-line bg-deep-2 p-6 md:p-8">
              <label className="flex flex-col gap-2">
                <span className="meta text-[15px] !text-deep-mute">{t("email")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state !== "sending") setState("idle"); }}
                  disabled={state === "sending"}
                  className="h-12 rounded-[var(--radius-ui)] border border-deep-line bg-deep px-4 text-deep-ink outline-none placeholder:text-deep-mute/70 focus:border-deep-primary"
                  placeholder="ad@ornek.com"
                  aria-invalid={state === "invalid"}
                  autoComplete="email"
                />
                {state === "invalid" && <span className="text-[14px] text-deep-accent">{t("invalid")}</span>}
              </label>
              <div className="flex flex-col gap-2">
                <span className="meta text-[15px] !text-deep-mute">{t("examLabel")}</span>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {(["YKS", "TÜBİTAK", "SAT"] as const).map((x) => (
                    <button
                      key={x}
                      type="button"
                      role="radio"
                      aria-checked={exam === x}
                      onClick={() => setExam(x)}
                      className={`chip !text-[14px] ${exam === x ? "!border-deep-primary !bg-deep-primary !text-deep" : "!border-deep-line !text-deep-mute hover:!border-deep-primary"}`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>
              {state === "failed" && <span className="text-[14px] text-deep-accent">{t("failed")}</span>}
              <button
                type="submit"
                disabled={state === "sending"}
                className="btn mt-1 justify-center !bg-deep-primary !text-deep hover:!bg-[color-mix(in_oklab,var(--deep-primary)_85%,white)] disabled:opacity-60"
              >
                {state === "sending" ? t("sending") : t("submit")}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
