"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { ProfileStats } from "@/lib/domain";
import { ProfileCard } from "./ProfileCard";
import { ProfileForm } from "./ProfileForm";
import { SkeletonList } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";

export function ProfileView() {
  const t = useTranslations("app.profile");
  const { profile, exams, curriculum, ready } = useApp();
  const [editing, setEditing] = useState(false);
  const toast = useToast();
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

      <div className="mt-8">
        {!ready || !profile ? (
          <SkeletonList count={3} height="h-32" />
        ) : editing ? (
          <div className="anim-fade-up">
            <ProfileForm onDone={() => { setEditing(false); toast(t("saved")); }} />
          </div>
        ) : (
          <div className="anim-fade-up">
            <ProfileCard profile={profile} stats={stats} subjectName={subjectName} examName={examName} />
          </div>
        )}
      </div>
    </main>
  );
}
