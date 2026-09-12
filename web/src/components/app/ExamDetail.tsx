"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { ExamDocument, Session, Topic } from "@/lib/domain";
import { ProgressBar } from "./ProgressBar";
import { TeachingEvidence } from "./TeachingEvidence";
import type { MomentKind } from "@/lib/domain";

export function ExamDetail({ code }: { code: string }) {
  const t = useTranslations("app.exams");
  const td = useTranslations("app.dash");
  const { ready, exams, curriculum, personas, progress } = useApp();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [docs, setDocs] = useState<ExamDocument[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [doc, setDoc] = useState({ title: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [evidence, setEvidence] = useState<Partial<Record<MomentKind, number>>>({});
  const [closedTotal, setClosedTotal] = useState(0);

  const exam = exams.find((e) => e.code.toLowerCase() === code.toLowerCase()) ?? null;
  const subjects = exam ? curriculum.subjects.filter((s) => s.examId === exam.id) : [];
  const persona = personas.find((p) => p.active) ?? personas[0];

  const loadDocs = useCallback(async () => {
    if (exam) setDocs(await getRepo().listExamDocuments(exam.id));
  }, [exam]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      const repo = getRepo();
      const [ss, tp, le, dd] = await Promise.all([
        repo.listSessions(), repo.getTeachingProfile(), repo.getLearningEvidence(),
        exam ? repo.listExamDocuments(exam.id) : Promise.resolve([]),
      ]);
      if (!alive) return;
      setSessions(ss);
      setEvidence(tp.reduce((a, r) => ({ ...a, [r.kind]: r.total }), {}));
      setClosedTotal(le.reduce((n, r) => n + r.closedByTeaching, 0));
      setDocs(dd);
    })();
    return () => { alive = false; };
  }, [ready, exam]);

  async function openTopic(topic: Topic) {
    if (!persona || busy) return;
    setBusy(topic.id);
    const repo = getRepo();
    const open = sessions.find((s) => s.topicId === topic.id && s.status === "active" && s.mode === "teach");
    const session = open ?? (await repo.createSession(topic.id, persona.code, "teach"));
    router.push(`/app/seans/${session.id}` as "/app");
  }

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!exam || !doc.title.trim() || saving) return;
    setSaving(true);
    try {
      await getRepo().addExamDocument({ examId: exam.id, title: doc.title.trim(), notes: doc.notes.trim() || null, file });
      setDoc({ title: "", notes: "" });
      setFile(null);
      await loadDocs();
    } finally {
      setSaving(false);
    }
  }

  if (ready && !exam) {
    return (
      <main className="grid flex-1 place-items-center px-5 py-16 text-center">
        <div>
          <p className="text-ink-2">—</p>
          <Link href="/app" className="btn btn-ghost mt-4">{td("eyebrow")}</Link>
        </div>
      </main>
    );
  }

  const hasContent = subjects.length > 0;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-[clamp(14px,3vw,28px)] py-10">
      <Link href="/app" className="meta text-[13.5px] hover:text-ink">← {t("eyebrow")}</Link>
      <h1 className="mt-3 text-[clamp(1.8rem,3.6vw,2.6rem)]">{exam?.name ?? "…"}</h1>
      {exam?.description && <p className="mt-2 text-ink-2">{exam.description}</p>}

      {hasContent ? (
        <>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {subjects.map((subject) => {
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
                              <span className="mt-1.5 block max-w-[220px]"><ProgressBar percent={pct} /></span>
                            </span>
                            <span className="meta shrink-0 tabular-nums text-[15px]">{started ? `%${pct}` : "—"}</span>
                            <span className="meta shrink-0 text-[13px] opacity-0 transition-opacity group-hover:opacity-100">
                              {started ? td("continue") : td("start")} →
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

          {(closedTotal > 0 || Object.keys(evidence).length > 0) && (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <section className="card p-5">
                <h2 className="meta text-[15px]">{td("learning")}</h2>
                <p className="meta mt-1 text-[13px]">{td("learningHint")}</p>
                <p className="mt-4 text-[2.4rem] font-extrabold leading-none tracking-[-0.03em] text-primary tabular-nums">{closedTotal}</p>
                <p className="meta mt-1 text-[13px]">{td("closedConcepts")}</p>
              </section>
              <section className="card p-5">
                <h2 className="meta text-[15px]">{td("evidence")}</h2>
                <p className="meta mt-1 text-[13px]">{td("evidenceHint")}</p>
                <div className="mt-4"><TeachingEvidence counts={evidence} /></div>
              </section>
            </div>
          )}
        </>
      ) : (
        <section className="card mt-8 p-6">
          <p className="text-ink-2">{t("soonHint")}</p>
          <p className="meta mt-4 text-[13.5px] !text-accent">{t("aiPending")}</p>

          <h2 className="mt-6 text-[1.05rem]">{t("docs")}</h2>
          <form onSubmit={addDoc} className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="meta text-[13px]">{t("docTitle")}</span>
              <input
                value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} maxLength={120}
                className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary"
              />
            </label>
            <button type="submit" disabled={saving || !doc.title.trim()} className="btn btn-primary h-10 self-end disabled:opacity-50">
              {t("docAdd")}
            </button>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="meta text-[13px]">{t("docNotes")}</span>
              <textarea
                value={doc.notes} onChange={(e) => setDoc({ ...doc, notes: e.target.value })} rows={4}
                className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="meta text-[13px]">{t("docFile")}</span>
              <input
                type="file" accept=".pdf,.txt,.md,image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-[13.5px] text-ink-2 file:mr-3 file:rounded-[var(--radius-ui)] file:border file:border-line-2 file:bg-surface file:px-3 file:py-1.5 file:text-ink-2"
              />
            </label>
          </form>

          <ul className="mt-5 flex flex-col gap-2">
            {docs.length === 0 && <li className="meta text-[14px]">{t("docEmpty")}</li>}
            {docs.map((d) => (
              <li key={d.id} className="rounded-[var(--radius-ui)] border border-line bg-paper px-3 py-2">
                <span className="font-medium">{d.title}</span>
                {d.notes && <p className="mt-1 text-[13.5px] text-ink-2">{d.notes}</p>}
                {d.fileUrl && <span className="meta mt-1 block text-[12.5px]">📎 {d.fileUrl.split("/").pop()}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
