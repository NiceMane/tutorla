import { setRequestLocale } from "next-intl/server";
import { SocraticStart } from "@/components/app/SocraticStart";

export default async function SocraticPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SocraticStart />;
}
