import { setRequestLocale } from "next-intl/server";
import { ExamPicker } from "@/components/app/ExamPicker";

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExamPicker />;
}
