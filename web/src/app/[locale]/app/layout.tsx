import { setRequestLocale } from "next-intl/server";
import { AppProvider } from "@/lib/store";

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
  return <AppProvider>{children}</AppProvider>;
}
