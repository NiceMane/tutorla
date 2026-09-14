"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { GRADE_KEYS, STYLE_KEYS, TRACK_KEYS } from "@/lib/options";
import { optionLabel } from "@/lib/labels";
import { Avatar } from "./Avatar";
import { AvatarEditor } from "./AvatarEditor";


const AVATARS = ["🦉", "🦊", "🐢", "🐙", "🦋", "🌱", "📚", "🧠", "🎯", "⚡"];

/* Dört adımlık tanışma. onboarded_at şemada duruyordu ama hiç kullanılmıyordu;
   artık burada işaretleniyor ve ikinci kez gösterilmiyor. */
export function Onboarding() {
  const t = useTranslations("app.onboarding");
  const tp = useTranslations("app.profile");
  const { profile, exams, curriculum, refreshProfile } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(profile?.avatarUrl ?? null);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [f, setF] = useState({
    displayName: profile?.displayName ?? "", handle: profile?.handle ?? "",
    avatarEmoji: profile?.avatarEmoji || "🦉", examId: profile?.examId ?? "",
    grade: profile?.grade ?? "", track: profile?.track ?? "", targetUniversity: profile?.targetUniversity ?? "",
    targetDepartment: profile?.targetDepartment ?? "", goals: profile?.goals ?? "",
    weeklyHours: profile?.weeklyHours ? String(profile.weeklyHours) : "",
    studyStyle: profile?.studyStyle ?? "", strongSubjects: profile?.strongSubjects ?? [] as string[],
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  /* Öneriden seçilirse anahtar, elle yazılırsa metin saklanıyor. */
  const keyOf = (ns: string, label: string, keys: readonly string[]) =>
    keys.find((k) => optionLabel(tp, ns, k) === label) ?? label;
  const subjects = curriculum.subjects.filter((s) => !f.examId || s.examId === f.examId);
  const input = "h-10 w-full rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary";

  async function finish(skip = false) {
    if (busy) return;
    setBusy(true);
    try {
      await getRepo().updateProfile(
        skip
          ? { onboardedAt: new Date().toISOString() }
          : {
              displayName: f.displayName.trim() || null,
              handle: f.handle.trim() || null,
              avatarEmoji: f.avatarEmoji,
              examId: f.examId || null,
              grade: f.grade || null,
              targetUniversity: f.targetUniversity.trim() || null,
              targetDepartment: f.targetDepartment.trim() || null,
              goals: f.goals.trim() || null,
              weeklyHours: f.weeklyHours ? Number(f.weeklyHours) : null,
              studyStyle: f.studyStyle || null,
              track: f.track || null,
              strongSubjects: f.strongSubjects,
              onboardedAt: new Date().toISOString(),
            },
      );
      await refreshProfile();
      router.replace("/app");
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    {
      title: t("s1title"), sub: t("s1sub"),
      body: (
        <div className="flex flex-col gap-4">
          {/* Fotoğraf burada da eklenebilsin: profile gitmeden önce tanış. */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditingPhoto(true)}
              className="group relative rounded-[30%] outline-none ring-primary/60 focus-visible:ring-2"
              aria-label={tp("upload")}
            >
              <Avatar profile={{ avatarUrl: photo, avatarEmoji: f.avatarEmoji, displayName: f.displayName }} size="lg"
                className="transition-transform duration-200 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 grid place-items-center rounded-[30%] bg-[color-mix(in_oklab,var(--ink)_55%,transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
              </span>
            </button>
            <button type="button" onClick={() => setEditingPhoto(true)} className="btn btn-ghost h-9 text-[13.5px]">
              {photo ? tp("changePhoto") : tp("upload")}
            </button>
          </div>

          <AvatarEditor
            open={editingPhoto}
            onClose={() => setEditingPhoto(false)}
            currentUrl={photo}
            onUploaded={async (url) => { setPhoto(url); await refreshProfile(); }}
            onRemoved={async () => { setPhoto(null); await refreshProfile(); }}
          />

          <div className="flex flex-wrap gap-1.5">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => set("avatarEmoji", a)} aria-pressed={f.avatarEmoji === a}
                className={`grid size-11 place-items-center rounded-[30%] border text-[20px] transition-[transform,border-color,background-color] duration-200 hover:scale-105 active:scale-95 ${
                  f.avatarEmoji === a ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]" : "border-line"
                }`}>{a}</button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("name")}</span>
            <input value={f.displayName} onChange={(e) => set("displayName", e.target.value)} maxLength={60} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("handle")}</span>
            <input value={f.handle} onChange={(e) => set("handle", e.target.value)} maxLength={20} placeholder="ali_gok" className={input} />
          </label>
        </div>
      ),
    },
    {
      title: t("s2title"), sub: t("s2sub"),
      body: (
        <div className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {exams.map((ex) => (
              <button key={ex.id} type="button" onClick={() => set("examId", ex.id)} aria-pressed={f.examId === ex.id}
                className={`card flex flex-col items-start gap-1 p-3 text-left ${f.examId === ex.id ? "border-primary" : ""}`}>
                <span className="font-semibold">{ex.name}</span>
                {ex.description && <span className="meta text-[12.5px]">{ex.description}</span>}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="meta text-[13px]">{tp("grade")}</span>
              <input
                list="tanis-sinif" className={input} maxLength={40}
                value={optionLabel(tp, "grades", f.grade) ?? ""}
                onChange={(e) => set("grade", keyOf("grades", e.target.value, GRADE_KEYS))}
              />
              <datalist id="tanis-sinif">
                {GRADE_KEYS.map((g) => <option key={g} value={tp(`grades.${g}`)} />)}
              </datalist>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="meta text-[13px]">{tp("track")}</span>
              <input
                list="tanis-alan" className={input} maxLength={40}
                value={optionLabel(tp, "tracks", f.track) ?? ""}
                onChange={(e) => set("track", keyOf("tracks", e.target.value, TRACK_KEYS))}
              />
              <datalist id="tanis-alan">
                {TRACK_KEYS.map((v) => <option key={v} value={tp(`tracks.${v}`)} />)}
              </datalist>
            </label>
          </div>
        </div>
      ),
    },
    {
      title: t("s3title"), sub: t("s3sub"),
      body: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("targetUniversity")}</span>
            <input value={f.targetUniversity} onChange={(e) => set("targetUniversity", e.target.value)} maxLength={80} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("targetDepartment")}</span>
            <input value={f.targetDepartment} onChange={(e) => set("targetDepartment", e.target.value)} maxLength={80} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("goals")}</span>
            <textarea value={f.goals} onChange={(e) => set("goals", e.target.value)} rows={3} maxLength={400}
              className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary" />
          </label>
        </div>
      ),
    },
    {
      title: t("s4title"), sub: t("s4sub"),
      body: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("weeklyHours")}</span>
            <input type="number" min={0} max={120} value={f.weeklyHours} onChange={(e) => set("weeklyHours", e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13px]">{tp("studyStyle")}</span>
            <input
              list="tanis-duzen" className={input} maxLength={60}
              value={optionLabel(tp, "styles", f.studyStyle) ?? ""}
              onChange={(e) => set("studyStyle", keyOf("styles", e.target.value, STYLE_KEYS))}
            />
            <datalist id="tanis-duzen">
              {STYLE_KEYS.map((v) => <option key={v} value={tp(`styles.${v}`)} />)}
            </datalist>
            <span className="meta text-[12.5px]">{tp("freeHint")}</span>
          </label>
          {subjects.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="meta text-[13px]">{tp("strong")}</span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <button key={s.id} type="button"
                    onClick={() => set("strongSubjects", f.strongSubjects.includes(s.slug)
                      ? f.strongSubjects.filter((x) => x !== s.slug) : [...f.strongSubjects, s.slug])}
                    aria-pressed={f.strongSubjects.includes(s.slug)}
                    className={`chip ${f.strongSubjects.includes(s.slug) ? "chip-on" : ""}`}>{s.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <main className="mx-auto w-full max-w-[560px] px-[clamp(14px,3vw,28px)] py-12">
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <i
              className="block h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>
      <p className="meta mt-3 text-[12.5px]">{t("step")} {step + 1} {t("of")} {steps.length}</p>

      <div key={step} className={`mt-5 ${dir === 1 ? "anim-slide-left" : "anim-slide-right"}`}>
        <h1 className="text-[clamp(1.5rem,3.2vw,2rem)]">{cur.title}</h1>
        <p className="mt-2 text-ink-2">{cur.sub}</p>
        <div className="mt-6">{cur.body}</div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => { setDir(-1); setStep((s) => s - 1); }} className="btn btn-ghost">{t("back")}</button>
        )}
        <button type="button" disabled={busy}
          onClick={() => { if (last) { finish(); } else { setDir(1); setStep((s) => s + 1); } }}
          className="btn btn-primary disabled:opacity-60">
          {last ? t("finish") : t("next")}
        </button>
        <button type="button" disabled={busy} onClick={() => finish(true)} className="meta ml-auto text-[13.5px] hover:text-ink">
          {t("skip")}
        </button>
      </div>
    </main>
  );
}
