/* Alan tipleri — supabase/migrations/*.sql şemasıyla birebir.
   Supabase'e geçtiğimizde bu dosya değişmez, sadece repo uygulaması değişir. */

export type ConceptStatus = "untouched" | "gap" | "settled";
export type MessageRole = "student" | "teacher"; // student = yapay zekâ, teacher = kullanıcı
export type SessionStatus = "active" | "finished" | "abandoned";
export type PersonaCode = "curious" | "sceptical" | "impatient";

/* teach = kullanıcı anlatır, AI öğrenci (ürünün çekirdeği)
   socratic = AI yönlendirici soru sorar, roller klasik */
export type SessionMode = "teach" | "socratic";

/* Sınıf ve çalışma düzeni serbest metin: arayüz öneri listesi gösteriyor ama
   listede olmayan (hazırlık, açıköğretim, kendi tarifi) da yazılabiliyor.
   Bilinen anahtarlar çeviriye sahip; gerisi olduğu gibi gösterilir. */
export type Grade = string;
export type StudyStyle = string;

export type Profile = {
  id: string;
  displayName: string | null;
  handle: string | null;
  bio: string | null;
  avatarEmoji: string;
  /* Yüklenmiş fotoğraf; yoksa avatarEmoji kullanılır. */
  avatarUrl: string | null;
  examId: string | null;

  /* Öğrenciyi tanıtan alanlar */
  grade: Grade | null;
  school: string | null;
  city: string | null;
  examYear: number | null;
  targetUniversity: string | null;
  targetDepartment: string | null;
  targetRank: number | null;
  /* YKS alanı: sayısal / eşit ağırlık / sözel / dil — liste öneri, metin serbest */
  track: string | null;
  targetScore: number | null;
  weeklyHours: number | null;
  studyStyle: StudyStyle | null;
  strongSubjects: string[];
  weakSubjects: string[];
  goals: string | null;

  isPublic: boolean;
  streakDays: number;
  longestStreak: number;
  createdAt: string | null;
  onboardedAt: string | null;
};

export type ProfileStats = {
  sessions: number;
  finishedSessions: number;
  closedByTeaching: number;
  moments: number;
  posts: number;
  followers: number;
  following: number;
};

export type FollowState = { following: boolean; followers: number; followingCount: number };

/* ------------------------------------------------------------ mesajlaşma */

export type DmThread = {
  id: string;
  /* Karşı taraf — birebir kanalda tek kişi */
  other: Profile | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
};

export type DmMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  /* İyimser gönderimde sunucuya ulaşmamış mesaj */
  pending?: boolean;
};

export type NotificationKind = "yorum" | "yanit" | "tepki" | "takip";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actor: Profile | null;
  postId: string | null;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ReportReason = "spam" | "taciz" | "uygunsuz" | "yanlis_bilgi" | "diger";

export type MediaKind = "image" | "gif";

export type PostMedia = { id: string; url: string; kind: MediaKind; position: number };

export type Post = {
  id: string;
  authorId: string;
  author: Profile | null;
  body: string;
  examId: string | null;
  media: PostMedia[];
  createdAt: string;
  editedAt: string | null;
  reactions: Record<string, number>;
  myReactions: string[];
  commentCount: number;
  bookmarked: boolean;
};

export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  author: Profile | null;
  body: string;
  gifUrl: string | null;
  createdAt: string;
  reactions: Record<string, number>;
  myReactions: string[];
};

export type ExamDocument = {
  id: string;
  examId: string;
  title: string;
  notes: string | null;
  fileUrl: string | null;
  createdAt: string;
};

/* Öğretme davranışı sinyalleri — ürünün "not değil, davranış kanıtı" tarafı. */
export type MomentKind = "persistence" | "causal" | "concrete" | "simplify" | "curiosity";
export const MOMENT_KINDS: MomentKind[] = ["persistence", "causal", "concrete", "simplify", "curiosity"];

export type Concept = { id: string; topicId: string; slug: string; name: string; position: number };
export type Topic = { id: string; subjectId: string; slug: string; name: string; position: number };
export type Subject = { id: string; examId: string; slug: string; name: string; position: number };
export type Exam = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  position: number;
  /* İçeriği hazır mı. false ise arayüzde "yakında". */
  active: boolean;
  /* Öğrencinin kendi eklediği sınavlarda dolu, resmî sınavlarda null. */
  createdBy: string | null;
};

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
  mode: SessionMode;
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
