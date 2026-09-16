"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadImage } from "@/lib/image";

/* Kameradan kare alma. İzin verilmezse ya da cihazda kamera yoksa sessizce
   bozulmuyor: ne olduğunu söyleyip dosya seçmeye geri dönüyor. */
export function CameraCapture({
  onCapture, onUnavailable,
}: {
  onCapture: (img: HTMLImageElement, mirrored: boolean) => void;
  onUnavailable?: () => void;
}) {
  const t = useTranslations("media");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [many, setMany] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [flash, setFlash] = useState(false);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      setLive(false);
      stop();
      if (!navigator.mediaDevices?.getUserMedia) {
        setErr(t("noCamera"));
        onUnavailable?.();
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (!alive) { s.getTracks().forEach((tr) => tr.stop()); return; }
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {});
        }
        setLive(true);
        /* Ön/arka seçeneği ancak birden fazla kamera varsa anlamlı. */
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (alive) setMany(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (e) {
        if (!alive) return;
        const name = e instanceof DOMException ? e.name : "";
        setErr(name === "NotAllowedError" ? t("denied") : t("noCamera"));
        onUnavailable?.();
      }
    })();
    return () => { alive = false; stop(); };
  }, [facing, stop, t, onUnavailable]);

  async function shoot() {
    const v = video.current;
    if (!v || !live) return;
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    /* Ön kamerada önizleme aynalı; kullanıcı ne gördüyse onu alsın diye
       aynalamayı kırpıcıya taşıyoruz (kare ham kalıyor). */
    const img = await loadImage(c.toDataURL("image/png"));
    stop();
    onCapture(img, facing === "user");
  }

  if (err) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-[14px] text-accent" role="alert">{err}</p>
        <p className="meta max-w-[38ch] text-[12.5px]">{t("deniedHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-deep">
        <video
          ref={video}
          playsInline
          muted
          className={`block h-[300px] w-[300px] object-cover transition-opacity duration-300 ${live ? "opacity-100" : "opacity-0"} ${facing === "user" ? "-scale-x-100" : ""}`}
        />
        {!live && <span className="meta absolute inset-0 grid place-items-center text-[13px] !text-deep-mute">{t("opening")}</span>}
        {/* deklanşör parlaması */}
        <span className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 ${flash ? "opacity-80" : "opacity-0"}`} />
        <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] ring-1 ring-inset ring-white/15" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button" onClick={shoot} disabled={!live}
          className="btn btn-primary h-10 gap-2 px-4 text-[14px] transition-[transform,rotate,scale,translate] active:scale-95 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
          {t("shoot")}
        </button>
        {many && (
          <button type="button" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className="btn btn-ghost h-10 text-[13.5px]">
            {t("switchCamera")}
          </button>
        )}
      </div>
    </div>
  );
}
