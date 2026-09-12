"use client";
import { useState } from "react";

/* Küçük ve bağımlılıksız. Tam emoji kütüphanesi ~1 MB; burada ihtiyaç
   duyulan kadarı elde tutuluyor. */
const GROUPS: [string, string[]][] = [
  ["yüz", ["😀","😅","😂","🙂","😉","😍","🤔","😐","😴","😭","😤","😮","🙃","😬","🥲","🤯"]],
  ["el", ["👍","👎","👏","🙌","🤝","💪","✌️","🤞","👀","🫡","🙏","🤲"]],
  ["okul", ["📚","✏️","📝","📐","📏","🧮","🔬","🧪","🧠","💡","🎯","⏳","📈","🏆","✅","❌"]],
  ["duygu", ["❤️","🔥","✨","🎉","💯","😎","🥳","😇","🫶","💤","🌱","☕"]],
];

export function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose?: () => void }) {
  const [group, setGroup] = useState(0);
  return (
    <div className="w-[min(320px,88vw)] rounded-[var(--radius-card)] border border-line bg-paper p-3 shadow-[0_18px_40px_-24px_rgba(34,39,26,.5)]">
      <div className="flex gap-1.5">
        {GROUPS.map(([name], i) => (
          <button
            key={name}
            type="button"
            onClick={() => setGroup(i)}
            className={`rounded-[var(--radius-ui)] px-2 py-1 text-[12.5px] font-semibold transition-colors ${
              i === group ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-surface"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-8 gap-1">
        {GROUPS[group][1].map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => { onPick(e); onClose?.(); }}
            className="grid h-8 place-items-center rounded-[var(--radius-ui)] text-[18px] transition-transform hover:scale-110 hover:bg-surface"
            aria-label={e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
