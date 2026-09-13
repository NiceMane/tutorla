import { setRequestLocale } from "next-intl/server";
import { SessionHistory } from "@/components/app/SessionHistory";

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SessionHistory />;
}
