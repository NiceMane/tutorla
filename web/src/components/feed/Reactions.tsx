"use client";
import { useTranslations } from "next-intl";
import { EmojiPicker } from "./EmojiPicker";
import { Popover } from "./Popover";

const QUICK = ["👍", "❤️", "🔥", "🎯", "😂", "🤔"];

export function Reactions({
  counts, mine, onToggle,
}: {
  counts: Record<string, number>;
  mine: string[];
  onToggle: (emoji: string) => void;
}) {
  const t = useTranslations("app.feed");
  const shown = Object.entries(counts).filter(([, n]) => n > 0);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map(([emoji, n]) => {
        const on = mine.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            aria-pressed={on}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px active:scale-95 ${
              on ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-primary" : "border-line text-ink-2 hover:border-line-2"
            }`}
          >
            {/* Tepki verildiğinde emoji bir kez zıplasın. */}
            <span aria-hidden="true" className={on ? "anim-pop" : ""}>{emoji}</span>
            <span className="tabular-nums">{n}</span>
          </button>
        );
      })}
      <Popover
        button={({ toggle }) => (
          <button
            type="button" onClick={toggle} aria-label={t("emoji")}
            className="grid size-7 place-items-center rounded-full border border-line text-ink-3 transition-[color,border-color,transform] duration-200 hover:rotate-12 hover:border-primary hover:text-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" strokeLinecap="round" />
              <circle cx="9" cy="10" r=".8" fill="currentColor" /><circle cx="15" cy="10" r=".8" fill="currentColor" />
            </svg>
          </button>
        )}
      >
        {(close) => (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1 rounded-[var(--radius-card)] border border-line bg-paper p-1.5">
              {QUICK.map((e) => (
                <button key={e} type="button" onClick={() => { onToggle(e); close(); }}
                  className="grid size-8 place-items-center rounded-[var(--radius-ui)] text-[17px] transition-transform duration-150 hover:scale-110 hover:bg-surface active:scale-95">{e}</button>
              ))}
            </div>
            <EmojiPicker onPick={onToggle} onClose={close} />
          </div>
        )}
      </Popover>
    </div>
  );
}
