"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { Post, Profile } from "@/lib/domain";
import { normalize, score } from "@/lib/search";

export type Hit =
  | { kind: "topic"; id: string; title: string; sub: string; topicId: string; examCode: string }
  | { kind: "concept"; id: string; title: string; sub: string; topicId: string; examCode: string }
  | { kind: "exam"; id: string; title: string; sub: string; code: string }
  | { kind: "person"; id: string; title: string; sub: string; profile: Profile }
  | { kind: "post"; id: string; title: string; sub: string; post: Post };

/* Müfredat zaten bellekte: konu ve kavramlar anında eşleşiyor.
   Kişiler ve gönderiler veritabanından geliyor, o yüzden gecikmeli. */
export function useSearchResults(query: string, limit = 6) {
  const { curriculum, exams } = useApp();
  const q = normalize(query);
  const [remote, setRemote] = useState<{ people: Profile[]; posts: Post[] }>({ people: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    /* Her tuşta sorgu atmamak için kısa bir bekleme; arada gelen eski
       yanıtlar sıra numarasıyla eleniyor. Durum güncellemeleri bilerek
       zamanlayıcının içinde: etkinin gövdesinde senkron setState
       zincirleme render demek. */
    const id = setTimeout(async () => {
      if (q.length < 2) {
        if (seq.current === mine) { setRemote({ people: [], posts: [] }); setLoading(false); }
        return;
      }
      if (seq.current === mine) setLoading(true);
      try {
        const res = await getRepo().search(query, limit);
        if (seq.current === mine) setRemote(res);
      } catch {
        if (seq.current === mine) setRemote({ people: [], posts: [] });
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    }, q.length < 2 ? 0 : 220);
    return () => clearTimeout(id);
  }, [q, query, limit]);

  const local = useMemo(() => {
    if (q.length < 2) return { topics: [] as Hit[], concepts: [] as Hit[], exams: [] as Hit[] };

    const examOf = (subjectId: string) => {
      const subject = curriculum.subjects.find((s) => s.id === subjectId);
      const exam = exams.find((e) => e.id === subject?.examId);
      return { subject, exam };
    };

    const topics: (Hit & { s: number })[] = [];
    for (const topic of curriculum.topics) {
      const sc = score(topic.name, q);
      if (sc < 0) continue;
      const { subject, exam } = examOf(topic.subjectId);
      if (!exam) continue;
      topics.push({
        kind: "topic", id: topic.id, title: topic.name,
        sub: `${exam.code} · ${subject?.name ?? ""}`,
        topicId: topic.id, examCode: exam.code, s: sc,
      });
    }

    const concepts: (Hit & { s: number })[] = [];
    for (const c of curriculum.concepts) {
      const sc = score(c.name, q);
      if (sc < 0) continue;
      const topic = curriculum.topics.find((x) => x.id === c.topicId);
      if (!topic) continue;
      const { exam } = examOf(topic.subjectId);
      if (!exam) continue;
      concepts.push({
        kind: "concept", id: c.id, title: c.name, sub: `${topic.name} · ${exam.code}`,
        topicId: topic.id, examCode: exam.code, s: sc,
      });
    }

    const examHits: (Hit & { s: number })[] = [];
    for (const e of exams) {
      const sc = Math.min(...[score(e.name, q), score(e.code, q)].filter((x) => x >= 0), 9);
      if (sc === 9) continue;
      examHits.push({ kind: "exam", id: e.id, title: e.name, sub: e.description ?? e.code, code: e.code, s: sc });
    }

    /* Puana göre sırala, kes, puanı at (yalnızca sıralama içindi). */
    const trim = (list: (Hit & { s: number })[]): Hit[] =>
      list
        .sort((a, b) => a.s - b.s || a.title.localeCompare(b.title, "tr"))
        .slice(0, limit)
        .map((hit) => {
          const copy = { ...hit } as Hit & { s?: number };
          delete copy.s;
          return copy as Hit;
        });

    return { topics: trim(topics), concepts: trim(concepts), exams: trim(examHits) };
  }, [curriculum, exams, q, limit]);

  const groups = useMemo(() => {
    const people: Hit[] = remote.people.map((p) => ({
      kind: "person", id: p.id,
      title: p.displayName || (p.handle ? `@${p.handle}` : "—"),
      sub: p.handle ? `@${p.handle}` : "", profile: p,
    }));
    const posts: Hit[] = remote.posts.map((p) => ({
      kind: "post", id: p.id,
      title: p.body.length > 70 ? `${p.body.slice(0, 70)}…` : p.body,
      sub: p.author?.displayName || (p.author?.handle ? `@${p.author.handle}` : ""), post: p,
    }));
    return { ...local, people, posts };
  }, [local, remote]);

  const flat = useMemo(
    () => [...groups.topics, ...groups.concepts, ...groups.people, ...groups.posts, ...groups.exams],
    [groups],
  );

  return { groups, flat, loading, ready: q.length >= 2 };
}
