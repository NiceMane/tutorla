"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { getRepo, type SessionDetail } from "@/lib/repo";
import { getEngine } from "@/lib/engine";
import type { Concept, ConceptStatus, Gap, Message, Moment, MomentKind } from "@/lib/domain";

/* Seans ekranının bütün durumu tek yerde. Ekran 400 satırdı ve veri akışı
   JSX'in içine dağılmıştı; taşıma, gönderme ve bitirme mantığı buraya alındı,
   bileşenler yalnızca çiziyor. */
export function useSession(sessionId: string) {
  const { ready, exams, curriculum, personas, refresh } = useApp();
  const repo = useMemo(() => getRepo(), []);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const mode = detail?.session.mode ?? "teach";
  const engine = useMemo(() => getEngine(mode), [mode]);

  const [missing, setMissing] = useState(false);
  const draftKey = `tutorla-draft-${sessionId}`;
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
  const [sendErr, setSendErr] = useState<string | null>(null);
  const opened = useRef(false);

  const topic = detail ? curriculum.topics.find((x) => x.id === detail.session.topicId) ?? null : null;
  const subject = topic ? curriculum.subjects.find((x) => x.id === topic.subjectId) ?? null : null;
  const exam = subject ? exams.find((e) => e.id === subject.examId) ?? null : null;
  const persona = detail ? personas.find((p) => p.code === detail.session.personaId) ?? null : null;
  const siblings = useMemo(
    () => (subject ? curriculum.topics.filter((x) => x.subjectId === subject.id) : []),
    [curriculum.topics, subject],
  );
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

  /* Yazılan metin kaybolmasın: sekme kapanır ya da sayfa yenilenirse geri gelsin. */
  useEffect(() => {
    try {
      if (draft.trim()) window.localStorage.setItem(draftKey, draft);
      else window.localStorage.removeItem(draftKey);
    } catch { /* yoksay */ }
  }, [draft, draftKey]);

  const send = useCallback(async (retryText?: string) => {
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
  }, [draft, thinking, finished, topic, detail, repo, sessionId, load, engine, concepts, stateMap, refresh, draftKey]);

  const finish = useCallback(async () => {
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
  }, [topic, detail, engine, concepts, stateMap, repo, sessionId, load, refresh]);

  const gapForMessage = useCallback(
    (m: Message): Gap | undefined => (detail?.gaps ?? []).find((g) => g.messageId === m.id),
    [detail?.gaps],
  );
  const momentForMessage = useCallback(
    (m: Message): Moment | undefined => (detail?.moments ?? []).find((x) => x.messageId === m.id),
    [detail?.moments],
  );

  return {
    detail, missing, mode, topic, subject, exam, persona, siblings, concepts,
    stateMap, closedByTeaching, settled, percent, asked, momentCounts, finished,
    draft, setDraft, thinking, targetId, sendErr, send, finish,
    firstGapId: (detail?.gaps ?? [])[0]?.id ?? null,
    gapForMessage, momentForMessage,
  };
}
