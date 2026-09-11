import { useTranslations } from "next-intl";

function Track({ items, hidden = false }: { items: string[]; hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden}>
      {items.map((s, i) => (
        <span key={i} className="flex items-center whitespace-nowrap font-serif text-[clamp(2.4rem,7vw,6rem)] font-light italic text-ink">
          {s}<span className="mx-[0.35em] text-primary">…</span>
        </span>
      ))}
    </div>
  );
}

/* Palmo'daki "KEEP SIPPING.." bandının karşılığı — giriş kutusundaki cümle */
export function Marquee() {
  const t = useTranslations("marquee");
  const items = Array.from({ length: 6 }, () => t("text"));
  return (
    <div className="overflow-hidden border-y border-line bg-surface py-5" role="marquee">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <Track items={items} />
        <Track items={items} hidden />
      </div>
    </div>
  );
}
