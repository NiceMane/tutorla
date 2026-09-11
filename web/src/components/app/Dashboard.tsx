"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { Session, Topic } from "@/lib/domain";
import { AppHeader } from "./AppHeader";
import { ProgressBar } from "./ProgressBar";

export function Dashboard() {
  const t = useTranslations("app.dash");
  const { ready, curriculum, personas, progress, reset, refresh } = useApp();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (ready) getRepo().listSessions().then(setSessions);
  }, [ready]);

  const persona = personas.find((p) => p.active) ?? personas[0];

  /* Konuda açık seans varsa ona dön, yoksa yeni aç. */
  async function openTopic(topic: Topic) {
    if (!persona || busy) return;
    setBusy(topic.id);
    const repo = getRepo();
    const open = sessions.find((s) => s.topicId === topic.id && s.status === "active");
    const session = open ?? (await repo.createSession(topic.id, persona.code));
    router.push(`/app/seans/${session.id}`);
  }

  return (
    <div className="min-h-dvh bg-paper">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1400px] px-[clamp(14px,3vw,28px)] py-10">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-3 text-[clamp(1.8rem,3.6vw,2.8rem)]">{t("title")}</h1>
        <p className="mt-2 text-ink-2">{t("subtitle")}</p>

        {!ready ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-40 animate-pulse bg-surface-2/60" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {curriculum.subjects.map((subject) => {
                const topics = curriculum.topics.filter((x) => x.subjectId === subject.id);
                return (
                  <section key={subject.id} className="card p-5">
                    <h2 className="text-[1.15rem]">{subject.name}</h2>
                    <ul className="mt-3 flex flex-col">
                      {topics.map((topic) => {
                        const p = progress.get(topic.id);
                        const started = !!p && (p.settled > 0 || p.gaps > 0);
                        const pct = p?.percent ?? 0;
                        return (
                          <li key={topic.id} className="border-t border-line first:border-t-0">
                            <button
                              type="button"
                              onClick={() => openTopic(topic)}
                              disabled={busy !== null}
                              className="group flex w-full items-center gap-4 py-3 text-left transition-opacity disabled:opacity-50"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium group-hover:text-primary">{topic.name}</span>
                                <span className="mt-1.5 block max-w-[220px]">
                                  <ProgressBar percent={pct} />
                                </span>
                              </span>
                              <span className="meta shrink-0 tabular-nums text-[15px]">
                                {started ? `%${pct}` : t("notStarted")}
                              </span>
                              <span className="meta shrink-0 text-[13px] opacity-0 transition-opacity group-hover:opacity-100">
                                {started ? t("continue") : t("start")} →
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>

            <section className="mt-12">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="meta text-[15px]">{t("recent")}</h2>
                {sessions.length > 0 && (
                  <button
                    type="button"
                    className="meta text-[13px] underline decoration-dotted underline-offset-4 hover:text-accent"
                    onClick={async () => {
                      if (!window.confirm(t("resetConfirm"))) return;
                      await reset();
                      setSessions([]);
                      await refresh();
                    }}
                  >
                    {t("reset")}
                  </button>
                )}
              </div>
              {sessions.length === 0 ? (
                <p className="mt-3 text-ink-3">{t("noSessions")}</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {sessions.slice(0, 8).map((s) => {
                    const topic = curriculum.topics.find((x) => x.id === s.topicId);
                    const subject = curriculum.subjects.find((x) => x.id === topic?.subjectId);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => router.push(`/app/seans/${s.id}`)}
                          className="card flex w-full items-center gap-3 px-4 py-3 text-left hover:border-line-2"
                        >
                          <span className="font-medium">{topic?.name ?? "—"}</span>
                          <span className="meta text-[13.5px]">{subject?.name}</span>
                          <span className="meta ml-auto text-[13px]">
                            {new Date(s.startedAt).toLocaleDateString()}
                            {s.status === "finished" ? " · bitti" : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
