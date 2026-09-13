"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Comment, MediaKind, Post } from "@/lib/domain";
import type { FeedScope } from "@/lib/repo/social";
import { getRepo } from "@/lib/repo";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { Popover } from "./Popover";
import { PostCard } from "./PostCard";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/States";

const MAX_BYTES = 5 * 1024 * 1024;

export function Feed() {
  const t = useTranslations("app.feed");
  const tc = useTranslations("common");
  const { profile, exams } = useApp();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [ready, setReady] = useState(false);
  const [scope, setScope] = useState<FeedScope>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<{ url: string; kind: MediaKind }[]>([]);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, Comment[] | undefined>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  /* Olay işleyicilerinden çağrılır: baştan yükler */
  const load = useCallback(async (sc: FeedScope = scope) => {
    setLoadErr(null);
    try {
      const page = await getRepo().listFeed(sc, null);
      setPosts(page.posts);
      setCursor(page.nextCursor);
      setMore(Boolean(page.nextCursor));
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "—");
    } finally {
      setReady(true);
    }
  }, [scope]);

  /* Sonraki sayfa — imleçle, sayfa numarasıyla değil */
  const loadMore = useCallback(async () => {
    if (!cursor) return;
    try {
      const page = await getRepo().listFeed(scope, cursor);
      setPosts((p) => [...p, ...page.posts]);
      setCursor(page.nextCursor);
      setMore(Boolean(page.nextCursor));
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "—");
    }
  }, [cursor, scope]);

  /* İlk yükleme ve kapsam değişimi */
  useEffect(() => {
    let alive = true;
    (async () => {
      setReady(false);
      try {
        const page = await getRepo().listFeed(scope, null);
        if (!alive) return;
        setPosts(page.posts);
        setCursor(page.nextCursor);
        setMore(Boolean(page.nextCursor));
      } catch (e) {
        if (alive) setLoadErr(e instanceof Error ? e.message : "—");
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [scope]);

  /* Tepki ve yer imi: iyimser güncelleme. Önce ekranda değişir, sonra sunucuya
     gider; hata olursa geri alınır. Eskiden her tık tüm akışı yeniden yüklüyordu. */
  const optimistic = useCallback(async (id: string, patch: (p: Post) => Post, run: () => Promise<unknown>) => {
    const before = posts;
    setPosts((list) => list.map((p) => (p.id === id ? patch(p) : p)));
    try {
      await run();
    } catch {
      setPosts(before);
    }
  }, [posts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = body.trim();
    if ((!v && media.length === 0) || posting) return;
    setPosting(true);
    try {
      await getRepo().createPost({ body: v || "—", examId: profile?.examId ?? null, media });
      setBody("");
      setMedia([]);
      setErr(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "—");
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
    /* Tüm akışı yeniden yüklemek yerine yalnızca sayacı düzelt. */
    setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, commentCount: list.length } : p)));
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

      <div className="mt-6 flex gap-1.5" role="tablist">
        {(["all", "following", "bookmarks"] as FeedScope[]).map((sc) => (
          <button
            key={sc} type="button" role="tab" aria-selected={scope === sc}
            onClick={() => setScope(sc)}
            className={`rounded-[var(--radius-ui)] px-3 py-1.5 text-[13.5px] font-semibold transition-colors ${
              scope === sc ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-surface"
            }`}
          >
            {t(sc)}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="mt-6"><SkeletonList count={3} /></div>
      ) : loadErr ? (
        <div className="mt-6"><ErrorState message={loadErr} onRetry={() => load()} /></div>
      ) : posts.length === 0 ? (
        <div className="mt-6"><EmptyState title={t("empty")} /></div>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-4">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                meId={user?.id ?? null}
                examName={examName(p.examId)}
                comments={openComments[p.id]}
                onToggleComments={() => toggleComments(p.id)}
                onReact={(e) =>
                  optimistic(
                    p.id,
                    (x) => {
                      const on = x.myReactions.includes(e);
                      const n = (x.reactions[e] ?? 0) + (on ? -1 : 1);
                      const reactions = { ...x.reactions };
                      if (n > 0) reactions[e] = n; else delete reactions[e];
                      return { ...x, reactions, myReactions: on ? x.myReactions.filter((y) => y !== e) : [...x.myReactions, e] };
                    },
                    () => getRepo().toggleReaction({ postId: p.id }, e),
                  )
                }
                onBookmark={() =>
                  optimistic(p.id, (x) => ({ ...x, bookmarked: !x.bookmarked }), () => getRepo().toggleBookmark(p.id))
                }
                onDelete={async () => {
                  if (!window.confirm(t("deleteConfirm"))) return;
                  await getRepo().deletePost(p.id);
                  await load();
                }}
                onEdit={async (body) => {
                  await optimistic(p.id, (x) => ({ ...x, body, editedAt: new Date().toISOString() }), () => getRepo().updatePost(p.id, body));
                }}
                onComment={async (parentId, b, g) => {
                  await getRepo().addComment({ postId: p.id, parentId, body: b, gifUrl: g });
                  await reloadComments(p.id);
                }}
                onDeleteComment={async (id) => { await getRepo().deleteComment(id); await reloadComments(p.id); }}
                onReactComment={async (id, e) => { await getRepo().toggleReaction({ commentId: id }, e); await reloadComments(p.id); }}
              />
            ))}
          </ul>
          {more && (
            <div className="mt-5 flex justify-center">
              <button type="button" onClick={loadMore} className="btn btn-ghost">{tc("loadMore")}</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
