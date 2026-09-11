import { setRequestLocale } from "next-intl/server";
import { Dashboard } from "@/components/app/Dashboard";

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Dashboard />;
}
