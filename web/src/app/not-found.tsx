import Link from "next/link";
import { LOGO_LETTERS, LOGO_MARK, LOGO_UNDERSCORE, LOGO_VIEWBOX } from "@/lib/logoPaths";

/* Kök 404: dil bilinmediği anda (hiç eşleşmeyen yol) burası çalışır.
   [locale]/not-found.tsx ise dil içindeki 404'ler için.
   Çeviri bağlamı olmadığından iki dilde birden yazıyoruz. */
export default function RootNotFound() {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#F8F5EC", color: "#22271A", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 460 }}>
            <svg viewBox={LOGO_VIEWBOX} width={200} height={57} aria-label="Tutorla">
              <rect x={LOGO_MARK.x} y={LOGO_MARK.y} width={LOGO_MARK.w} height={LOGO_MARK.h} rx={LOGO_MARK.rx} fill="#1F6E85" />
              {LOGO_LETTERS.map((d, i) => <path key={i} d={d} fill="#22271A" />)}
              <path d={LOGO_UNDERSCORE} fill="#1F6E85" />
            </svg>
            <h1 style={{ marginTop: 28, fontSize: 28, letterSpacing: "-0.03em" }}>Sayfa bulunamadı</h1>
            <p style={{ marginTop: 10, color: "#4C513E", lineHeight: 1.5 }}>
              Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
              <br />
              <span style={{ opacity: 0.75 }}>This page may have moved, or never existed.</span>
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block", marginTop: 24, padding: "12px 20px", borderRadius: 6,
                background: "#1F6E85", color: "#fff", textDecoration: "none", fontWeight: 600,
              }}
            >
              Ana sayfa
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
