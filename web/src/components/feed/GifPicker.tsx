"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Gif = { id: string; url: string; preview: string; title: string };

/* Giphy anahtarı varsa arama yapar; yoksa bağlantı yapıştırmaya düşer.
   Anahtarı depoya gömmüyoruz — NEXT_PUBLIC_GIPHY_KEY ile veriliyor. */
const KEY = process.env.NEXT_PUBLIC_GIPHY_KEY;

export function GifPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose?: () => void }) {
  const t = useTranslations("app.feed");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!KEY) return;
    let alive = true;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const base = q.trim()
          ? `https://api.giphy.com/v1/gifs/search?api_key=${KEY}&limit=24&rating=g&q=${encodeURIComponent(q)}`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${KEY}&limit=24&rating=g`;
        const r = await fetch(base);
        const j = await r.json();
        if (!alive) return;
        setItems(
          (j.data ?? []).map((g: { id: string; title: string; images: Record<string, { url: string }> }) => ({
            id: g.id,
            title: g.title,
            url: g.images.downsized_medium?.url ?? g.images.original.url,
            preview: g.images.fixed_width_small?.url ?? g.images.original.url,
          })),
        );
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);
    return () => { alive = false; clearTimeout(id); };
  }, [q]);

  return (
    <div className="w-[min(360px,90vw)] rounded-[var(--radius-card)] border border-line bg-paper p-3 shadow-[0_18px_40px_-24px_rgba(34,39,26,.5)]">
      {KEY ? (
        <>
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("gifSearch")}
            className="h-9 w-full rounded-[var(--radius-ui)] border border-line-2 bg-surface px-3 text-[14px] outline-none focus:border-primary"
          />
          <div className="stagger mt-2 grid max-h-[260px] grid-cols-3 gap-1.5 overflow-y-auto">
            {loading && <span className="meta col-span-3 py-4 text-center text-[13px]">…</span>}
            {items.map((g, n) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={g.id} src={g.preview} alt={g.title} loading="lazy"
                onClick={() => { onPick(g.url); onClose?.(); }}
                style={{ "--i": Math.min(n, 8) } as React.CSSProperties}
                className="h-20 w-full cursor-pointer rounded-[var(--radius-ui)] object-cover transition-[opacity,transform,rotate,scale,translate] duration-200 hover:scale-[1.04] hover:opacity-85"
              />
            ))}
          </div>
        </>
      ) : (
        <p className="meta text-[13px] leading-[1.45]">{t("gifNoKey")}</p>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); if (url.trim()) { onPick(url.trim()); onClose?.(); } }}
        className="mt-2 flex gap-2"
      >
        <input
          value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("gifUrl")}
          className="h-9 min-w-0 flex-1 rounded-[var(--radius-ui)] border border-line-2 bg-surface px-3 text-[13.5px] outline-none focus:border-primary"
        />
        <button type="submit" disabled={!url.trim()} className="btn btn-ghost h-9 px-3 text-[13px] disabled:opacity-50">
          {t("send")}
        </button>
      </form>
    </div>
  );
}
