import { setRequestLocale } from "next-intl/server";
import { Guide } from "@/components/tour/Guide";

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Guide />;
}
