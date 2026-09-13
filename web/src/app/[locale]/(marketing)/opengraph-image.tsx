import { ImageResponse } from "next/og";
import { LOGO_LETTERS, LOGO_MARK, LOGO_UNDERSCORE, LOGO_VIEWBOX } from "@/lib/logoPaths";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tutorla — Yapay zekâya sen öğret";

/* Link paylaşıldığında çıkan önizleme. Marka renkleri: kum zemin, mürekkep
   kelime markası, derin mavi işaret ve alt tire. */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", background: "#F8F5EC", display: "flex",
          flexDirection: "column", justifyContent: "space-between", padding: 72,
        }}
      >
        <svg viewBox={LOGO_VIEWBOX} width={420} height={119}>
          <rect x={LOGO_MARK.x} y={LOGO_MARK.y} width={LOGO_MARK.w} height={LOGO_MARK.h} rx={LOGO_MARK.rx} fill="#1F6E85" />
          {LOGO_LETTERS.map((d, i) => <path key={i} d={d} fill="#22271A" />)}
          <path d={LOGO_UNDERSCORE} fill="#1F6E85" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, color: "#22271A", letterSpacing: -2.5, lineHeight: 1.05 }}>
            Yapay zekâya sen öğret.
          </div>
          <div style={{ fontSize: 32, color: "#4C513E", maxWidth: 900, lineHeight: 1.35 }}>
            Bir konuyu bilmenin testi, onu birine anlatabilmektir.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 26, color: "#1F6E85" }}>
          <span>YKS</span><span>·</span><span>TÜBİTAK</span><span>·</span><span>SAT</span>
        </div>
      </div>
    ),
    size,
  );
}
