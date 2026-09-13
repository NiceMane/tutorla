"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Comment, Post } from "@/lib/domain";
import { Avatar } from "@/components/app/Avatar";
import { Collapse } from "@/components/ui/Collapse";
import { Reactions } from "./Reactions";
import { CommentThread } from "./CommentThread";
import { ReportDialog } from "@/components/app/ReportDialog";
import { TimeAgo } from "@/components/ui/Time";

export function PostCard({
  post, meId, examName, comments, onToggleComments, onReact, onBookmark,
  onDelete, onEdit, onComment, onDeleteComment, onReactComment, index = 0, fresh = false,
}: {
  post: Post;
  index?: number;
  fresh?: boolean;
  meId: string | null;
  examName: string | null;
  comments: Comment[] | undefined;
  onToggleComments: () => void;
  onReact: (emoji: string) => void;
  onBookmark: () => void;
  onDelete: () => void;
  onEdit: (body: string) => Promise<void>;
  onComment: (parentId: string | null, body: string, gifUrl: string | null) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  onReactComment: (id: string, emoji: string) => Promise<void>;
}) {
  const t = useTranslations("app.feed");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const mine = meId === post.authorId;
  const handle = post.author?.handle;

  return (
    <li
      style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
      className={`card p-4 transition-colors duration-300 ${fresh ? "anim-flash border-primary/50" : ""}`}
    >
      <div className="flex gap-3">
        {handle ? (
          <Link href={`/app/profil/${handle}` as "/app"} aria-label={post.author?.displayName ?? handle}>
            <Avatar profile={post.author} size="md" />
          </Link>
        ) : (
          <Avatar profile={post.author} size="md" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            {handle ? (
              <Link href={`/app/profil/${handle}` as "/app"} className="font-semibold hover:text-primary">
                {post.author?.displayName || `@${handle}`}
              </Link>
            ) : (
              <span className="font-semibold">{post.author?.displayName || "—"}</span>
            )}
            {examName && <span className="chip text-[11.5px]">{examName}</span>}
            <TimeAgo iso={post.createdAt} className="meta text-[12.5px]" />
            {post.editedAt && <span className="meta text-[12px]">· {tc("edit").toLowerCase()}</span>}
          </div>

          {editing ? (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={2000}
                className="w-full resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button type="button" onClick={async () => { await onEdit(draft.trim()); setEditing(false); }}
                  disabled={!draft.trim()} className="btn btn-primary h-8 px-3 text-[13px] disabled:opacity-50">{tc("save")}</button>
                <button type="button" onClick={() => { setDraft(post.body); setEditing(false); }}
                  className="btn btn-ghost h-8 px-3 text-[13px]">{tc("cancel")}</button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-[1.55]">{post.body}</p>
          )}

          {post.media.length > 0 && (
            <div className={`mt-2.5 grid gap-2 ${post.media.length > 1 ? "grid-cols-2" : ""}`}>
              {post.media.map((m) => (
                <Image
                  key={m.id} src={m.url} alt="" width={640} height={480}
                  unoptimized={m.kind === "gif" || m.url.startsWith("data:")}
                  className="max-h-[380px] w-full rounded-[var(--radius-ui)] border border-line object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Reactions counts={post.reactions} mine={post.myReactions} onToggle={onReact} />
            <button type="button" onClick={onToggleComments} className="meta text-[13px] hover:text-primary">
              {post.commentCount} {post.commentCount === 1 ? t("comment") : t("comments")}
            </button>
            <button type="button" onClick={onBookmark} aria-pressed={post.bookmarked}
              className={`meta text-[13px] ${post.bookmarked ? "!text-primary" : "hover:text-primary"}`}>
              {post.bookmarked ? "★" : "☆"} {t("bookmark")}
            </button>
            <div className="ml-auto flex items-center gap-2">
              {mine && !editing && (
                <>
                  <button type="button" onClick={() => setEditing(true)} className="meta text-[13px] hover:text-primary">{tc("edit")}</button>
                  <button type="button" onClick={onDelete} className="meta text-[13px] hover:text-accent">{t("delete")}</button>
                </>
              )}
              {!mine && <ReportDialog target={{ postId: post.id }} label={t("report")} />}
            </div>
          </div>

          <Collapse open={!!comments}>
            {comments && (
              <div className="pt-3">
                <CommentThread
                  comments={comments} meId={meId}
                  onAdd={onComment} onDelete={onDeleteComment} onReact={onReactComment}
                />
              </div>
            )}
          </Collapse>
        </div>
      </div>
    </li>
  );
}
