"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { ProfileStats } from "@/lib/domain";
import { ProfileCard } from "./ProfileCard";
import { ProfileForm } from "./ProfileForm";
import { SkeletonList } from "@/components/ui/States";

export function ProfileView() {
  const t = useTranslations("app.profile");
  const { profile, exams, curriculum, ready } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    if (!ready || !profile) return;
    let alive = true;
    getRepo().getProfileStats(profile.id).then((s) => alive && setStats(s));
    return () => { alive = false; };
  }, [ready, profile]);

  const subjectName = (slug: string) => curriculum.subjects.find((s) => s.slug === slug)?.name ?? slug;
  const examName = exams.find((e) => e.id === profile?.examId)?.name ?? null;

  return (
    <main className="mx-auto w-full max-w-[900px] px-[clamp(14px,3vw,28px)] py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.4vw,2.4rem)]">{t("title")}</h1>
        </div>
        {profile && (
          <button type="button" onClick={() => setEditing((v) => !v)} className="btn btn-ghost h-9 text-[14px]">
            {editing ? t("view") : t("edit")}
          </button>
        )}
      </div>

      {saved && (
        <p className="anim-fade-in mt-4 rounded-[var(--radius-ui)] border border-primary/45 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-3 py-2 text-[14px] text-primary" role="status">
          {t("saved")}
        </p>
      )}

      <div className="mt-8">
        {!ready || !profile ? (
          <SkeletonList count={3} height="h-32" />
        ) : editing ? (
          <div className="anim-fade-in">
            <ProfileForm onDone={() => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2600); }} />
          </div>
        ) : (
          <div className="anim-fade-in">
            <ProfileCard profile={profile} stats={stats} subjectName={subjectName} examName={examName} />
          </div>
        )}
      </div>
    </main>
  );
}
