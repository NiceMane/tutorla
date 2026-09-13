import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero/Hero";
import { Reverse } from "@/components/sections/Reverse";
import { Marquee } from "@/components/sections/Marquee";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Personas } from "@/components/sections/Personas";
import { Why } from "@/components/sections/Why";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { EarlyAccess } from "@/components/sections/EarlyAccess";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <Reverse />
      <Marquee />
      <HowItWorks />
      <Personas />
      <Why />
      <Pricing />
      <Faq />
      <EarlyAccess />
    </>
  );
}
