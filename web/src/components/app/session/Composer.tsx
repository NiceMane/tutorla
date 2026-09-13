"use client";
import { useTranslations } from "next-intl";

/* Yazma alanı. Konuş / tahta / fotoğraf kanalları bilerek pasif: arayüzde
   duruyorlar ama "yakında" diyorlar — var gibi görünüp çalışmamaları kötü olurdu. */
export function Composer({
  draft, setDraft, thinking, sendErr, onSend,
}: {
  draft: string;
  setDraft: (v: string) => void;
  thinking: boolean;
  sendErr: string | null;
  onSend: (retryText?: string) => void;
}) {
  const t = useTranslations("app.session");
  const tc = useTranslations("common");

  return (
    <div className="shrink-0 border-t border-line px-[clamp(12px,2.5vw,20px)] py-3">
      {sendErr && (
        <div className="anim-fade-in mb-2 flex flex-wrap items-center gap-3 rounded-[var(--radius-ui)] border border-accent bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-3 py-2 text-[13px] text-accent" role="alert">
          <span className="min-w-0 flex-1">{sendErr}</span>
          <button type="button" onClick={() => onSend(draft)} className="font-semibold underline underline-offset-2">
            {tc("retry")}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 rounded-[8px] border border-line-2 bg-paper px-3 py-2.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={2}
          placeholder={t("placeholder")}
          disabled={thinking}
          className="w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-ink-3 disabled:opacity-60"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <b className="rounded-[var(--radius-ui)] border border-primary px-2 py-0.5 text-[12px] font-semibold text-primary">{t("tools.write")}</b>
          {(["talk", "board", "photo"] as const).map((k) => (
            <b key={k} title={t("soon")} className="cursor-not-allowed rounded-[var(--radius-ui)] border border-line px-2 py-0.5 text-[12px] font-semibold text-ink-3">
              {t(`tools.${k}`)}
            </b>
          ))}
          <button type="button" onClick={() => onSend()} disabled={!draft.trim() || thinking} className="btn btn-primary ml-auto h-8 px-3 text-[13px] disabled:opacity-40">
            ⏎ {t("send")}
          </button>
        </div>
      </div>
    </div>
  );
}
