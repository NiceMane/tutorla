"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import type { Connection, DmMessage, DmThread } from "@/lib/domain";
import { Avatar } from "@/components/app/Avatar";
import { TimeAgo } from "@/components/ui/Time";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui/States";
import { EmojiPicker } from "@/components/feed/EmojiPicker";
import { Popover } from "@/components/feed/Popover";

/* Öğrenciler arası birebir mesajlaşma.
   Akış herkese açık; burası iki kişi arasında kalan kanal. Yeni mesajlar
   anlık geliyor (Supabase realtime), bağlantı kurulamazsa sohbet yine çalışır. */
export function Messages() {
  const t = useTranslations("app.messages");
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const wanted = params.get("k");

  const [threads, setThreads] = useState<DmThread[] | null>(null);
  /* Sol sütun iki sekme: süren sohbetler ve bağlantı listesi. */
  const [tab, setTab] = useState<"sohbet" | "baglanti">("sohbet");
  const [conns, setConns] = useState<Connection[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const feed = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setThreads(await getRepo().listThreads());
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "—");
      setThreads([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = getRepo();
      try {
        const [list, cs] = await Promise.all([repo.listThreads(), repo.listConnections()]);
        if (alive) { setThreads(list); setConns(cs); setErr(null); }
      } catch (e) {
        if (alive) { setErr(e instanceof Error ? e.message : "—"); setThreads([]); setConns([]); }
      }
    })();
    return () => { alive = false; };
  }, []);

  const yenileBaglantilar = useCallback(async () => {
    try {
      setConns(await getRepo().listConnections());
    } catch { /* liste kritik değil */ }
  }, []);

  /* Bağlantıyla sohbet: kanal yoksa açılır, varsa ona geçilir. */
  const sohbetAc = useCallback(async (userId: string) => {
    setBusyId(userId);
    try {
      const id = await getRepo().openThread(userId);
      setThreads(await getRepo().listThreads());
      setPicked(id);
      setTab("sohbet");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "—");
    } finally {
      setBusyId(null);
    }
  }, []);

  /* Açık kanal: tıklanan varsa o, yoksa adresten gelen (profildeki
     "mesaj gönder" düğmesi). Etkiyle senkronlamaya gerek yok. */
  const active = picked ?? wanted;

  /* Kanal açılınca mesajları çek, okundu işaretle, akışa abone ol */
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const repo = getRepo();
    (async () => {
      setMessages(null);
      try {
        const list = await repo.listMessages(active);
        if (!alive) return;
        setMessages(list);
        await repo.markThreadRead(active);
        setThreads((ts) => ts?.map((x) => (x.id === active ? { ...x, unread: 0 } : x)) ?? ts);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "—");
      }
    })();

    const stop = repo.subscribeMessages(active, (m) => {
      setMessages((list) => (list && !list.some((x) => x.id === m.id) ? [...list, m] : list));
      void repo.markThreadRead(active);
    });
    return () => { alive = false; stop(); };
  }, [active]);

  /* Yeni mesajda aşağı kay */
  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  const current = threads?.find((x) => x.id === active) ?? null;

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !active || sending) return;
    setSending(true);
    /* İyimser: mesaj hemen görünür, sunucu onaylayınca gerçeğiyle değişir. */
    const temp: DmMessage = {
      id: `gecici-${Date.now()}`, threadId: active, senderId: user?.id ?? "",
      body, createdAt: new Date().toISOString(), pending: true,
    };
    setMessages((list) => [...(list ?? []), temp]);
    setDraft("");
    try {
      const saved = await getRepo().sendMessage(active, body);
      setMessages((list) => (list ?? []).map((m) => (m.id === temp.id ? saved : m)));
      setThreads((ts) =>
        ts?.map((x) => (x.id === active ? { ...x, lastMessage: body, lastMessageAt: saved.createdAt } : x))
          .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1)) ?? ts,
      );
    } catch (e2) {
      setMessages((list) => (list ?? []).filter((m) => m.id !== temp.id));
      setDraft(body);
      setErr(e2 instanceof Error ? e2.message : "—");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-[clamp(14px,3vw,28px)] py-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[clamp(1.7rem,3.4vw,2.4rem)]">{t("title")}</h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* sol sütun: sohbetler / bağlantılar */}
        <section className={`flex-col gap-3 ${active ? "hidden lg:flex" : "flex"}`}>
          <div className="flex gap-1.5" role="tablist">
            {(["sohbet", "baglanti"] as const).map((k) => (
              <button
                key={k} type="button" role="tab" aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-[var(--radius-ui)] px-3 py-1.5 text-[13.5px] font-semibold transition-[background-color,color,rotate,scale,translate] duration-200 active:scale-95 ${
                  tab === k ? "bg-primary text-on-primary" : "text-ink-2 hover:bg-surface"
                }`}
              >
                {k === "sohbet" ? t("chats") : t("connections")}
                {k === "baglanti" && (conns?.some((c) => c.status === "beklemede" && !c.outgoing) ?? false) && (
                  <span className="anim-pop ml-1.5 inline-grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {conns!.filter((c) => c.status === "beklemede" && !c.outgoing).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "baglanti" ? (
            conns === null ? (
              <SkeletonList count={3} height="h-16" />
            ) : conns.length === 0 ? (
              <EmptyState title={t("noConnections")} body={t("noConnectionsHint")} />
            ) : (
              <ul className="stagger flex flex-col gap-2">
                {[...conns]
                  .sort((a, b) => Number(b.status === "beklemede" && !b.outgoing) - Number(a.status === "beklemede" && !a.outgoing))
                  .map((c, i) => {
                    const gelen = c.status === "beklemede" && !c.outgoing;
                    return (
                      <li key={c.person.id} style={{ "--i": i } as React.CSSProperties}
                          className={`card flex flex-col gap-2.5 px-3.5 py-3 ${gelen ? "border-primary/50" : ""}`}>
                        <Link href={`/app/profil/${c.person.handle ?? ""}` as "/app"} className="flex min-w-0 items-center gap-3">
                          <Avatar profile={c.person} size="md" />
                          <span className="min-w-0">
                            <b className="block truncate text-[14.5px] font-semibold">
                              {c.person.displayName || (c.person.handle ? `@${c.person.handle}` : "—")}
                            </b>
                            {c.status === "beklemede" && (
                              <span className="meta block text-[12px]">{gelen ? t("incoming") : t("pendingOut")}</span>
                            )}
                          </span>
                        </Link>
                        {gelen ? (
                          <span className="flex gap-1.5">
                            <button
                              type="button" disabled={busyId === c.person.id}
                              onClick={async () => {
                                setBusyId(c.person.id);
                                try { await getRepo().acceptConnection(c.person.id); await yenileBaglantilar(); }
                                finally { setBusyId(null); }
                              }}
                              className="btn btn-primary h-8 px-3 text-[13px] disabled:opacity-50"
                            >{t("accept")}</button>
                            <button
                              type="button" disabled={busyId === c.person.id}
                              onClick={async () => {
                                setBusyId(c.person.id);
                                try { await getRepo().removeConnection(c.person.id); await yenileBaglantilar(); }
                                finally { setBusyId(null); }
                              }}
                              className="btn btn-ghost h-8 px-3 text-[13px] disabled:opacity-50"
                            >{t("reject")}</button>
                          </span>
                        ) : c.status === "kabul" ? (
                          <button
                            type="button" disabled={busyId === c.person.id}
                            onClick={() => void sohbetAc(c.person.id)}
                            className="btn btn-ghost h-8 self-start px-3 text-[13px] disabled:opacity-50"
                          >{t("startChat")}</button>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            )
          ) : threads === null ? (
            <SkeletonList count={4} height="h-16" />
          ) : threads.length === 0 ? (
            <EmptyState title={t("empty")} body={t("emptyHint")} />
          ) : (
            <ul className="stagger flex flex-col gap-2">
              {threads.map((th, i) => (
                <li key={th.id} style={{ "--i": i } as React.CSSProperties}>
                  <button
                    type="button"
                    onClick={() => setPicked(th.id)}
                    aria-current={th.id === active ? "true" : undefined}
                    className={`card lift flex w-full items-center gap-3 px-3.5 py-3 text-left ${
                      th.id === active ? "border-primary" : ""
                    }`}
                  >
                    <Avatar profile={th.other} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <b className="truncate text-[14.5px] font-semibold">
                          {th.other?.displayName || (th.other?.handle ? `@${th.other.handle}` : "—")}
                        </b>
                        <TimeAgo iso={th.lastMessageAt} className="meta ml-auto shrink-0 text-[11.5px]" />
                      </span>
                      <span className="meta mt-0.5 block truncate text-[13px]">{th.lastMessage ?? t("noMessages")}</span>
                    </span>
                    {th.unread > 0 && (
                      <span className="anim-pop grid min-w-[20px] shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white tabular-nums">
                        {th.unread > 9 ? "9+" : th.unread}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* sohbet */}
        <section className={`card min-h-[60dvh] flex-col ${active ? "flex" : "hidden lg:flex"}`}>
          {!active ? (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <p className="meta max-w-[32ch] text-[14px]">{t("pick")}</p>
            </div>
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setPicked(null);
                    /* Adresten gelen kanal varsa onu da bırak, yoksa geri tuşu
                       aynı sohbete geri düşüyor. */
                    if (wanted) router.replace("/app/mesajlar" as "/app");
                  }}
                  className="meta text-[13px] hover:text-ink lg:hidden" aria-label={t("back")}
                >
                  ←
                </button>
                <Avatar profile={current?.other ?? null} size="sm" />
                {current?.other?.handle ? (
                  <Link href={`/app/profil/${current.other.handle}` as "/app"} className="font-semibold hover:text-primary">
                    {current.other.displayName || `@${current.other.handle}`}
                  </Link>
                ) : (
                  <span className="font-semibold">{current?.other?.displayName ?? "—"}</span>
                )}
              </header>

              <div ref={feed} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
                {messages === null ? (
                  <SkeletonList count={3} height="h-10" />
                ) : messages.length === 0 ? (
                  <p className="meta m-auto max-w-[28ch] text-center text-[13.5px]">{t("firstMessage")}</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex max-w-[78%] flex-col gap-0.5 ${mine ? "anim-slide-left self-end items-end" : "anim-slide-right self-start"}`}
                      >
                        <span
                          className={`whitespace-pre-wrap break-words rounded-[10px] px-3.5 py-2 text-[14.5px] leading-[1.5] ${
                            mine ? "bg-primary text-on-primary" : "border border-line bg-surface-2"
                          } ${m.pending ? "opacity-60" : ""}`}
                        >
                          {m.body}
                        </span>
                        <TimeAgo iso={m.createdAt} className="meta text-[11.5px]" />
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t border-line px-3 py-3">
                <Popover button={({ toggle }) => (
                  <button type="button" onClick={toggle} aria-label={t("emoji")}
                    className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-ui)] text-ink-2 transition-colors hover:bg-surface">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" strokeLinecap="round" />
                      <circle cx="9" cy="10" r=".9" fill="currentColor" /><circle cx="15" cy="10" r=".9" fill="currentColor" />
                    </svg>
                  </button>
                )}>
                  {(close) => <EmojiPicker onPick={(e2) => setDraft((b) => b + e2)} onClose={close} />}
                </Popover>
                <textarea
                  value={draft}
                  onChange={(e2) => setDraft(e2.target.value)}
                  onKeyDown={(e2) => {
                    if (e2.key === "Enter" && !e2.shiftKey) { e2.preventDefault(); void send(); }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={t("placeholder")}
                  className="max-h-32 min-h-[38px] flex-1 resize-y rounded-[var(--radius-ui)] border border-line-2 bg-paper px-3 py-2 text-[14.5px] outline-none focus:border-primary"
                />
                <button type="submit" disabled={!draft.trim() || sending}
                  className="btn btn-primary h-9 shrink-0 px-4 text-[13.5px] disabled:opacity-40">
                  {t("send")}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {err && <div className="mt-5"><ErrorState message={err} onRetry={() => void load()} /></div>}
    </main>
  );
}
