import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tutorla.vercel.app";

/* Yalnızca herkese açık sayfalar. /app altı giriş ister, dizine girmemeli. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? BASE : `${BASE}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, l === routing.defaultLocale ? BASE : `${BASE}/${l}`]),
      ),
    },
  }));
}
