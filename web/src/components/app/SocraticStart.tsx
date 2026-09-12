"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { Session, Topic } from "@/lib/domain";

/* Sokratik mod: roller klasik — o sorar, sen düşünürsün.
   Ana modun tersi olduğu için ayrı bir giriş ekranı var. */
export function SocraticStart() {
  const t = useTranslations("app.socratic");
  const { ready, curriculum, personas, exams } = useApp();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    getRepo().listSessions().then((s) => alive && setSessions(s));
    return () => { alive = false; };
  }, [ready]);

  const persona = personas.find((p) => p.active) ?? personas[0];
  const activeExam = exams.find((e) => e.active);
  const subjects = activeExam ? curriculum.subjects.filter((s) => s.examId === activeExam.id) : [];

  async function start(topic: Topic) {
    if (!persona || busy) return;
    setBusy(topic.id);
    const repo = getRepo();
    const open = sessions.find((s) => s.topicId === topic.id && s.status === "active" && s.mode === "socratic");
    const session = open ?? (await repo.createSession(topic.id, persona.code, "socratic"));
    router.push(`/app/seans/${session.id}` as "/app");
  }

  return (
    <main className="mx-auto w-full max-w-[1000px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.7rem,3.4vw,2.4rem)]">{t("title")}</h1>
      <p className="mt-2 max-w-[62ch] text-ink-2">{t("subtitle")}</p>
      <p className="meta mt-4 max-w-[62ch] rounded-[var(--radius-ui)] border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_7%,transparent)] px-3 py-2 text-[13px] !text-primary">
        {t("note")}
      </p>

      <h2 className="meta mt-8 text-[15px]">{t("pick")}</h2>
      {!ready ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="card h-40 animate-pulse bg-surface-2/60" />)}
        </div>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => (
            <section key={subject.id} className="card p-5">
              <h3 className="text-[1.05rem]">{subject.name}</h3>
              <ul className="mt-2 flex flex-col">
                {curriculum.topics.filter((x) => x.subjectId === subject.id).map((topic) => (
                  <li key={topic.id} className="border-t border-line first:border-t-0">
                    <button
                      type="button" onClick={() => start(topic)} disabled={busy !== null}
                      className="group flex w-full items-center justify-between gap-3 py-2.5 text-left disabled:opacity-50"
                    >
                      <span className="truncate font-medium group-hover:text-primary">{topic.name}</span>
                      <span className="meta shrink-0 text-[13px] opacity-0 transition-opacity group-hover:opacity-100">{t("start")} →</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
