"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { useAuth } from "@/lib/auth";
import { TeachingEvidence } from "./TeachingEvidence";
import type { MomentKind } from "@/lib/domain";

const AVATARS = ["🦉", "🦊", "🐢", "🐙", "🦋", "🌱", "📚", "🧠", "🎯", "⚡", "🔭", "☕"];

function ProfileForm() {
  const t = useTranslations("app.profile");
  const { profile, exams, refreshProfile, ready } = useApp();
  const { user } = useAuth();
  /* Form profilden türetiliyor: profil yüklenince bileşen key ile sıfırlanıyor,
     böylece etkide setState yapıp cascading render'a yol açmıyoruz. */
  const [form, setForm] = useState({
    displayName: profile?.displayName ?? "",
    handle: profile?.handle ?? "",
    bio: profile?.bio ?? "",
    avatarEmoji: profile?.avatarEmoji || "🦉",
    examId: profile?.examId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState({ sessions: 0, closed: 0, moments: 0 });
  const [evidence, setEvidence] = useState<Partial<Record<MomentKind, number>>>({});

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      const repo = getRepo();
      const [ss, le, tp] = await Promise.all([repo.listSessions(), repo.getLearningEvidence(), repo.getTeachingProfile()]);
      if (!alive) return;
      setStats({
        sessions: ss.length,
        closed: le.reduce((n, r) => n + r.closedByTeaching, 0),
        moments: tp.reduce((n, r) => n + r.total, 0),
      });
      setEvidence(tp.reduce((a, r) => ({ ...a, [r.kind]: r.total }), {}));
    })();
    return () => { alive = false; };
  }, [ready]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const handle = form.handle.trim();
    if (handle && !/^[a-zA-Z0-9_]{3,20}$/.test(handle)) return setErr(t("handleRule"));
    setSaving(true);
    setErr(null);
    try {
      await getRepo().updateProfile({
        displayName: form.displayName.trim() || null,
        handle: handle || null,
        bio: form.bio.trim() || null,
        avatarEmoji: form.avatarEmoji,
        examId: form.examId || null,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e2) {
      const m = e2 instanceof Error ? e2.message : "";
      setErr(/duplicate|unique/i.test(m) ? t("handleTaken") : m || "—");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[860px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.7rem,3.4vw,2.4rem)]">{t("title")}</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={save} className="card flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2">
            <span className="meta text-[13.5px]">{t("avatar")}</span>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((a) => (
                <button
                  key={a} type="button" onClick={() => setForm({ ...form, avatarEmoji: a })}
                  aria-pressed={form.avatarEmoji === a}
                  className={`grid size-10 place-items-center rounded-[30%] border text-[19px] transition-colors ${
                    form.avatarEmoji === a ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]" : "border-line hover:border-line-2"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13.5px]">{t("name")}</span>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} maxLength={60}
              className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13.5px]">{t("handle")}</span>
            <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} maxLength={20} placeholder="ali_gok"
              className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary" />
            <span className="meta text-[12.5px]">{t("handleRule")}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13.5px]">{t("bio")}</span>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={200}
              className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="meta text-[13.5px]">{t("exam")}</span>
            <select value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value })}
              className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary">
              <option value="">—</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </label>

          {err && <p className="text-[14px] text-accent">{err}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">{t("save")}</button>
            {saved && <span className="meta text-[13.5px] !text-primary">{t("saved")}</span>}
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <div className="card p-5 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-[30%] border border-line bg-surface text-[30px]" aria-hidden="true">
              {form.avatarEmoji}
            </span>
            <p className="mt-3 font-semibold">{form.displayName || "—"}</p>
            {form.handle && <p className="meta text-[13.5px]">@{form.handle}</p>}
            <p className="meta mt-1 text-[12.5px]">{user?.email}</p>
            {form.bio && <p className="mt-3 text-[14px] leading-[1.5] text-ink-2">{form.bio}</p>}
          </div>

          <div className="card p-5">
            <span className="meta text-[13.5px]">{t("stats")}</span>
            <div className="mt-3 flex flex-col gap-2.5">
              {([["sessions", stats.sessions], ["closed", stats.closed], ["moments", stats.moments]] as const).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] text-ink-2">{t(k)}</span>
                  <b className="text-[1.4rem] font-extrabold tracking-[-0.03em] text-primary tabular-nums">{v}</b>
                </div>
              ))}
            </div>
            {stats.moments > 0 && <div className="mt-4 border-t border-line pt-3"><TeachingEvidence counts={evidence} /></div>}
          </div>
        </aside>
      </div>
    </main>
  );
}

/* Profil geldiğinde formu tazelemek için key ile yeniden kur. */
export function ProfileView() {
  const { profile, ready } = useApp();
  return <ProfileForm key={ready ? (profile?.id ?? "none") : "loading"} />;
}
