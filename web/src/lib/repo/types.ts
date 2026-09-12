/* Veri katmanı sınırı. Metotlar Supabase sorgularıyla birebir eşleşecek şekilde
   tasarlandı; bugünkü uygulaması tarayıcı deposu (local.ts), yarınki Supabase. */
import type {
  Concept, ConceptState, ConceptStatus, Gap, Message, MessageRole, Moment, MomentKind,
  LearningEvidence, Persona, PersonaCode, Session, Subject, TeachingProfile, Topic, TopicProgress,
} from "@/lib/domain";

export type Curriculum = { subjects: Subject[]; topics: Topic[]; concepts: Concept[] };

export type SessionDetail = {
  session: Session;
  messages: Message[];
  gaps: Gap[];
  moments: Moment[];
  states: ConceptState[];
};

export interface Repo {
  readonly kind: "local" | "supabase";

  getCurriculum(): Promise<Curriculum>;
  getPersonas(): Promise<Persona[]>;

  /* topic_progress görünümünün karşılığı */
  getProgress(): Promise<TopicProgress[]>;
  getConceptStates(topicId: string): Promise<ConceptState[]>;

  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<SessionDetail | null>;
  createSession(topicId: string, personaId: PersonaCode): Promise<Session>;
  finishSession(sessionId: string, note: string): Promise<void>;

  appendMessage(sessionId: string, role: MessageRole, content: string): Promise<Message>;
  addGap(sessionId: string, messageId: string | null, conceptId: string | null, label: string): Promise<Gap>;
  addMoment(sessionId: string, messageId: string | null, conceptId: string | null, kind: MomentKind, label: string): Promise<Moment>;
  /* teaching_profile görünümü — birikmiş DAVRANIŞ kanıtı (nasıl öğrettin) */
  getTeachingProfile(): Promise<TeachingProfile[]>;
  /* learning_evidence görünümü — ÖĞRENME kanıtı (anlatarak kapattığın kavramlar) */
  getLearningEvidence(): Promise<LearningEvidence[]>;
  setConceptStatus(conceptId: string, status: ConceptStatus, sessionId: string | null): Promise<void>;

  /* Yalnızca yerel geliştirme için — Supabase uygulamasında yok sayılır */
  reset?(): Promise<void>;
}
