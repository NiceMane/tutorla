"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { canvasToFile } from "@/lib/image";

const PAD = 26;          // kırpma karesinin dışında görünen pay
const RADIUS_RATIO = 0.3; // Avatar bileşeniyle aynı köşe yuvarlaması

type Pointer = { id: number; x: number; y: number };

/* Kırpma tuvali. Önizleme ve çıktı AYNI çizim koduyla üretiliyor:
   ne görüyorsan o kaydediliyor, sürpriz yok.
   Sürükle (fare/dokunma), tekerlek ve iki parmakla yakınlaştır, 90° döndür. */
export function ImageCropper({
  img, mirrored = false, output = 512, onDone, busy = false,
}: {
  img: HTMLImageElement;
  mirrored?: boolean;
  output?: number;
  onDone: (file: File) => void;
  busy?: boolean;
}) {
  const t = useTranslations("media");
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointers = useRef<Pointer[]>([]);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const [side, setSide] = useState(300);      // kırpma karesinin ekrandaki kenarı
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  /* Kutu genişliğe göre büyüsün; telefonda da elverişli kalsın. */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSide(Math.max(200, Math.min(320, Math.round(w - PAD * 2))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const turned = rotation % 180 !== 0;
    const natW = turned ? img.naturalHeight : img.naturalWidth;
    const natH = turned ? img.naturalWidth : img.naturalHeight;
    const base = side / Math.min(natW, natH);   // kareyi tam dolduran ölçek
    const scale = base * zoom;
    return {
      scale,
      maxX: Math.max(0, (natW * scale - side) / 2),
      maxY: Math.max(0, (natH * scale - side) / 2),
    };
  }, [img, rotation, side, zoom]);

  const clamp = useCallback((o: { x: number; y: number }) => ({
    x: Math.max(-geometry.maxX, Math.min(geometry.maxX, o.x)),
    y: Math.max(-geometry.maxY, Math.min(geometry.maxY, o.y)),
  }), [geometry]);

  /* Yakınlaştırma ya da döndürme sınırları değiştirdiğinde kayma aralık dışında
     kalabilir. Etkiyle düzeltmek yerine kullanım anında kenetliyoruz: çizime de
     sürüklemeye de hep geçerli değer gidiyor. */
  const view = clamp(offset);

  /* Tek çizim fonksiyonu: hem önizleme hem çıktı buradan geçiyor. */
  const paint = useCallback((
    ctx: CanvasRenderingContext2D, boxSide: number, pad: number, k: number, withMask: boolean,
  ) => {
    const W = boxSide + pad * 2;
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.translate(W / 2 + view.x * k, W / 2 + view.y * k);
    ctx.rotate((rotation * Math.PI) / 180);
    if (mirrored) ctx.scale(-1, 1);
    const w = img.naturalWidth * geometry.scale * k;
    const h = img.naturalHeight * geometry.scale * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    if (!withMask) return;
    const r = boxSide * RADIUS_RATIO;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, W);
    if (ctx.roundRect) ctx.roundRect(pad, pad, boxSide, boxSide, r);
    else ctx.rect(pad, pad, boxSide, boxSide);
    ctx.fillStyle = "rgba(15,18,12,.55)";
    ctx.fill("evenodd");
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pad + 0.5, pad + 0.5, boxSide - 1, boxSide - 1, r);
    else ctx.rect(pad + 0.5, pad + 0.5, boxSide - 1, boxSide - 1);
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 1;
    ctx.stroke();
    /* üçte bir kılavuzları */
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    for (let i = 1; i < 3; i++) {
      const p = pad + (boxSide / 3) * i;
      ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, pad + boxSide); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(pad + boxSide, p); ctx.stroke();
    }
    ctx.restore();
  }, [geometry.scale, img, mirrored, view.x, view.y, rotation]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const W = side + PAD * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(W * dpr);
    el.height = Math.round(W * dpr);
    el.style.width = `${W}px`;
    el.style.height = `${W}px`;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, side, PAD, 1, true);
  }, [paint, side]);

  /* ---- sürükleme ve iki parmak ---- */
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const list = pointers.current;
    const idx = list.findIndex((p) => p.id === e.pointerId);
    if (idx === -1) return;
    const prev = list[idx];
    const next = { id: e.pointerId, x: e.clientX, y: e.clientY };
    list[idx] = next;

    if (list.length >= 2) {
      const [a, b] = list;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!pinch.current) pinch.current = { dist, zoom };
      else if (pinch.current.dist > 0) {
        setZoom(Math.max(1, Math.min(4, (pinch.current.zoom * dist) / pinch.current.dist)));
      }
      return;
    }
    setOffset(clamp({ x: view.x + (next.x - prev.x), y: view.y + (next.y - prev.y) }));
  }

  function endPointer(e: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current = pointers.current.filter((p) => p.id !== e.pointerId);
    if (pointers.current.length < 2) pinch.current = null;
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    setZoom((z) => Math.max(1, Math.min(4, z * (e.deltaY < 0 ? 1.08 : 0.93))));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 24 : 8;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setOffset(clamp({ x: view.x + dx, y: view.y + dy }));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault(); setZoom((z) => Math.min(4, z * 1.1));
    } else if (e.key === "-") {
      e.preventDefault(); setZoom((z) => Math.max(1, z / 1.1));
    }
  }

  async function apply() {
    const out = document.createElement("canvas");
    out.width = output;
    out.height = output;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const k = output / side;
    /* Çıktıda pay yok: aynı çizimi pad=0 ile, ölçeklenmiş olarak tekrarla. */
    paint(ctx, output, 0, k, false);
    onDone(await canvasToFile(out, "avatar"));
  }

  const reset = () => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); };

  return (
    <div ref={wrap} className="flex flex-col items-center gap-4">
      <canvas
        ref={canvas}
        role="img"
        tabIndex={0}
        aria-label={t("cropAria")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        className="cursor-grab touch-none rounded-[var(--radius-card)] bg-deep outline-none ring-primary/60 active:cursor-grabbing focus-visible:ring-2"
      />

      <div className="flex w-full max-w-[360px] flex-col gap-3">
        <label className="flex items-center gap-3">
          <span className="meta shrink-0 text-[12.5px]">{t("zoom")}</span>
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--primary)]"
            aria-label={t("zoom")}
          />
        </label>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} className="btn btn-ghost h-9 gap-1.5 text-[13.5px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
            </svg>
            {t("rotate")}
          </button>
          <button type="button" onClick={reset} className="btn btn-ghost h-9 text-[13.5px]">{t("reset")}</button>
          <button type="button" onClick={apply} disabled={busy} className="btn btn-primary h-9 text-[13.5px] disabled:opacity-60">
            {busy ? t("saving") : t("apply")}
          </button>
        </div>
        <p className="meta text-center text-[12.5px]">{t("cropHint")}</p>
      </div>
    </div>
  );
}
