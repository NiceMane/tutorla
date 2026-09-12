import { setRequestLocale } from "next-intl/server";
import { AppProvider } from "@/lib/store";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppNav } from "@/components/app/AppNav";

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
        <div className="flex min-h-dvh flex-col bg-paper">
          <AppNav />
          {children}
        </div>
      </AppProvider>
    </RequireAuth>
  );
}
