"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { FollowState, Profile, ProfileStats } from "@/lib/domain";
import { ProfileCard } from "./ProfileCard";
import { ReportDialog } from "./ReportDialog";
import { EmptyState, SkeletonList } from "@/components/ui/States";

export function PublicProfile({ handle }: { handle: string }) {
  const t = useTranslations("app.profile");
  const { profile: me, exams, curriculum, ready } = useApp();
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [person, setPerson] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [follow, setFollow] = useState<FollowState | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const tm = useTranslations("app.messages");

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepo();
      const p = await repo.getProfileByHandle(handle);
      if (!alive) return;
      if (!p) return setState("missing");
      setPerson(p);
      setState("ok");
      const [s, f, bl] = await Promise.all([
        repo.getProfileStats(p.id), repo.getFollowState(p.id), repo.listBlocked(),
      ]);
      if (!alive) return;
      setStats(s);
      setFollow(f);
      setBlocked(bl.includes(p.id));
    })();
    return () => { alive = false; };
  }, [handle]);

  const subjectName = (slug: string) => curriculum.subjects.find((s) => s.slug === slug)?.name ?? slug;
  const mine = me?.id === person?.id;

  if (state === "loading" || !ready) {
    return <main className="mx-auto w-full max-w-[900px] px-[clamp(14px,3vw,28px)] py-10"><SkeletonList count={3} height="h-32" /></main>;
  }
  if (state === "missing" || !person) {
    return (
      <main className="mx-auto w-full max-w-[900px] px-[clamp(14px,3vw,28px)] py-16">
        <EmptyState title={t("notFound")} action={<Link href="/app/akis" className="btn btn-ghost mt-2">←</Link>} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-[clamp(14px,3vw,28px)] py-10">
      <ProfileCard
        profile={person}
        stats={stats}
        subjectName={subjectName}
        examName={exams.find((e) => e.id === person.examId)?.name ?? null}
        actions={
          mine ? (
            <Link href="/app/profil" className="btn btn-ghost h-9 text-[13.5px]">{t("edit")}</Link>
          ) : (
            <>
              <button
                type="button" disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const now = await getRepo().toggleFollow(person.id);
                    setFollow((f) => f && { ...f, following: now, followers: f.followers + (now ? 1 : -1) });
                  } finally { setBusy(false); }
                }}
                className={`btn h-9 text-[13.5px] ${follow?.following ? "btn-ghost" : "btn-primary"} disabled:opacity-60`}
              >
                {follow?.following ? t("unfollow") : t("follow")}
              </button>
              {/* Engellenmiş biriyle kanal açılmıyor; düğme de görünmesin. */}
              {!blocked && (
                <button
                  type="button" disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const thread = await getRepo().openThread(person.id);
                      router.push(`/app/mesajlar?k=${thread}` as "/app");
                    } finally { setBusy(false); }
                  }}
                  className="btn btn-ghost h-9 text-[13.5px] disabled:opacity-60"
                >
                  {tm("openChat")}
                </button>
              )}
              <button
                type="button" disabled={busy}
                onClick={async () => { setBusy(true); try { setBlocked(await getRepo().toggleBlock(person.id)); } finally { setBusy(false); } }}
                className="btn btn-ghost h-9 text-[13.5px] disabled:opacity-60"
              >
                {blocked ? t("unblock") : t("block")}
              </button>
              <ReportDialog target={{ profileId: person.id }} />
            </>
          )
        }
      />
    </main>
  );
}
