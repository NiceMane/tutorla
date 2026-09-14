import { setRequestLocale } from "next-intl/server";
import { ResetPassword } from "@/components/auth/ResetPassword";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ResetPassword />;
}
