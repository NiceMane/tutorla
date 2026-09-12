/* Alan tipleri — supabase/migrations/*.sql şemasıyla birebir.
   Supabase'e geçtiğimizde bu dosya değişmez, sadece repo uygulaması değişir. */

export type ConceptStatus = "untouched" | "gap" | "settled";
export type MessageRole = "student" | "teacher"; // student = yapay zekâ, teacher = kullanıcı
export type SessionStatus = "active" | "finished" | "abandoned";
export type PersonaCode = "curious" | "sceptical" | "impatient";

/* Öğretme davranışı sinyalleri — ürünün "not değil, davranış kanıtı" tarafı. */
export type MomentKind = "persistence" | "causal" | "concrete" | "simplify" | "curiosity";
export const MOMENT_KINDS: MomentKind[] = ["persistence", "causal", "concrete", "simplify", "curiosity"];

export type Concept = { id: string; topicId: string; slug: string; name: string; position: number };
export type Topic = { id: string; subjectId: string; slug: string; name: string; position: number };
export type Subject = { id: string; examId: string; slug: string; name: string; position: number };
export type Exam = { id: string; code: string; name: string; position: number };

export type Persona = {
  id: PersonaCode;
  code: PersonaCode;
  name: string;
  trait: string;
  active: boolean;
  position: number;
};

export type Message = {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  position: number;
  createdAt: string;
};

export type Gap = {
  id: string;
  sessionId: string;
  messageId: string | null;
  conceptId: string | null;
  label: string;
  createdAt: string;
};

export type Moment = {
  id: string;
  sessionId: string;
  messageId: string | null;
  conceptId: string | null;
  kind: MomentKind;
  label: string;
  createdAt: string;
};

/* İki kanıt katmanı birbirini ikame etmiyor:
   TeachingProfile → NASIL öğrettiğin (davranış)
   LearningEvidence → NE öğrendiğin  (anlatarak kapatılan kavramlar) */
export type LearningEvidence = { topicId: string; closedByTeaching: number; settled: number };

/* teaching_profile görünümünün karşılığı — birikmiş kanıt */
export type TeachingProfile = { kind: MomentKind; total: number; lastAt: string | null };

export type Session = {
  id: string;
  topicId: string;
  personaId: PersonaCode;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
};

export type ConceptState = {
  conceptId: string;
  status: ConceptStatus;
  /* Bir kez boşluk olarak işaretlendi mi. settled + wasGap = anlatarak kapatılmış.
     Protégé effect'in ölçülebilir izi: boşluk anlatma sırasında ortaya çıktı ve
     yine anlatarak kapandı. */
  wasGap: boolean;
  sessionId: string | null;
  updatedAt: string;
};

/* topic_progress görünümünün karşılığı — yüzde saklanmaz, türetilir. */
export type TopicProgress = {
  topicId: string;
  settled: number;
  gaps: number;
  total: number;
  percent: number;
};
