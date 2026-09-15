import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { SearchPage } from "@/components/search/SearchPage";

export default async function SearchRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
