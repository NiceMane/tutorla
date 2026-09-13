import { setRequestLocale } from "next-intl/server";
import { PublicProfile } from "@/components/app/PublicProfile";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  return <PublicProfile handle={decodeURIComponent(handle)} />;
}
