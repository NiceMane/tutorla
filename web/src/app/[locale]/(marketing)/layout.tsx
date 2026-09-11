import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";

/* Pazarlama kabuğu. /app rotaları bu gruba girmez — kendi kabuğu var,
   yoksa sabit navbar uygulamanın üstüne biner ve tıklamaları yutar. */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Loader />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
