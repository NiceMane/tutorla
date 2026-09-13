"use client";
import { useTranslations } from "next-intl";
import type { Profile, ProfileStats } from "@/lib/domain";
import { Avatar } from "./Avatar";

/* Profilin okunur görünümü — hem kendi sayfanda hem herkese açık sayfada. */
export function ProfileCard({
  profile, stats, subjectName, examName, actions,
}: {
  profile: Profile;
  stats: ProfileStats | null;
  subjectName: (slug: string) => string;
  examName: string | null;
  actions?: React.ReactNode;
}) {
  const t = useTranslations("app.profile");

  const rows: [string, string | null][] = [
    [t("exam"), examName],
    [t("grade"), profile.grade ? t(`grades.${profile.grade}`) : null],
    [t("school"), profile.school],
    [t("city"), profile.city],
    [t("examYear"), profile.examYear ? String(profile.examYear) : null],
    [t("targetUniversity"), profile.targetUniversity],
    [t("targetDepartment"), profile.targetDepartment],
    [t("targetRank"), profile.targetRank ? `${profile.targetRank.toLocaleString("tr")}.` : null],
    [t("weeklyHours"), profile.weeklyHours ? `${profile.weeklyHours} sa` : null],
    [t("studyStyle"), profile.studyStyle ? t(`styles.${profile.studyStyle}`) : null],
  ];
  const filled = rows.filter(([, v]) => v);

  /* Profil doluluğu: kaç alan dolmuş. Onboarding'i tamamlamaya teşvik. */
  const allFields = [
    profile.displayName, profile.handle, profile.bio, profile.avatarUrl, profile.examId,
    profile.grade, profile.school, profile.city, profile.examYear, profile.targetUniversity,
    profile.targetDepartment, profile.targetRank, profile.weeklyHours, profile.studyStyle,
    profile.goals, profile.strongSubjects.length ? "x" : null, profile.weakSubjects.length ? "x" : null,
  ];
  const percent = Math.round((allFields.filter(Boolean).length / allFields.length) * 100);

  const stat = (label: string, value: number) => (
    <div key={label} className="flex flex-col">
      <b className="text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] text-primary tabular-nums">{value}</b>
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
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/45 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-2.5 py-0.5 text-[13px] text-primary">
                🔥 <b className="tabular-nums">{profile.streakDays}</b> {t("streak")}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="meta text-[12.5px]">{t("completeness")}</span>
            <span className="meta text-[12.5px] !text-primary tabular-nums">%{percent}</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-[3px] bg-surface-2">
            <i className="block h-full bg-glow transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {stats && (
        <div className="card grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
          {stat(t("sessions"), stats.sessions)}
          {stat(t("closed"), stats.closedByTeaching)}
          {stat(t("followers"), stats.followers)}
          {stat(t("following"), stats.following)}
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

      {profile.goals && (
        <div className="card p-5">
          <span className="meta text-[13px]">{t("goals")}</span>
          <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-[1.55] text-ink-2">{profile.goals}</p>
        </div>
      )}
    </div>
  );
}
