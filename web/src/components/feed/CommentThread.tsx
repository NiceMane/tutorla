"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Comment } from "@/lib/domain";
import { Reactions } from "./Reactions";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { Popover } from "./Popover";
import { Collapse } from "@/components/ui/Collapse";
import { TimeAgo } from "@/components/ui/Time";

function Avatar({ emoji }: { emoji: string }) {
  return <span className="grid size-8 shrink-0 place-items-center rounded-[30%] border border-line bg-surface text-[15px]" aria-hidden="true">{emoji}</span>;
}

function CommentBox({
  onSend, placeholder, autoFocus = false,
}: {
  onSend: (body: string, gifUrl: string | null) => Promise<void>;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations("app.feed");
  const [body, setBody] = useState("");
  const [gif, setGif] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    const v = body.trim();
    if ((!v && !gif) || busy) return;
    setBusy(true);
    try {
      await onSend(v || "🙂", gif);
      setBody("");
      setGif(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-ui)] border border-line-2 bg-paper p-2">
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={2} autoFocus={autoFocus}
        placeholder={placeholder} disabled={busy}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        className="w-full resize-none bg-transparent px-1 text-[14px] outline-none placeholder:text-ink-3 disabled:opacity-60"
      />
      {gif && (
        <div className="relative mt-1 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gif} alt="" className="max-h-32 rounded-[var(--radius-ui)]" />
          <button type="button" onClick={() => setGif(null)} aria-label="×"
            className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-line bg-paper text-[13px]">×</button>
        </div>
      )}
      <div className="mt-1 flex items-center gap-1.5">
        <Popover button={({ toggle }) => (
          <button type="button" onClick={toggle} className="rounded-[var(--radius-ui)] px-2 py-1 text-[12.5px] font-semibold text-ink-2 hover:bg-surface">{t("emoji")}</button>
        )}>
          {(close) => <EmojiPicker onPick={(e) => setBody((b) => b + e)} onClose={close} />}
        </Popover>
        <Popover button={({ toggle }) => (
          <button type="button" onClick={toggle} className="rounded-[var(--radius-ui)] px-2 py-1 text-[12.5px] font-semibold text-ink-2 hover:bg-surface">{t("gif")}</button>
        )}>
          {(close) => <GifPicker onPick={setGif} onClose={close} />}
        </Popover>
        <button type="button" onClick={send} disabled={busy || (!body.trim() && !gif)}
          className="btn btn-primary ml-auto h-8 px-3 text-[13px] disabled:opacity-40">{t("send")}</button>
      </div>
    </div>
  );
}

export function CommentThread({
  comments, meId, onAdd, onDelete, onReact,
}: {
  comments: Comment[];
  meId: string | null;
  onAdd: (parentId: string | null, body: string, gifUrl: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReact: (commentId: string, emoji: string) => Promise<void>;
}) {
  const t = useTranslations("app.feed");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  const render = (c: Comment, depth: number, index = 0) => (
    <li
      key={c.id}
      style={{ "--i": Math.min(index, 6) } as React.CSSProperties}
      className={depth > 0 ? "ml-7 border-l border-line pl-3" : ""}
    >
      <div className="flex gap-2.5 py-2">
        <Avatar emoji={c.author?.avatarEmoji ?? "🦉"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-semibold">{c.author?.displayName || c.author?.handle || "—"}</span>
            <TimeAgo iso={c.createdAt} className="meta text-[12px]" />
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-[1.5] text-ink-2">{c.body}</p>
          {c.gifUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={c.gifUrl} alt="" className="mt-1.5 max-h-48 rounded-[var(--radius-ui)] border border-line" />
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Reactions counts={c.reactions} mine={c.myReactions} onToggle={(e) => onReact(c.id, e)} />
            {depth === 0 && (
              <button type="button" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="meta text-[12.5px] hover:text-primary">{t("reply")}</button>
            )}
            {meId === c.authorId && (
              <button type="button" onClick={() => onDelete(c.id)} className="meta text-[12.5px] hover:text-accent">{t("delete")}</button>
            )}
          </div>
          {depth === 0 && (
            <Collapse open={replyTo === c.id}>
              <div className="pt-2">
                <CommentBox
                  placeholder={t("commentPlaceholder")}
                  autoFocus
                  onSend={async (b, g) => { await onAdd(c.id, b, g); setReplyTo(null); }}
                />
              </div>
            </Collapse>
          )}
        </div>
      </div>
      {repliesOf(c.id).length > 0 && <ul className="stagger">{repliesOf(c.id).map((r, n) => render(r, depth + 1, n))}</ul>}
    </li>
  );

  return (
    <div className="border-t border-line pt-2">
      <ul className="stagger">{roots.map((c, n) => render(c, 0, n))}</ul>
      <div className="pt-2">
        <CommentBox placeholder={t("commentPlaceholder")} onSend={(b, g) => onAdd(null, b, g)} />
      </div>
    </div>
  );
}
