"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getRepo } from "@/lib/repo";
import type { AppNotification } from "@/lib/domain";
import { Avatar } from "./Avatar";
import { EmptyState, SkeletonList } from "@/components/ui/States";

export function Notifications() {
  const t = useTranslations("app.notif");
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepo();
      const rows = await repo.listNotifications();
      if (!alive) return;
      setItems(rows);
      /* Sayfayı açmak okumuş saymaktır — rozet burada sıfırlanır. */
      await repo.markNotificationsRead();
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[720px] px-[clamp(14px,3vw,28px)] py-10">
      <h1 className="text-[clamp(1.6rem,3.2vw,2.2rem)]">{t("title")}</h1>

      <div className="mt-6">
        {items === null ? (
          <SkeletonList count={4} height="h-16" />
        ) : items.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((n) => {
              const who = n.actor?.displayName || (n.actor?.handle ? `@${n.actor.handle}` : "—");
              const body = (
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar profile={n.actor} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="text-[14.5px]">
                      <b className="font-semibold">{who}</b> {t(n.kind)}
                    </span>
                    <span className="meta block text-[12.5px]">{new Date(n.createdAt).toLocaleString()}</span>
                  </span>
                  {!n.readAt && <i className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                </span>
              );
              return (
                <li key={n.id} className={`card px-4 py-3 ${n.readAt ? "" : "border-primary/40"}`}>
                  {n.actor?.handle ? (
                    <Link href={`/app/profil/${n.actor.handle}` as "/app"} className="flex items-center">{body}</Link>
                  ) : (
                    <span className="flex items-center">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
