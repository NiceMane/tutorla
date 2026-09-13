"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useApp } from "@/lib/store";
import { getRepo, type SessionDetail } from "@/lib/repo";
import { getEngine } from "@/lib/engine";
import type { Concept, ConceptStatus, Gap, Message, Moment, MomentKind } from "@/lib/domain";
import { Wordmark } from "@/components/ui/Wordmark";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { UnderstandingMap } from "./UnderstandingMap";
import { Collapse } from "@/components/ui/Collapse";
import { MomentChip } from "./MomentChip";
import { TeachingEvidence } from "./TeachingEvidence";

export function SessionScreen({ sessionId }: { sessionId: string }) {
  const t = useTranslations("app.session");
  const tn = useTranslations("app.nav");
  const tc = useTranslations("common");
  const { ready, curriculum, personas, refresh } = useApp();
  const repo = useMemo(() => getRepo(), []);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const mode = detail?.session.mode ?? "teach";
  const engine = useMemo(() => getEngine(mode), [mode]);

  const [missing, setMissing] = useState(false);
  /* Taslağı ilk durumda oku: etkide setState yapmak cascading render'a yol açıyor. */
  const [draft, setDraft] = useState(() => {
    try {
      return window.localStorage.getItem(`tutorla-draft-${sessionId}`) ?? "";
    } catch {
      return "";
    }
  });
  const [thinking, setThinking] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const opened = useRef(false);
  const feed = useRef<HTMLDivElement>(null);

  const topic = detail ? curriculum.topics.find((x) => x.id === detail.session.topicId) ?? null : null;
  const subject = topic ? curriculum.subjects.find((x) => x.id === topic.subjectId) ?? null : null;
  const persona = detail ? personas.find((p) => p.code === detail.session.personaId) ?? null : null;
  const concepts: Concept[] = useMemo(
    () => (topic ? curriculum.concepts.filter((c) => c.topicId === topic.id) : []),
    [curriculum.concepts, topic],
  );

  /* Anlatarak kapatılan kavramlar: bir kez boşluk olup sonra oturanlar.
     Protégé effect'in üründeki izi — davranış anlarının ikizi, ikamesi değil. */
  const closedByTeaching = useMemo(
    () => new Set((detail?.states ?? []).filter((s) => s.status === "settled" && s.wasGap).map((s) => s.conceptId)),
    [detail?.states],
  );

  const stateMap = useMemo(() => {
    const m: Record<string, ConceptStatus> = {};
    for (const c of concepts) m[c.id] = "untouched";
    for (const s of detail?.states ?? []) m[s.conceptId] = s.status;
    return m;
  }, [concepts, detail?.states]);

  const settled = concepts.filter((c) => stateMap[c.id] === "settled").length;
  const percent = concepts.length ? Math.round((settled / concepts.length) * 100) : 0;
  const asked = (detail?.messages ?? []).filter((m) => m.role === "student").length;
  const momentCounts = useMemo(() => {
    const c: Partial<Record<MomentKind, number>> = {};
    for (const m of detail?.moments ?? []) c[m.kind] = (c[m.kind] ?? 0) + 1;
    return c;
  }, [detail?.moments]);
  const finished = detail?.session.status === "finished";

  /* Olay işleyicilerinden çağrılır (gönder / bitir) */
  const load = useCallback(async () => {
    const d = await repo.getSession(sessionId);
    if (!d) {
      setMissing(true);
      return null;
    }
    setDetail(d);
    return d;
  }, [repo, sessionId]);

  /* İlk yükleme — sökülme sonrası setState sızmasın diye iptal korumalı */
  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await repo.getSession(sessionId);
      if (!alive) return;
      if (d) setDetail(d);
      else setMissing(true);
    })();
    return () => {
      alive = false;
    };
  }, [repo, sessionId]);

  /* Boş seansı öğrencinin ilk sorusuyla aç (StrictMode'da iki kez çalışmasın) */
  useEffect(() => {
    if (!ready || !detail || !topic || opened.current) return;
    if (detail.messages.length > 0) return;
    opened.current = true;
    (async () => {
      const turn = await engine.open({
        topic, concepts, persona: detail.session.personaId, messages: [], states: stateMap, moments: [],
      });
      await repo.appendMessage(sessionId, "student", turn.reply);
      setTargetId(turn.targetConceptId);
      await load();
    })();
  }, [ready, detail, topic, concepts, stateMap, engine, repo, sessionId, load]);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [detail?.messages.length, thinking]);

  /* Yazılan metin kaybolmasın: sekme kapanır ya da sayfa yenilenirse geri gelsin. */
  const draftKey = `tutorla-draft-${sessionId}`;
  useEffect(() => {
    try {
      if (draft.trim()) window.localStorage.setItem(draftKey, draft);
      else window.localStorage.removeItem(draftKey);
    } catch { /* yoksay */ }
  }, [draft, draftKey]);

  async function send(retryText?: string) {
    const text = (retryText ?? draft).trim();
    if (!text || thinking || finished || !topic || !detail) return;
    setSendErr(null);
    if (!retryText) setDraft("");
    setThinking(true);
    try {
      const teacherMsg = await repo.appendMessage(sessionId, "teacher", text);
      const afterTeacher = await load();
      const turn = await engine.respond(
        {
          topic, concepts, persona: detail.session.personaId,
          messages: afterTeacher?.messages ?? [], states: stateMap,
          moments: (afterTeacher?.moments ?? []).map((m) => ({ conceptId: m.conceptId, kind: m.kind })),
        },
        text,
      );
      for (const u of turn.conceptUpdates) await repo.setConceptStatus(u.conceptId, u.status, sessionId);
      if (turn.moment) {
        await repo.addMoment(sessionId, teacherMsg.id, turn.moment.conceptId, turn.moment.kind, turn.moment.label);
      }
      const reply = await repo.appendMessage(sessionId, "student", turn.reply);
      if (turn.gap) await repo.addGap(sessionId, reply.id, turn.gap.conceptId, turn.gap.label);
      setTargetId(turn.targetConceptId);
      await load();
      await refresh();
      try { window.localStorage.removeItem(draftKey); } catch { /* yoksay */ }
    } catch (e) {
      /* Mesaj gidemedi: metni geri ver ve tekrar deneme sun.
         Eskiden sessizce kayboluyordu. */
      setSendErr(e instanceof Error ? e.message : "—");
      setDraft(text);
    } finally {
      setThinking(false);
    }
  }

  async function finish() {
    if (!topic || !detail) return;
    const note = await engine.note(
      {
        topic, concepts, persona: detail.session.personaId, messages: detail.messages, states: stateMap,
        moments: (detail.moments ?? []).map((m) => ({ conceptId: m.conceptId, kind: m.kind })),
      },
      (detail.moments ?? []).map((m) => m.kind),
    );
    await repo.finishSession(sessionId, note);
    await load();
    await refresh();
  }

  if (missing) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6 text-center">
        <div>
          <p className="text-ink-2">Seans bulunamadı.</p>
          <Link href="/app" className="btn btn-ghost mt-4">{tn("back")}</Link>
        </div>
      </div>
    );
  }

  const gapForMessage = (m: Message): Gap | undefined =>
    (detail?.gaps ?? []).find((g) => g.messageId === m.id);
  const momentForMessage = (m: Message): Moment | undefined =>
    (detail?.moments ?? []).find((x) => x.messageId === m.id);

  return (
    <div className="flex h-dvh flex-col bg-paper">
      {/* üst şerit */}
      <header className="flex h-[56px] shrink-0 items-center gap-3 border-b border-line px-[clamp(12px,2.5vw,20px)]">
        <Link href="/app" className="flex items-center gap-2 text-ink-2 hover:text-ink" aria-label={tn("back")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          <Wordmark className="h-5 w-auto" />
        </Link>
        <span className="chip ml-2 hidden !border-accent/50 !text-accent sm:inline-flex" title={t("scriptedHint")}>
          {t("scripted")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {!finished && detail && detail.messages.length > 1 && (
            <button type="button" onClick={finish} className="btn btn-ghost h-9 px-3 text-[13.5px]">{t("finish")}</button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[212px_minmax(0,1fr)_262px]">
        {/* sol: koyu panel */}
        <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto bg-deep p-4 text-[13px] text-deep-ink lg:flex">
          <div className="flex flex-col gap-2">
            <span className="meta text-[13px] !text-deep-mute">{t("exam")}</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip !border-deep-primary !bg-deep-primary !text-deep px-2 py-1 text-[11.5px]">YKS</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="meta mb-1 text-[13px] !text-deep-mute">{subject?.name.toLocaleLowerCase("tr")}</span>
            {curriculum.topics
              .filter((x) => x.subjectId === subject?.id)
              .map((x) => {
                const on = x.id === topic?.id;
                return (
                  <div key={x.id} className={`flex justify-between rounded-[var(--radius-ui)] px-2 py-1.5 ${on ? "bg-deep-2 font-semibold text-white" : "text-deep-mute"}`}>
                    <span className="truncate">{x.name}</span>
                    {on && <span className="meta text-[13px] !text-deep-accent tabular-nums">{percent}</span>}
                  </div>
                );
              })}
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <span className="meta text-[13px] !text-deep-mute">{t("student")}</span>
            <div className="flex gap-1.5">
              <i className="block size-8 rounded-[30%] border-2 border-deep-primary bg-[repeating-linear-gradient(135deg,var(--deep-2)_0_4px,var(--deep)_4px_8px)]" />
            </div>
            <span className="meta text-[12.5px] !text-deep-mute">{persona?.name} · {persona?.trait.split(",")[0].toLocaleLowerCase("tr")}</span>
          </div>
        </aside>

        {/* orta: sohbet */}
        <main className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-[clamp(12px,2.5vw,20px)] py-3">
            <div>
              <h1 className="text-[19px]">{topic?.name}</h1>
              <span className="meta text-[13.5px]">yks / {subject?.name.toLocaleLowerCase("tr")} · {persona?.name}</span>
            </div>
            <span className="meta flex items-center gap-1.5 text-[13.5px] !text-primary">
              <i className="block size-1.5 rounded-full bg-primary" />{settled}/{concepts.length}
            </span>
          </div>

          {/* Anlayış haritası mobilde sağ panele sığmıyor — açılır panel olarak burada.
              Ürünün çekirdek geri bildirimi; telefonda görünmemesi olmaz. */}
          <div className="shrink-0 border-b border-line lg:hidden">
            <button
              type="button"
              onClick={() => setMapOpen((o) => !o)}
              aria-expanded={mapOpen}
              className="flex w-full items-center gap-3 px-[clamp(12px,2.5vw,20px)] py-2.5 text-left"
            >
              <span className="meta text-[13px]">{t("map")}</span>
              <span className="min-w-0 flex-1">
                <span className="block h-[5px] overflow-hidden rounded-[3px] bg-surface-2">
                  <i className="block h-full bg-glow transition-[width] duration-500" style={{ width: `${percent}%` }} />
                </span>
              </span>
              <span className="meta shrink-0 text-[13px] !text-primary tabular-nums">%{percent}</span>
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                className={`shrink-0 text-ink-3 transition-transform ${mapOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <Collapse open={mapOpen}>
              <div className="border-t border-line px-[clamp(12px,2.5vw,20px)] py-3">
                <UnderstandingMap
                  topicName={topic?.name ?? ""}
                  concepts={concepts}
                  states={stateMap}
                  closed={closedByTeaching}
                  targetId={targetId}
                  percent={percent}
                  settled={settled}
                  asked={asked}
                  note={detail?.session.note ?? null}
                  showHeader={false}
                />
              </div>
            </Collapse>
          </div>

          <div ref={feed} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[clamp(12px,2.5vw,20px)] py-4 text-[14px]">
            {(detail?.messages ?? []).length === 0 && !thinking && (
              <p className="meta m-auto max-w-[32ch] text-center">{t("empty")}</p>
            )}
            {(detail?.messages ?? []).map((m) => {
              const gap = gapForMessage(m);
              const moment = momentForMessage(m);
              return (
                <div key={m.id} className="flex flex-col gap-2">
                  <div className={`max-w-[85%] rounded-[9px] px-3.5 py-2.5 leading-[1.5] ${m.role === "teacher" ? "self-end bg-primary text-on-primary" : "border border-line bg-surface-2"}`}>
                    {/* curriculum'daki tek <strong> vurgusu için */}
                    <span dangerouslySetInnerHTML={{ __html: m.content.replace(/<(?!\/?strong>)/g, "&lt;") }} />
                  </div>
                  {moment && <MomentChip kind={moment.kind} label={moment.label} />}
                  {gap && (
                    <>
                      <div className="meta self-start rounded-[var(--radius-ui)] border border-dashed border-accent px-2.5 py-1 text-[13px] !text-accent">
                        {gap.label}
                      </div>
                      {/* Mekanizmayı yalnızca ilk boşlukta, tam görüldüğü anda söyle.
                          Her boşlukta tekrarlamak öğretici olmaktan çıkıp gürültü olur. */}
                      {gap.id === (detail?.gaps ?? [])[0]?.id && (
                        <p className="meta self-start max-w-[46ch] text-[12.5px] leading-[1.45]">
                          {t("mechanism")}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            {thinking && <div className="meta self-start px-1 text-[13px]">{t("thinking")}</div>}
          </div>

          {finished ? (
            <div className="shrink-0 border-t border-line px-[clamp(12px,2.5vw,20px)] py-4">
              <p className="text-[14px] text-ink-2"><span className="meta">{t("noteLabel")}</span> {detail?.session.note}</p>
              <Link href="/app" className="btn btn-primary mt-3 h-9 text-[14px]">{tn("back")}</Link>
            </div>
          ) : (
            <div className="shrink-0 border-t border-line px-[clamp(12px,2.5vw,20px)] py-3">
              {sendErr && (
                <div className="anim-fade-in mb-2 flex flex-wrap items-center gap-3 rounded-[var(--radius-ui)] border border-accent bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-3 py-2 text-[13px] text-accent" role="alert">
                  <span className="min-w-0 flex-1">{sendErr}</span>
                  <button type="button" onClick={() => send(draft)} className="font-semibold underline underline-offset-2">
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
                      send();
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
                  <button type="button" onClick={() => send()} disabled={!draft.trim() || thinking} className="btn btn-primary ml-auto h-8 px-3 text-[13px] disabled:opacity-40">
                    ⏎ {t("send")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* sağ: anlayış haritası (masaüstü) */}
        <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto border-l border-line p-4 lg:flex">
          <UnderstandingMap
            topicName={topic?.name ?? ""}
            concepts={concepts}
            states={stateMap}
            closed={closedByTeaching}
            targetId={targetId}
            percent={percent}
            settled={settled}
            asked={asked}
            note={detail?.session.note ?? null}
          />
          {mode === "teach" && (
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <span className="meta text-[13.5px]">{t("moments")}</span>
            <TeachingEvidence counts={momentCounts} />
            <p className="meta mt-1 text-[12.5px] leading-[1.45]">{t("momentsHint")}</p>
          </div>
          )}
          {/* İki katmanın ilişkisini bir cümleyle söyle: üstte ne öğrendiğin,
              altta nasıl öğrettiğin. Biri diğerinin yerine geçmiyor. */}
          {mode === "teach" && <p className="meta border-t border-line pt-3 text-[12.5px] leading-[1.45]">{t("twoLayers")}</p>}
        </aside>
      </div>
    </div>
  );
}
