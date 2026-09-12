import { setRequestLocale } from "next-intl/server";
import { Feed } from "@/components/feed/Feed";

export default async function FeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Feed />;
}
