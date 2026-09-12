import { setRequestLocale } from "next-intl/server";
import { ExamDetail } from "@/components/app/ExamDetail";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  return <ExamDetail code={decodeURIComponent(code)} />;
}
