/* Tarayıcı deposu — Supabase bağlanana kadar.
   Müfredat curriculum.ts'ten türetilir (id'ler slug tabanlı ve kararlı),
   kullanıcı verisi localStorage'da tutulur. Kayıt şekli şemayla aynı,
   böylece Supabase'e geçiş satır satır eşleşir. */
import { CURRICULUM, EXAM, PERSONAS } from "@/lib/curriculum";
import type {
  Concept, ConceptState, ConceptStatus, Gap, Message, MessageRole,
  Persona, PersonaCode, Session, Subject, Topic, TopicProgress,
} from "@/lib/domain";
import type { Curriculum, Repo, SessionDetail } from "./types";

const KEY = "tutorla-app-v1";
const EXAM_ID = EXAM.code;

/* Kararlı id'ler: yeniden yüklemede değişmesin, localStorage'daki veri bozulmasın */
const subjectId = (s: string) => s;
const topicId = (s: string, t: string) => `${s}/${t}`;
const conceptId = (s: string, t: string, c: string) => `${s}/${t}/${c}`;

function buildCurriculum(): Curriculum {
  const subjects: Subject[] = [];
  const topics: Topic[] = [];
  const concepts: Concept[] = [];
  CURRICULUM.forEach((s, si) => {
    subjects.push({ id: subjectId(s.slug), examId: EXAM_ID, slug: s.slug, name: s.name, position: si + 1 });
    s.topics.forEach((t, ti) => {
      const tid = topicId(s.slug, t.slug);
      topics.push({ id: tid, subjectId: subjectId(s.slug), slug: t.slug, name: t.name, position: ti + 1 });
      t.concepts.forEach((c, ci) => {
        concepts.push({ id: conceptId(s.slug, t.slug, c.slug), topicId: tid, slug: c.slug, name: c.name, position: ci + 1 });
      });
    });
  });
  return { subjects, topics, concepts };
}

const CUR = buildCurriculum();

type Store = {
  sessions: Session[];
  messages: Message[];
  gaps: Gap[];
  states: (ConceptState & { conceptId: string })[];
};

const empty: Store = { sessions: [], messages: [], gaps: [], states: [] };

function read(): Store {
  if (typeof window === "undefined") return { ...empty };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const p = JSON.parse(raw) as Partial<Store>;
    return {
      sessions: p.sessions ?? [],
      messages: p.messages ?? [],
      gaps: p.gaps ?? [],
      states: p.states ?? [],
    };
  } catch {
    return { ...empty };
  }
}

function write(s: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* kota dolu ya da özel pencere — uygulama yine çalışır, veri kalıcı olmaz */
  }
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export class LocalRepo implements Repo {
  readonly kind = "local" as const;

  async getCurriculum(): Promise<Curriculum> {
    return CUR;
  }

  async getPersonas(): Promise<Persona[]> {
    return PERSONAS.map((p, i) => ({
      id: p.code as PersonaCode,
      code: p.code as PersonaCode,
      name: p.name,
      trait: p.trait,
      active: p.active,
      position: i + 1,
    }));
  }

  /* topic_progress ile aynı hesap: payda konunun TÜM kavramları */
  async getProgress(): Promise<TopicProgress[]> {
    const st = read();
    const byId = new Map(st.states.map((s) => [s.conceptId, s.status]));
    return CUR.topics.map((t) => {
      const cs = CUR.concepts.filter((c) => c.topicId === t.id);
      const settled = cs.filter((c) => byId.get(c.id) === "settled").length;
      const gaps = cs.filter((c) => byId.get(c.id) === "gap").length;
      return {
        topicId: t.id,
        settled,
        gaps,
        total: cs.length,
        percent: cs.length ? Math.round((settled / cs.length) * 100) : 0,
      };
    });
  }

  async getConceptStates(topicId_: string): Promise<ConceptState[]> {
    const st = read();
    const ids = new Set(CUR.concepts.filter((c) => c.topicId === topicId_).map((c) => c.id));
    return st.states.filter((s) => ids.has(s.conceptId));
  }

  async listSessions(): Promise<Session[]> {
    return read().sessions.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async getSession(id: string): Promise<SessionDetail | null> {
    const st = read();
    const session = st.sessions.find((s) => s.id === id);
    if (!session) return null;
    const ids = new Set(CUR.concepts.filter((c) => c.topicId === session.topicId).map((c) => c.id));
    return {
      session,
      messages: st.messages.filter((m) => m.sessionId === id).sort((a, b) => a.position - b.position),
      gaps: st.gaps.filter((g) => g.sessionId === id),
      states: st.states.filter((s) => ids.has(s.conceptId)),
    };
  }

  async createSession(topicId_: string, personaId: PersonaCode): Promise<Session> {
    const st = read();
    const session: Session = {
      id: uid(),
      topicId: topicId_,
      personaId,
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null,
      note: null,
    };
    st.sessions.push(session);
    write(st);
    return session;
  }

  async finishSession(sessionId: string, note: string): Promise<void> {
    const st = read();
    const s = st.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.status = "finished";
    s.endedAt = new Date().toISOString();
    s.note = note;
    write(st);
  }

  async appendMessage(sessionId: string, role: MessageRole, content: string): Promise<Message> {
    const st = read();
    const position = st.messages.filter((m) => m.sessionId === sessionId).length;
    const msg: Message = { id: uid(), sessionId, role, content, position, createdAt: new Date().toISOString() };
    st.messages.push(msg);
    write(st);
    return msg;
  }

  async addGap(sessionId: string, messageId: string | null, conceptId_: string | null, label: string): Promise<Gap> {
    const st = read();
    const gap: Gap = { id: uid(), sessionId, messageId, conceptId: conceptId_, label, createdAt: new Date().toISOString() };
    st.gaps.push(gap);
    write(st);
    return gap;
  }

  async setConceptStatus(conceptId_: string, status: ConceptStatus, sessionId: string | null): Promise<void> {
    const st = read();
    const now = new Date().toISOString();
    const found = st.states.find((s) => s.conceptId === conceptId_);
    if (found) {
      /* Bir kez oturmuş kavram, sonraki bir boşlukla geri düşmesin */
      if (found.status === "settled" && status === "gap") return;
      found.status = status;
      found.sessionId = sessionId;
      found.updatedAt = now;
    } else {
      st.states.push({ conceptId: conceptId_, status, sessionId, updatedAt: now });
    }
    write(st);
  }

  async reset(): Promise<void> {
    write({ ...empty, sessions: [], messages: [], gaps: [], states: [] });
  }
}
