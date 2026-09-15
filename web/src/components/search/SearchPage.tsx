"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";
import { useSearchResults, type Hit } from "./useSearchResults";
import { ResultRow } from "./SearchResults";
import { EmptyState } from "@/components/ui/States";

/* Paletin tam sayfa hâli: daha çok sonuç, paylaşılabilir adres (/app/ara?q=…). */
export function SearchPage() {
  const t = useTranslations("app.search");
  const params = useSearchParams();
  const router = useRouter();
  const { personas } = useApp();
  const [q, setQ] = useState(params.get("q") ?? "");
  const { groups, flat, loading, ready } = useSearchResults(q, 20);

  async function pick(hit: Hit) {
    if (hit.kind === "person") {
      router.push((hit.profile.handle ? `/app/profil/${hit.profile.handle}` : "/app/profil") as "/app");
    } else if (hit.kind === "post") {
      router.push("/app/akis" as "/app");
    } else if (hit.kind === "exam") {
      router.push(`/app/sinav/${encodeURIComponent(hit.code)}` as "/app");
    } else {
      const repo = getRepo();
      const persona = personas.find((p) => p.active) ?? personas[0];
      const sessions = await repo.listSessions();
      const open = sessions.find((s) => s.topicId === hit.topicId && s.status === "active" && s.mode === "teach");
      const session = open ?? (persona ? await repo.createSession(hit.topicId, persona.code, "teach") : null);
      router.push((session ? `/app/seans/${session.id}` : `/app/sinav/${hit.examCode}`) as "/app");
    }
  }

  const sections: [string, Hit[]][] = [
    [t("topics"), groups.topics],
    [t("concepts"), groups.concepts],
    [t("people"), groups.people],
    [t("posts"), groups.posts],
    [t("exams"), groups.exams],
  ];

  return (
    <main className="mx-auto w-full max-w-[820px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.7rem,3.4vw,2.4rem)]">{t("title")}</h1>

      <label className="mt-6 flex items-center gap-2.5 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-ink-3">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
        </svg>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          className="h-12 w-full bg-transparent text-[15.5px] outline-none placeholder:text-ink-3"
          aria-label={t("title")}
        />
        {loading && <span className="meta shrink-0 text-[12px]">…</span>}
      </label>

      <div className="mt-6">
        {!ready ? (
          <p className="meta text-[14px]">{t("hint")}</p>
        ) : flat.length === 0 ? (
          <EmptyState title={loading ? t("searching") : t("none", { q })} body={t("noneHint")} />
        ) : (
          <div className="stagger flex flex-col gap-4">
            {sections.map(([label, hits], i) =>
              hits.length === 0 ? null : (
                <section key={label} style={{ "--i": i } as React.CSSProperties} className="card p-2">
                  <p className="meta px-3 py-1.5 text-[11.5px] uppercase tracking-wide">{label}</p>
                  {hits.map((hit) => (
                    <ResultRow key={`${hit.kind}-${hit.id}`} hit={hit} onPick={() => void pick(hit)} />
                  ))}
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}
