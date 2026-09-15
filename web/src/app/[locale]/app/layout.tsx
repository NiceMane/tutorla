import { setRequestLocale } from "next-intl/server";
import { AppProvider } from "@/lib/store";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppNav } from "@/components/app/AppNav";
import { OnboardingGate } from "@/components/app/OnboardingGate";
import { ToastHost } from "@/components/ui/Toast";
import { TourGate } from "@/components/tour/TourGate";

/* Uygulama kabuğu: pazarlama sayfasının navbar/footer'ı burada yok. */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <AppProvider>
        <OnboardingGate>
          <ToastHost>
            <div className="flex min-h-dvh flex-col bg-paper">
              <AppNav />
              {children}
            </div>
            <TourGate />
          </ToastHost>
        </OnboardingGate>
      </AppProvider>
    </RequireAuth>
  );
}
