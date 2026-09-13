import { setRequestLocale } from "next-intl/server";
import { Notifications } from "@/components/app/Notifications";

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Notifications />;
}
