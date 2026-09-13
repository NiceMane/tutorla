"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";
import type { Exam } from "@/lib/domain";
import { Collapse } from "@/components/ui/Collapse";
import { useToast } from "@/components/ui/Toast";

/* Öğrencinin kendi eklediği sınava ders ve konu eklemesi.
   Resmî müfredat buradan değiştirilemez — RLS de buna izin vermiyor. */
export function OwnCurriculum({ exam, onChange }: { exam: Exam; onChange: () => Promise<void> }) {
  const t = useTranslations("app.exams");
  const { curriculum } = useApp();
  const [subjectName, setSubjectName] = useState("");
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [topic, setTopic] = useState({ name: "", concepts: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /* Yeni eklenen satır bir kez vurgulansın: uzun listede nereye düştüğü belli olsun. */
  const [fresh, setFresh] = useState<string | null>(null);
  const toast = useToast();

  const subjects = curriculum.subjects.filter((s) => s.examId === exam.id);

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await onChange();
      if (done) toast(done);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "—";
      setErr(msg);
      toast(msg, "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card mt-6 p-5">
      <h2 className="text-[1.05rem]">{t("title")}</h2>
      <p className="meta mt-1 text-[13px]">{t("hint")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subjectName.trim()) return;
          const name = subjectName.trim();
          run(async () => { await getRepo().addSubject(exam.id, name); setSubjectName(""); setFresh(name); }, t("subjectAdded"));
        }}
        className="mt-4 flex flex-wrap gap-2"
      >
        <input
          value={subjectName} onChange={(e) => setSubjectName(e.target.value)} maxLength={60}
          placeholder={t("subjectName")}
          className="h-10 min-w-[200px] flex-1 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary"
        />
        <button type="submit" disabled={busy || !subjectName.trim()} className="btn btn-primary h-10 disabled:opacity-50">
          {t("addSubject")}
        </button>
      </form>

      {err && <p className="mt-3 text-[13.5px] text-accent" role="alert">{err}</p>}

      {subjects.length === 0 ? (
        <p className="meta mt-4 text-[14px]">{t("noSubjects")}</p>
      ) : (
        <ul className="stagger mt-4 flex flex-col gap-3">
          {subjects.map((s, si) => {
            const topics = curriculum.topics.filter((x) => x.subjectId === s.id);
            const open = openSubject === s.id;
            return (
              <li key={s.id} style={{ "--i": si } as React.CSSProperties}
                  className={`rounded-[var(--radius-card)] border border-line p-4 ${fresh === s.name ? "anim-flash" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-semibold">{s.name}</span>
                  <button type="button" onClick={() => setOpenSubject(open ? null : s.id)} className="btn btn-ghost h-8 px-3 text-[13px]">
                    {t("addTopic")}
                  </button>
                </div>

                {topics.length > 0 && (
                  <ul className="mt-3 flex flex-col">
                    {topics.map((x) => (
                      <li key={x.id} className={`flex items-center justify-between gap-3 border-t border-line py-2 first:border-t-0 ${fresh === x.name ? "anim-flash" : ""}`}>
                        <span className="truncate text-[14.5px]">{x.name}</span>
                        <button
                          type="button" disabled={busy}
                          onClick={() => { if (window.confirm(t("deleteTopicConfirm"))) run(() => getRepo().deleteTopic(x.id), t("topicDeleted")); }}
                          className="meta shrink-0 text-[12.5px] hover:text-accent"
                        >
                          {t("deleteTopic")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <Collapse open={open}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = topic.name.trim();
                      const concepts = topic.concepts.split("\n").map((c) => c.trim()).filter(Boolean);
                      if (!name) return;
                      run(async () => {
                        await getRepo().addTopic(s.id, name, concepts);
                        setTopic({ name: "", concepts: "" });
                        setOpenSubject(null);
                        setFresh(name);
                      }, t("topicAdded"));
                    }}
                    className="flex flex-col gap-3 pt-3"
                  >
                    <input
                      value={topic.name} onChange={(e) => setTopic({ ...topic, name: e.target.value })}
                      maxLength={80} placeholder={t("topicName")}
                      className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary"
                    />
                    <label className="flex flex-col gap-1.5">
                      <span className="meta text-[13px]">{t("conceptsLabel")}</span>
                      <textarea
                        value={topic.concepts} onChange={(e) => setTopic({ ...topic, concepts: e.target.value })}
                        rows={5} placeholder={"Tanım\nÖrnek\nSık yapılan hatalar"}
                        className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 font-mono text-[13.5px] outline-none focus:border-primary"
                      />
                      <span className="meta text-[12.5px]">{t("conceptsHint")}</span>
                    </label>
                    <button type="submit" disabled={busy || !topic.name.trim()} className="btn btn-primary h-9 self-start text-[14px] disabled:opacity-50">
                      {t("create")}
                    </button>
                  </form>
                </Collapse>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
