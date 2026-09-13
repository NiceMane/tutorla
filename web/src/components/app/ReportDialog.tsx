"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getRepo } from "@/lib/repo";
import type { ReportReason } from "@/lib/domain";

const REASONS: ReportReason[] = ["spam", "taciz", "uygunsuz", "yanlis_bilgi", "diger"];

/* Şikâyet kutusu: gönderi, yorum ve profil için ortak. */
export function ReportDialog({
  target, label,
}: {
  target: { postId?: string; commentId?: string; profileId?: string };
  label?: string;
}) {
  const t = useTranslations("app.report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await getRepo().report(target, reason, note.trim() || null);
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setNote(""); }, 1600);
    } finally { setBusy(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={label ? "meta text-[12.5px] hover:text-accent" : "btn btn-ghost h-9 text-[13.5px]"}>
        {label ?? t("title")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_oklab,var(--ink)_45%,transparent)] p-5 anim-fade-in"
          role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="card w-full max-w-[400px] p-5 anim-fade-up">
            {sent ? (
              <p className="py-4 text-center font-medium text-primary">{t("sent")}</p>
            ) : (
              <form onSubmit={send} className="flex flex-col gap-4">
                <h2 className="text-[1.15rem]">{t("title")}</h2>
                <label className="flex flex-col gap-1.5">
                  <span className="meta text-[13px]">{t("reason")}</span>
                  <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="h-10 rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 outline-none focus:border-primary">
                    {REASONS.map((r) => <option key={r} value={r}>{t(`reasons.${r}`)}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="meta text-[13px]">{t("note")}</span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={400}
                    className="resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 outline-none focus:border-primary" />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost h-9 text-[13.5px]">{t("cancel")}</button>
                  <button type="submit" disabled={busy} className="btn btn-primary h-9 text-[13.5px] disabled:opacity-60">{t("send")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
