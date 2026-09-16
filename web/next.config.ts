import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/* next/image, kaynak alan adını tanımıyorsa render sırasında hata fırlatıyor —
   yüklenen ilk profil fotoğrafı bütün sayfayı hata ekranına düşürüyordu.
   Depolama alan adı ortam değişkeninden türetiliyor ki proje değişince
   yapılandırmayı elle güncellemek gerekmesin. */
const storageHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

/* CSP dışındaki güvenlik başlıkları — bunlar isteğe göre değişmiyor,
   bu yüzden proxy yerine burada. */
const GUVENLIK_BASLIKLARI = [
  /* Sunucu yazılımını söylemeye gerek yok */
  { key: "X-Content-Type-Options", value: "nosniff" },
  /* frame-ancestors'ın eski tarayıcılardaki karşılığı */
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* Kamera profil fotoğrafı için gerekli; gerisi kapalı */
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  /* Tarayıcı bu alan adına bir daha asla http ile gitmesin (2 yıl) */
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  /* Kaynaklarımız başka sayfalarca gömülemesin */
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /* "X-Powered-By: Next.js" gereksiz bilgi veriyor */
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: GUVENLIK_BASLIKLARI }];
  },
  images: {
    remotePatterns: [
      ...(storageHost
        ? ([
            { protocol: "https" as const, hostname: storageHost, pathname: "/storage/v1/object/public/**" },
            { protocol: "https" as const, hostname: storageHost, pathname: "/storage/v1/object/sign/**" },
          ])
        : []),
      /* GIF sağlayıcıları: görseller optimize edilmeden geçiyor ama alan adı
         yine de tanımlı olmak zorunda. */
      { protocol: "https", hostname: "*.giphy.com" },
      { protocol: "https", hostname: "*.tenor.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
