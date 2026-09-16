"use client";
import { useTranslations } from "next-intl";
import type { Hit } from "./useSearchResults";
import { Avatar } from "@/components/app/Avatar";
import { NavIcon } from "@/components/app/NavIcon";

/* Tek bir sonuç satırı — palette ve tam sayfa aynı görünümü paylaşıyor. */
export function ResultRow({
  hit, selected, onPick, onHover, index = 0,
}: {
  hit: Hit;
  selected?: boolean;
  onPick: () => void;
  onHover?: () => void;
  index?: number;
}) {
  const t = useTranslations("app.search");
  const icon = () => {
    if (hit.kind === "person") return <Avatar profile={hit.profile} size="sm" className="!size-7" />;
    if (hit.kind === "post") return <NavIcon name="feed" className="text-ink-3" />;
    if (hit.kind === "exam") return <NavIcon name="lessons" className="text-ink-3" />;
    return <NavIcon name="socratic" className="text-ink-3" />;
  };

  return (
    <button
      type="button"
      onClick={onPick}
      onMouseMove={onHover}
      data-secili={selected ? "1" : undefined}
      style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
      className={`flex w-full items-center gap-3 rounded-[var(--radius-ui)] px-3 py-2.5 text-left transition-[background-color,padding] duration-200 hover:pl-4 ${
        selected ? "bg-surface pl-4" : "hover:bg-surface"
      }`}
    >
      <span className="grid size-7 shrink-0 place-items-center">{icon()}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium">{hit.title}</span>
        {hit.sub && <span className="meta block truncate text-[12.5px]">{hit.sub}</span>}
      </span>
      <span className="meta shrink-0 text-[11.5px] uppercase tracking-wide">{t(`kind.${hit.kind}`)}</span>
    </button>
  );
}
