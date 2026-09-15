"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { useSearchResults, type Hit } from "./useSearchResults";
import { ResultRow } from "./SearchResults";

/* ⌘K / Ctrl+K ile açılan arama. Konu, kavram, kişi, gönderi ve sınav aynı
   kutuda; konuya basınca doğrudan anlatmaya başlıyorsun. */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("app.search");
  const router = useRouter();
  const { personas } = useApp();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { groups, flat, loading, ready } = useSearchResults(q);

  /* Açılışta odak kutuya; kapanışta sorgu sıfırlanır. */
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => input.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [open]);

  async function pick(hit: Hit) {
    if (busy) return;
    setBusy(true);
    try {
      if (hit.kind === "person") {
        const handle = hit.profile.handle;
        router.push((handle ? `/app/profil/${handle}` : "/app/profil") as "/app");
      } else if (hit.kind === "post") {
        router.push("/app/akis" as "/app");
      } else if (hit.kind === "exam") {
        router.push(`/app/sinav/${encodeURIComponent(hit.code)}` as "/app");
      } else {
        /* Konu ve kavram: açık seans varsa ona devam, yoksa yenisini aç. */
        const repo = getRepo();
        const persona = personas.find((p) => p.active) ?? personas[0];
        const sessions = await repo.listSessions();
        const open2 = sessions.find((s) => s.topicId === hit.topicId && s.status === "active" && s.mode === "teach");
        const session = open2 ?? (persona ? await repo.createSession(hit.topicId, persona.code, "teach") : null);
        router.push((session ? `/app/seans/${session.id}` : `/app/sinav/${hit.examCode}`) as "/app");
      }
      close();
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setQ("");
    setCursor(0);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (flat.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % flat.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c - 1 + flat.length) % flat.length); }
    else if (e.key === "Enter") { e.preventDefault(); void pick(flat[Math.min(cursor, flat.length - 1)]); }
  }

  const sections: [string, Hit[]][] = [
    [t("topics"), groups.topics],
    [t("concepts"), groups.concepts],
    [t("people"), groups.people],
    [t("posts"), groups.posts],
    [t("exams"), groups.exams],
  ];
  let index = -1;

  return (
    <Modal open={open} onClose={close} title={t("title")} wide>
      <div onKeyDown={onKeyDown}>
        <label className="flex items-center gap-2.5 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-ink-3">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setCursor(0); }}
            placeholder={t("placeholder")}
            className="h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
            aria-label={t("title")}
          />
          {loading && <span className="meta shrink-0 text-[12px]">…</span>}
        </label>

        <div className="mt-3 max-h-[52dvh] overflow-y-auto">
          {!ready ? (
            <p className="meta px-1 py-6 text-center text-[13.5px]">{t("hint")}</p>
          ) : flat.length === 0 ? (
            <p className="meta px-1 py-6 text-center text-[13.5px]">{loading ? t("searching") : t("none", { q })}</p>
          ) : (
            sections.map(([label, hits]) =>
              hits.length === 0 ? null : (
                <section key={label} className="mb-2">
                  <p className="meta px-3 py-1 text-[11.5px] uppercase tracking-wide">{label}</p>
                  {hits.map((hit) => {
                    index += 1;
                    const i = index;
                    return (
                      <ResultRow
                        key={`${hit.kind}-${hit.id}`}
                        hit={hit}
                        selected={i === cursor}
                        onPick={() => void pick(hit)}
                        onHover={() => setCursor(i)}
                      />
                    );
                  })}
                </section>
              ),
            )
          )}
        </div>

        {ready && flat.length > 0 && (
          <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
            <span className="meta text-[12px]">{t("keys")}</span>
            <button
              type="button"
              onClick={() => { router.push(`/app/ara?q=${encodeURIComponent(q)}` as "/app"); close(); }}
              className="meta text-[12.5px] underline decoration-dotted underline-offset-4 hover:text-primary"
            >
              {t("all")}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
