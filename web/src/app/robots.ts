import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tutorla.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      /* Uygulama ve giriş dizine girmesin: içerik değil, kişisel alan. */
      { userAgent: "*", allow: "/", disallow: ["/app/", "/en/app/", "/giris", "/en/giris", "/sifre-yenile", "/en/sifre-yenile"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
