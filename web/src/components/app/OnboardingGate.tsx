"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useApp } from "@/lib/store";

/* Profili hiç doldurmamış kullanıcıyı bir kez tanışma akışına alır.
   onboarded_at işaretlendikten sonra bir daha araya girmez. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { ready, profile } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || !profile) return;
    const onOnboarding = pathname.startsWith("/app/baslangic");
    /* Tanışmayı bitirmiş biri adrese elle gitse bile formu yeniden görmez. */
    if (profile.onboardedAt) {
      if (onOnboarding) router.replace("/app");
      return;
    }
    if (onOnboarding) return;
    router.replace("/app/baslangic");
  }, [ready, profile, pathname, router]);

  return <>{children}</>;
}
