import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default async function GirisPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  /* useSearchParams istemcide çözülür; statik render için Suspense şart */
  return (
    <Suspense>
      <AuthScreen />
    </Suspense>
  );
}
