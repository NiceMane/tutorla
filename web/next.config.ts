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

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
