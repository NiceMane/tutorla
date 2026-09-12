"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Comment, MediaKind, Post } from "@/lib/domain";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Collapse } from "@/components/ui/Collapse";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { Popover } from "./Popover";
import { Reactions } from "./Reactions";
import { CommentThread } from "./CommentThread";

const MAX_BYTES = 5 * 1024 * 1024;

export function Feed() {
  const t = useTranslations("app.feed");
  const { profile, exams } = useApp();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [ready, setReady] = useState(false);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<{ url: string; kind: MediaKind }[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, Comment[] | undefined>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  /* Olay işleyicilerinden çağrılır */
  const load = useCallback(async () => {
    const rows = await getRepo().listPosts();
    setPosts(rows);
    setReady(true);
  }, []);

  /* İlk yükleme — sökülme sonrası setState sızmasın */
  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await getRepo().listPosts();
      if (!alive) return;
      setPosts(rows);
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = body.trim();
    if ((!v && media.length === 0) || posting) return;
    setPosting(true);
    try {
      await getRepo().createPost({ body: v || "—", examId: profile?.examId ?? null, media });
      setBody("");
      setMedia([]);
      await load();
    } finally {
      setPosting(false);
    }
  }

  async function pickFile(file: File | null) {
    if (!file) return;
    if (file.size > MAX_BYTES) return setErr(t("tooBig"));
    setErr(null);
    setUploading(true);
    try {
      const up = await getRepo().uploadImage(file);
      setMedia((m) => [...m, up]);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "—");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleComments(postId: string) {
    if (openComments[postId]) {
      setOpenComments((o) => ({ ...o, [postId]: undefined }));
      return;
    }
    const list = await getRepo().listComments(postId);
    setOpenComments((o) => ({ ...o, [postId]: list }));
  }

  async function reloadComments(postId: string) {
    const list = await getRepo().listComments(postId);
    setOpenComments((o) => ({ ...o, [postId]: list }));
    await load();
  }

  const examName = (id: string | null) => exams.find((e) => e.id === id)?.name ?? null;

  return (
    <main className="mx-auto w-full max-w-[720px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.7rem,3.4vw,2.4rem)]">{t("title")}</h1>

      <form onSubmit={submit} className="card mt-6 p-4">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[30%] border border-line bg-surface text-[17px]" aria-hidden="true">
            {profile?.avatarEmoji ?? "🦉"}
          </span>
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000}
            placeholder={t("placeholder")} disabled={posting}
            className="min-w-0 flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-ink-3 disabled:opacity-60"
          />
        </div>

        {media.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {media.map((m, i) => (
              <div key={m.url + i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="h-28 rounded-[var(--radius-ui)] border border-line object-cover" />
                <button type="button" aria-label="×" onClick={() => setMedia((x) => x.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-line bg-paper text-[13px]">×</button>
              </div>
            ))}
          </div>
        )}
        {err && <p className="mt-2 text-[13.5px] text-accent">{err}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="rounded-[var(--radius-ui)] px-2.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface disabled:opacity-50">
            {uploading ? t("uploading") : t("photo")}
          </button>
          <Popover button={({ toggle }) => (
            <button type="button" onClick={toggle} className="rounded-[var(--radius-ui)] px-2.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface">{t("gif")}</button>
          )}>
            {(close) => <GifPicker onPick={(url) => setMedia((m) => [...m, { url, kind: "gif" }])} onClose={close} />}
          </Popover>
          <Popover button={({ toggle }) => (
            <button type="button" onClick={toggle} className="rounded-[var(--radius-ui)] px-2.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-surface">{t("emoji")}</button>
          )}>
            {(close) => <EmojiPicker onPick={(e) => setBody((b) => b + e)} onClose={close} />}
          </Popover>
          <button type="submit" disabled={posting || (!body.trim() && media.length === 0)}
            className="btn btn-primary ml-auto h-9 px-4 text-[14px] disabled:opacity-40">{t("post")}</button>
        </div>
      </form>

      {!ready ? (
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => <div key={i} className="card h-32 animate-pulse bg-surface-2/60" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="meta mt-8 text-center text-[15px]">{t("empty")}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {posts.map((p) => (
            <li key={p.id} className="card p-4">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[30%] border border-line bg-surface text-[17px]" aria-hidden="true">
                  {p.author?.avatarEmoji ?? "🦉"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold">{p.author?.displayName || p.author?.handle || "—"}</span>
                    {examName(p.examId) && <span className="chip text-[11.5px]">{examName(p.examId)}</span>}
                    <span className="meta text-[12.5px]">{new Date(p.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-[1.55]">{p.body}</p>
                  {p.media.length > 0 && (
                    <div className={`mt-2.5 grid gap-2 ${p.media.length > 1 ? "grid-cols-2" : ""}`}>
                      {p.media.map((m) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img key={m.id} src={m.url} alt="" className="max-h-[380px] w-full rounded-[var(--radius-ui)] border border-line object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Reactions
                      counts={p.reactions} mine={p.myReactions}
                      onToggle={async (e) => { await getRepo().toggleReaction({ postId: p.id }, e); await load(); }}
                    />
                    <button type="button" onClick={() => toggleComments(p.id)} className="meta text-[13px] hover:text-primary">
                      {p.commentCount} {p.commentCount === 1 ? t("comment") : t("comments")}
                    </button>
                    {user?.id === p.authorId && (
                      <button type="button" className="meta ml-auto text-[13px] hover:text-accent"
                        onClick={async () => { if (window.confirm(t("deleteConfirm"))) { await getRepo().deletePost(p.id); await load(); } }}>
                        {t("delete")}
                      </button>
                    )}
                  </div>
                  <Collapse open={!!openComments[p.id]}>
                    {openComments[p.id] && (
                      <div className="pt-3">
                        <CommentThread
                          comments={openComments[p.id]!}
                          meId={user?.id ?? null}
                          onAdd={async (parentId, b, g) => {
                            await getRepo().addComment({ postId: p.id, parentId, body: b, gifUrl: g });
                            await reloadComments(p.id);
                          }}
                          onDelete={async (id) => { await getRepo().deleteComment(id); await reloadComments(p.id); }}
                          onReact={async (id, e) => { await getRepo().toggleReaction({ commentId: id }, e); await reloadComments(p.id); }}
                        />
                      </div>
                    )}
                  </Collapse>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
