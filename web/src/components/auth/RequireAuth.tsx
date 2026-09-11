"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";

/* Uygulama rotalarının kapısı. Asıl güvenlik RLS'te — bu katman
   kullanıcıyı boş ekranla baş başa bırakmamak için. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user, enabled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || !ready || user) return;
    router.replace(`/giris?next=${encodeURIComponent(pathname)}` as "/giris");
  }, [enabled, ready, user, pathname, router]);

  if (enabled && (!ready || !user)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper">
        <span className="meta text-[15px]">…</span>
      </div>
    );
  }
  return <>{children}</>;
}
