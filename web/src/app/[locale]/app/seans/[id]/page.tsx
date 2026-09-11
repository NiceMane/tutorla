import { setRequestLocale } from "next-intl/server";
import { SessionScreen } from "@/components/app/SessionScreen";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <SessionScreen sessionId={id} />;
}
