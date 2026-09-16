import createMiddleware from "next-intl/middleware";
import { NextRequest, type NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/* İçerik Güvenliği Politikası (CSP).
   Next kendi başlangıç script'lerini satır içi yazıyor; bunları 'unsafe-inline'
   ile serbest bırakmak yerine her istekte bir nonce üretiyoruz. Next, gelen
   isteğin CSP başlığındaki nonce'u görüp kendi script'lerine ekliyor; biz de
   next-themes'in satır içi script'ine aynı nonce'u veriyoruz.
   'strict-dynamic': nonce ile yüklenen script'in yüklediği parçalar da geçerli
   sayılır — Next'in parça yükleyicisi böyle çalışıyor. */
function csp(nonce: string): string {
  const sb = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ws = sb.replace(/^https:/, "wss:");
  const dev = process.env.NODE_ENV !== "production";

  return [
    "default-src 'self'",
    /* dev: Turbopack eval kullanıyor, yayında yok */
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${dev ? "'unsafe-eval'" : ""}`,
    /* style attribute'ları (style={{…}}) bu olmadan engellenir */
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob: ${sb} https://*.giphy.com https://*.tenor.com`,
    "media-src 'self' blob:",
    `connect-src 'self' ${sb} ${ws} https://api.giphy.com${dev ? " ws: http://localhost:*" : ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    /* tıklama hırsızlığı: sayfa hiçbir çerçeveye gömülemez */
    "frame-ancestors 'none'",
    "frame-src 'none'",
    dev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ")
    .replace(/\s+/g, " ");
}

export default function proxy(request: NextRequest): NextResponse {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const policy = csp(nonce);

  /* Nonce'u isteğe de koyuyoruz: hem Next kendi script'leri için okuyor
     hem de sayfa bileşeni headers() ile alıp next-themes'e veriyor. */
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);

  const response = intl(new NextRequest(request, { headers }));
  response.headers.set("content-security-policy", policy);
  return response;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
