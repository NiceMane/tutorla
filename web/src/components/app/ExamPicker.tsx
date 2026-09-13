"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { Collapse } from "@/components/ui/Collapse";
import { ProgressBar } from "./ProgressBar";

/* Sınav seçimi. Yalnızca YKS'nin müfredatı yüklü; diğerleri "yakında" olarak
   duruyor ve öğrenci kendi sınavını ekleyebiliyor. */
export function ExamPicker() {
  const t = useTranslations("app.exams");
  const { ready, exams, curriculum, progress, refreshExams } = useApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const topicsOf = (examId: string) => {
    const subjectIds = new Set(curriculum.subjects.filter((s) => s.examId === examId).map((s) => s.id));
    return curriculum.topics.filter((x) => subjectIds.has(x.subjectId));
  };

  /* Sınav kartında ilerleme: o sınavın konularının ortalaması. */
  const examProgress = (examId: string) => {
    const topics = topicsOf(examId);
    if (topics.length === 0) return { started: 0, percent: 0 };
    const rows = topics.map((x) => progress.get(x.id));
    const started = rows.filter((r) => r && (r.settled > 0 || r.gaps > 0)).length;
    const percent = Math.round(rows.reduce((n, r) => n + (r?.percent ?? 0), 0) / topics.length);
    return { started, percent };
  };

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code || !name || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await getRepo().createExam({ code, name, description: form.description.trim() || null });
      await refreshExams();
      setForm({ code: "", name: "", description: "" });
      setAdding(false);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : "";
      setErr(/duplicate|unique/i.test(msg) ? t("codeTaken") : msg || "—");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.8rem,3.6vw,2.8rem)]">{t("title")}</h1>
      <p className="mt-2 text-ink-2">{t("subtitle")}</p>

      {!ready ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-32 animate-pulse bg-surface-2/60" />)}
        </div>
      ) : (
        <>
          <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((ex, i) => {
              const n = topicsOf(ex.id).length;
              const prog = examProgress(ex.id);
              const usable = ex.active && n > 0;
              return (
                <Link
                  key={ex.id}
                  href={`/app/sinav/${encodeURIComponent(ex.code)}` as "/app"}
                  style={{ "--i": i } as React.CSSProperties}
                  className={`card lift group flex flex-col gap-2 p-5 ${usable ? "hover:border-primary" : "hover:border-line-2"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[1.5rem] font-extrabold tracking-[-0.03em]">{ex.name}</span>
                    <span className={`chip shrink-0 text-[11.5px] ${usable ? "chip-on" : ""}`}>
                      {usable ? t("ready") : t("soon")}
                    </span>
                  </div>
                  {ex.description && <p className="text-[14px] leading-[1.45] text-ink-2">{ex.description}</p>}
                  {usable && prog.started > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      <ProgressBar percent={prog.percent} />
                      <span className="meta text-[12px] tabular-nums">
                        %{prog.percent} · {prog.started}/{n} {t("topics")}
                      </span>
                    </div>
                  )}
                  <div className="mt-auto flex items-baseline justify-between pt-2">
                    <span className="meta text-[13px]">
                      {usable ? `${n} ${t("topics")}` : t("soonHint")}
                    </span>
                    {ex.createdBy && <span className="meta text-[12px] !text-primary">{t("mine")}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          <section className="card mt-8 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[1.05rem]">{t("addTitle")}</h2>
                <p className="meta mt-1 text-[13px]">{t("addHint")}</p>
              </div>
              <button type="button" onClick={() => setAdding((v) => !v)} className="btn btn-ghost h-9 text-[14px]">
                {adding ? t("cancel") : t("add")}
              </button>
            </div>
            <Collapse open={adding}>
              <form onSubmit={create} className="grid gap-3 pt-4 md:grid-cols-[120px_minmax(0,1fr)_auto]">
                <label className="flex flex-col gap-1.5">
                  <span className="meta text-[13px]">{t("code")}</span>
                  <input
                    value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    maxLength={12} placeholder="IELTS"
                    className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 uppercase outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="meta text-[13px]">{t("name")}</span>
                  <input
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={60}
                    className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary"
                  />
                </label>
                <button type="submit" disabled={busy || !form.code.trim() || !form.name.trim()} className="btn btn-primary h-10 self-end disabled:opacity-50">
                  {t("create")}
                </button>
                <label className="flex flex-col gap-1.5 md:col-span-3">
                  <span className="meta text-[13px]">{t("desc")}</span>
                  <input
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    maxLength={120}
                    className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary"
                  />
                </label>
                {err && <p className="text-[14px] text-accent md:col-span-3">{err}</p>}
              </form>
            </Collapse>
          </section>
        </>
      )}
    </main>
  );
}
