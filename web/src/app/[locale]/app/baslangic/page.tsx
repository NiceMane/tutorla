import { setRequestLocale } from "next-intl/server";
import { Onboarding } from "@/components/app/Onboarding";

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Onboarding />;
}
