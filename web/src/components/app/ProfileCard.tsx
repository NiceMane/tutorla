"use client";
import { useTranslations } from "next-intl";
import type { Profile, ProfileEntry, ProfileStats } from "@/lib/domain";
import { Avatar } from "./Avatar";
import { CountUp } from "@/components/ui/CountUp";
import { optionLabel } from "@/lib/labels";

/* Girdi türlerinin simgesi — tek yerde. */
const ENTRY_ICON: Record<ProfileEntry["kind"], string> = {
  kulup: "🎭", proje: "🛠", yarisma: "🏅", gonullu: "🤝",
  sertifika: "📜", deneyim: "💼", basari: "⭐",
};
import { ProgressBar } from "./ProgressBar";

/* Profilin okunur görünümü — hem kendi sayfanda hem herkese açık sayfada. */
export function ProfileCard({
  profile, stats, entries, subjectName, examName, actions, onEdit,
}: {
  profile: Profile;
  stats: ProfileStats | null;
  /* Kulüp, proje, yarışma… — LinkedIn'deki deneyim bölümünün öğrenci hâli */
  entries?: ProfileEntry[];
  subjectName: (slug: string) => string;
  examName: string | null;
  actions?: React.ReactNode;
  /* Yalnızca kendi profilinde: eksik alanlara çağrı */
  onEdit?: () => void;
}) {
  const t = useTranslations("app.profile");

  const rows: [string, string | null][] = [
    [t("exam"), examName],
    [t("grade"), optionLabel(t, "grades", profile.grade)],
    [t("track"), optionLabel(t, "tracks", profile.track)],
    [t("school"), profile.school],
    [t("city"), profile.city],
    [t("examYear"), profile.examYear ? String(profile.examYear) : null],
    [t("targetUniversity"), profile.targetUniversity],
    [t("targetDepartment"), profile.targetDepartment],
    [t("targetRank"), profile.targetRank ? `${profile.targetRank.toLocaleString("tr")}.` : null],
    [t("targetScore"), profile.targetScore ? String(profile.targetScore) : null],
    [t("weeklyHours"), profile.weeklyHours ? `${profile.weeklyHours} sa` : null],
    [t("studyStyle"), optionLabel(t, "styles", profile.studyStyle)],
  ];
  const filled = rows.filter(([, v]) => v);

  /* Profil doluluğu: kaç alan dolmuş. Onboarding'i tamamlamaya teşvik. */
  const allFields = [
    profile.displayName, profile.handle, profile.bio, profile.avatarUrl, profile.examId,
    profile.grade, profile.school, profile.city, profile.examYear, profile.targetUniversity,
    profile.targetDepartment, profile.targetRank, profile.track, profile.targetScore,
    profile.weeklyHours, profile.studyStyle,
    profile.goals, profile.strongSubjects.length ? "x" : null, profile.weakSubjects.length ? "x" : null,
  ];
  const percent = Math.round((allFields.filter(Boolean).length / allFields.length) * 100);

  /* Boş kalan alanları adıyla söyle: "profil doluluğu %24" tek başına ne
     yapılacağını anlatmıyordu. */
  const missing = rows.filter(([, v]) => !v).map(([k]) => k);

  const stat = (label: string, value: number) => (
    <div key={label} className="flex flex-col">
      <b className="text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] text-primary tabular-nums">
        <CountUp value={value} />
      </b>
      <span className="meta mt-1 text-[12.5px]">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar profile={profile} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.5rem] leading-tight">{profile.displayName || t("empty")}</h2>
            {profile.handle && <p className="meta text-[14px]">@{profile.handle}</p>}
            {profile.bio && <p className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.5] text-ink-2">{profile.bio}</p>}
            {profile.streakDays > 0 && (
              <p className="anim-pop mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/45 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-2.5 py-0.5 text-[13px] text-primary">
                🔥 <b className="tabular-nums">{profile.streakDays}</b> {t("streak")}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="meta text-[12.5px]">{t("completeness")}</span>
            <span className="meta text-[12.5px] !text-primary tabular-nums">%<CountUp value={percent} /></span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      </div>

      {onEdit && missing.length > 0 && (
        <div className="card anim-fade-up flex flex-wrap items-center gap-3 border-primary/35 bg-[color-mix(in_oklab,var(--primary)_5%,transparent)] p-5">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("missingTitle")}</p>
            <p className="meta mt-1 text-[13.5px] leading-[1.5]">
              {t("missingHint", { alanlar: missing.slice(0, 4).join(", ") + (missing.length > 4 ? "…" : "") })}
            </p>
          </div>
          <button type="button" onClick={onEdit} className="btn btn-primary h-9 shrink-0 text-[13.5px]">{t("fill")}</button>
        </div>
      )}

      {stats && (
        <div className="card anim-fade-up grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
          {stat(t("sessions"), stats.sessions)}
          {stat(t("closed"), stats.closedByTeaching)}
          {stat(t("posts"), stats.posts)}
          {stat(t("connections"), stats.connections)}
        </div>
      )}

      {filled.length > 0 && (
        <dl className="card grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
          {filled.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-b-0">
              <dt className="meta text-[13px]">{k}</dt>
              <dd className="text-right text-[14.5px] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {(profile.strongSubjects.length > 0 || profile.weakSubjects.length > 0) && (
        <div className="card flex flex-col gap-4 p-5">
          {profile.strongSubjects.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="meta text-[13px]">{t("strong")}</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.strongSubjects.map((s) => <span key={s} className="chip chip-on">{subjectName(s)}</span>)}
              </div>
            </div>
          )}
          {profile.weakSubjects.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="meta text-[13px]">{t("weak")}</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.weakSubjects.map((s) => (
                  <span key={s} className="chip !border-accent !text-accent">{subjectName(s)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="card anim-fade-up flex flex-col gap-4 p-5">
          <span className="meta text-[13px]">{t("entries")}</span>
          <ul className="stagger flex flex-col">
            {entries.map((e, i) => (
              <li
                key={e.id}
                style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
                className="flex gap-3 border-t border-line py-3 first:border-t-0 first:pt-0"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[30%] border border-line bg-surface text-[15px]" aria-hidden="true">
                  {ENTRY_ICON[e.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <b className="text-[14.5px] font-semibold">{e.title}</b>
                    <span className="chip text-[11px]">{t(`entryKinds.${e.kind}`)}</span>
                    {(e.startYear || e.endYear) && (
                      <span className="meta text-[12.5px] tabular-nums">
                        {e.startYear ?? "?"}{e.endYear && e.endYear !== e.startYear ? `–${e.endYear}` : ""}
                      </span>
                    )}
                  </span>
                  {e.org && <span className="meta mt-0.5 block text-[13px]">{e.org}</span>}
                  {e.description && <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-[1.5] text-ink-2">{e.description}</p>}
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noopener noreferrer nofollow"
                       className="meta mt-1 inline-block text-[12.5px] !text-primary underline decoration-dotted underline-offset-4">
                      {t("entryLink")}
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.goals && (
        <div className="card p-5">
          <span className="meta text-[13px]">{t("goals")}</span>
          <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-[1.55] text-ink-2">{profile.goals}</p>
        </div>
      )}
    </div>
  );
}
