/* Alan tipleri — supabase/migrations/*.sql şemasıyla birebir.
   Supabase'e geçtiğimizde bu dosya değişmez, sadece repo uygulaması değişir. */

export type ConceptStatus = "untouched" | "gap" | "settled";
export type MessageRole = "student" | "teacher"; // student = yapay zekâ, teacher = kullanıcı
export type SessionStatus = "active" | "finished" | "abandoned";
export type PersonaCode = "curious" | "sceptical" | "impatient";

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
