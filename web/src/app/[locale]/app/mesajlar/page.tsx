import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Messages } from "@/components/messages/Messages";

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  /* useSearchParams istemci bileşeninde: Suspense sınırı gerekiyor. */
  return (
    <Suspense>
      <Messages />
    </Suspense>
  );
}
