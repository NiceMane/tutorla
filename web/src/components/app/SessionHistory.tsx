"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { Session } from "@/lib/domain";
import { EmptyState, SkeletonList } from "@/components/ui/States";
import { TimeAgo } from "@/components/ui/Time";

export function SessionHistory() {
  const t = useTranslations("app.history");
  const { ready, curriculum } = useApp();
  const [sessions, setSessions] = useState<Session[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    getRepo().listSessions().then((s) => alive && setSessions(s));
    return () => { alive = false; };
  }, [ready]);

  const topicName = (id: string) => curriculum.topics.find((x) => x.id === id)?.name ?? "—";
  const subjectName = (topicId: string) => {
    const topic = curriculum.topics.find((x) => x.id === topicId);
    return curriculum.subjects.find((s) => s.id === topic?.subjectId)?.name ?? "";
  };

  return (
    <main className="mx-auto w-full max-w-[820px] px-[clamp(14px,3vw,28px)] py-10">
      <h1 className="text-[clamp(1.6rem,3.2vw,2.2rem)]">{t("title")}</h1>

      <div className="mt-6">
        {sessions === null ? (
          <SkeletonList count={4} height="h-20" />
        ) : sessions.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <ul className="stagger flex flex-col gap-2">
            {sessions.map((s, i) => (
              <li key={s.id} style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/app/seans/${s.id}` as "/app"} className="card lift flex flex-wrap items-center gap-3 px-4 py-3 hover:border-line-2">
                  <span className="font-medium">{topicName(s.topicId)}</span>
                  <span className="meta text-[13px]">{subjectName(s.topicId)}</span>
                  <span className={`chip text-[11.5px] ${s.mode === "socratic" ? "!border-primary !text-primary" : ""}`}>
                    {t(`mode.${s.mode}`)}
                  </span>
                  <span className="meta ml-auto text-[12.5px]">
                    <TimeAgo iso={s.startedAt} /> · {s.status === "finished" ? t("finished") : t("active")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
