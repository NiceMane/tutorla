"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { Grade, Profile, StudyStyle } from "@/lib/domain";
import { Avatar } from "./Avatar";

const AVATARS = ["🦉", "🦊", "🐢", "🐙", "🦋", "🌱", "📚", "🧠", "🎯", "⚡", "🔭", "☕"];
const GRADES: Grade[] = ["9", "10", "11", "12", "mezun"];
const STYLES: StudyStyle[] = ["sabah", "gece", "karma"];
const MAX_AVATAR = 2 * 1024 * 1024;

type Form = {
  displayName: string; handle: string; bio: string; avatarEmoji: string;
  examId: string; grade: string; school: string; city: string; examYear: string;
  targetUniversity: string; targetDepartment: string; targetRank: string;
  weeklyHours: string; studyStyle: string; goals: string; isPublic: boolean;
  strongSubjects: string[]; weakSubjects: string[];
};

const fromProfile = (p: Profile | null): Form => ({
  displayName: p?.displayName ?? "", handle: p?.handle ?? "", bio: p?.bio ?? "",
  avatarEmoji: p?.avatarEmoji || "🦉", examId: p?.examId ?? "",
  grade: p?.grade ?? "", school: p?.school ?? "", city: p?.city ?? "",
  examYear: p?.examYear ? String(p.examYear) : "",
  targetUniversity: p?.targetUniversity ?? "", targetDepartment: p?.targetDepartment ?? "",
  targetRank: p?.targetRank ? String(p.targetRank) : "",
  weeklyHours: p?.weeklyHours ? String(p.weeklyHours) : "",
  studyStyle: p?.studyStyle ?? "", goals: p?.goals ?? "",
  isPublic: p?.isPublic ?? true,
  strongSubjects: p?.strongSubjects ?? [], weakSubjects: p?.weakSubjects ?? [],
});

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="meta text-[13px]">{label}</span>
      {children}
      {hint && <span className="meta text-[12.5px]">{hint}</span>}
    </label>
  );
}
const inputCls =
  "h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card flex flex-col gap-4 p-5">
      <legend className="meta px-1 text-[13.5px]">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ProfileForm({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("app.profile");
  const { profile, exams, curriculum, refreshProfile } = useApp();
  const [form, setForm] = useState<Form>(() => fromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const subjects = curriculum.subjects.filter((s) => !form.examId || s.examId === form.examId);

  const toggleSubject = (key: "strongSubjects" | "weakSubjects", slug: string) => {
    const other = key === "strongSubjects" ? "weakSubjects" : "strongSubjects";
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(slug) ? f[key].filter((x) => x !== slug) : [...f[key], slug],
      /* Aynı ders hem güçlü hem zayıf olamaz */
      [other]: f[other].filter((x) => x !== slug),
    }));
  };

  async function pickAvatar(file: File | null) {
    if (!file) return;
    if (file.size > MAX_AVATAR) return setErr(t("photoHint"));
    setErr(null);
    setUploading(true);
    try {
      setAvatarUrl(await getRepo().uploadAvatar(file));
      await refreshProfile();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "—");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const handle = form.handle.trim();
    if (handle && !/^[a-zA-Z0-9_]{3,20}$/.test(handle)) return setErr(t("handleRule"));
    setSaving(true);
    setErr(null);
    const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
    try {
      await getRepo().updateProfile({
        displayName: form.displayName.trim() || null,
        handle: handle || null,
        bio: form.bio.trim() || null,
        avatarEmoji: form.avatarEmoji,
        examId: form.examId || null,
        grade: (form.grade || null) as Grade | null,
        school: form.school.trim() || null,
        city: form.city.trim() || null,
        examYear: numOrNull(form.examYear),
        targetUniversity: form.targetUniversity.trim() || null,
        targetDepartment: form.targetDepartment.trim() || null,
        targetRank: numOrNull(form.targetRank),
        weeklyHours: numOrNull(form.weeklyHours),
        studyStyle: (form.studyStyle || null) as StudyStyle | null,
        strongSubjects: form.strongSubjects,
        weakSubjects: form.weakSubjects,
        goals: form.goals.trim() || null,
        isPublic: form.isPublic,
      });
      await refreshProfile();
      /* Onayı üst bileşen gösteriyor: burada setSaved yapıp hemen kapanırsak
         mesaj hiç görünmüyordu. */
      if (onDone) onDone();
      else { setSaved(true); setTimeout(() => setSaved(false), 2200); }
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(/duplicate|unique/i.test(m) ? t("handleTaken") : m || "—");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <Section title={t("photo")}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar profile={{ avatarUrl, avatarEmoji: form.avatarEmoji, displayName: form.displayName }} size="xl" />
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
              onChange={(e) => pickAvatar(e.target.files?.[0] ?? null)} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="btn btn-ghost h-9 text-[13.5px] disabled:opacity-60">
                {uploading ? t("cropping") : t("upload")}
              </button>
              {avatarUrl && (
                <button type="button" disabled={uploading}
                  onClick={async () => { await getRepo().removeAvatar(); setAvatarUrl(null); await refreshProfile(); }}
                  className="btn btn-ghost h-9 text-[13.5px]">{t("remove")}</button>
              )}
            </div>
            <span className="meta text-[12.5px]">{t("photoHint")}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="meta text-[13px]">{t("useEmoji")}</span>
          <div className="flex flex-wrap gap-1.5">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => set("avatarEmoji", a)} aria-pressed={form.avatarEmoji === a}
                className={`grid size-10 place-items-center rounded-[30%] border text-[19px] transition-colors ${
                  form.avatarEmoji === a ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]" : "border-line hover:border-line-2"
                }`}>{a}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t("identity")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("name")}>
            <input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} maxLength={60} className={inputCls} />
          </Field>
          <Field label={t("handle")} hint={t("handleRule")}>
            <input value={form.handle} onChange={(e) => set("handle", e.target.value)} maxLength={20} placeholder="ali_gok" className={inputCls} />
          </Field>
        </div>
        <Field label={t("bio")}>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} maxLength={200}
            className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary" />
        </Field>
      </Section>

      <Section title={t("study")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("exam")}>
            <select value={form.examId} onChange={(e) => set("examId", e.target.value)} className={inputCls}>
              <option value="">—</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </Field>
          <Field label={t("grade")}>
            <select value={form.grade} onChange={(e) => set("grade", e.target.value)} className={inputCls}>
              <option value="">—</option>
              {GRADES.map((g) => <option key={g} value={g}>{t(`grades.${g}`)}</option>)}
            </select>
          </Field>
          <Field label={t("school")}>
            <input value={form.school} onChange={(e) => set("school", e.target.value)} maxLength={80} className={inputCls} />
          </Field>
          <Field label={t("city")}>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={40} className={inputCls} />
          </Field>
          <Field label={t("examYear")}>
            <input type="number" min={2025} max={2040} value={form.examYear}
              onChange={(e) => set("examYear", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title={t("target")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("targetUniversity")}>
            <input value={form.targetUniversity} onChange={(e) => set("targetUniversity", e.target.value)} maxLength={80} className={inputCls} />
          </Field>
          <Field label={t("targetDepartment")}>
            <input value={form.targetDepartment} onChange={(e) => set("targetDepartment", e.target.value)} maxLength={80} className={inputCls} />
          </Field>
          <Field label={t("targetRank")}>
            <input type="number" min={1} value={form.targetRank}
              onChange={(e) => set("targetRank", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label={t("goals")}>
          <textarea value={form.goals} onChange={(e) => set("goals", e.target.value)} rows={3} maxLength={400}
            className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary" />
        </Field>
      </Section>

      <Section title={t("habits")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("weeklyHours")}>
            <input type="number" min={0} max={120} value={form.weeklyHours}
              onChange={(e) => set("weeklyHours", e.target.value)} className={inputCls} />
          </Field>
          <Field label={t("studyStyle")}>
            <select value={form.studyStyle} onChange={(e) => set("studyStyle", e.target.value)} className={inputCls}>
              <option value="">—</option>
              {STYLES.map((v) => <option key={v} value={v}>{t(`styles.${v}`)}</option>)}
            </select>
          </Field>
        </div>
        {subjects.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <span className="meta text-[13px]">{t("strong")}</span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSubject("strongSubjects", s.slug)}
                    aria-pressed={form.strongSubjects.includes(s.slug)}
                    className={`chip ${form.strongSubjects.includes(s.slug) ? "chip-on" : ""}`}>{s.name}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="meta text-[13px]">{t("weak")}</span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSubject("weakSubjects", s.slug)}
                    aria-pressed={form.weakSubjects.includes(s.slug)}
                    className={`chip ${form.weakSubjects.includes(s.slug) ? "!border-accent !bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] !text-accent" : ""}`}>{s.name}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </Section>

      <Section title={t("privacy")}>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={form.isPublic} onChange={(e) => set("isPublic", e.target.checked)}
            className="mt-1 size-4 accent-[var(--primary)]" />
          <span>
            <span className="block text-[14.5px] font-medium">{t("isPublic")}</span>
            <span className="meta block text-[12.5px]">{t("privacyHint")}</span>
          </span>
        </label>
      </Section>

      {err && <p className="text-[14px] text-accent" role="alert">{err}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">
          {saving ? t("saving") : t("save")}
        </button>
        {saved && <span className="meta anim-fade-in text-[13.5px] !text-primary">{t("saved")}</span>}
      </div>
    </form>
  );
}
