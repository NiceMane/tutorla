"use client";
/* Supabase veri katmanı. Metotlar local.ts ile aynı sözleşmeyi uygular;
   fark yalnızca verinin nereden geldiği. */
import { getSupabase } from "@/lib/supabase";
import type {
  Comment, Concept, ConceptState, ConceptStatus, DmMessage, DmThread, Exam, ExamDocument, Gap,
  LearningEvidence, MediaKind, Message, MessageRole, Moment, MomentKind,
  AppNotification, FollowState, Persona, PersonaCode, Post, Profile, ProfileStats,
  ReportReason, Session, SessionMode, SessionStatus,
  Subject, TeachingProfile, Topic, TopicProgress,
} from "@/lib/domain";
import type { Curriculum, Repo, SessionDetail } from "./types";
import type { FeedPage, FeedScope, NewPost } from "./social";

type Row = Record<string, unknown>;

/* Supabase hataları düz nesne; new Error değil. Olduğu gibi fırlatınca
   arayüzde mesaj kayboluyor ("—" görünüyordu). Gerçek Error'a çeviriyoruz. */
type SbError = { message?: string; code?: string; details?: string; hint?: string };
function fail(e: SbError, where: string): never {
  const parts = [e?.message, e?.details, e?.hint].filter(Boolean).join(" · ");
  const err = new Error(`${where}: ${parts || "bilinmeyen hata"}${e?.code ? ` [${e.code}]` : ""}`);
  throw err;
}
const str = (v: unknown) => String(v ?? "");
const num = (v: unknown) => Number(v ?? 0);

export class SupabaseRepo implements Repo {
  readonly kind = "supabase" as const;
  private curriculum: Curriculum | null = null;
  private personaByCode = new Map<PersonaCode, string>();

  /* Oturum açma işi AuthProvider'da; buraya gelindiğinde kullanıcı girmiş olur
     (uygulama rotaları RequireAuth ile korunuyor). */
  private async sb() {
    return getSupabase();
  }

  private async userId(): Promise<string> {
    const sb = await this.sb();
    const { data } = await sb.auth.getUser();
    if (!data.user) throw new Error("Oturum yok");
    return data.user.id;
  }

  async getCurriculum(): Promise<Curriculum> {
    if (this.curriculum) return this.curriculum;
    const sb = await this.sb();
    const [s, t, c] = await Promise.all([
      sb.from("subjects").select("id,exam_id,slug,name,position").order("position"),
      sb.from("topics").select("id,subject_id,slug,name,position").order("position"),
      sb.from("concepts").select("id,topic_id,slug,name,position").order("position"),
    ]);
    if (s.error) fail(s.error, "s");
    if (t.error) fail(t.error, "t");
    if (c.error) fail(c.error, "c");

    const subjects: Subject[] = (s.data as Row[]).map((r) => ({
      id: str(r.id), examId: str(r.exam_id), slug: str(r.slug), name: str(r.name), position: num(r.position),
    }));
    const topics: Topic[] = (t.data as Row[]).map((r) => ({
      id: str(r.id), subjectId: str(r.subject_id), slug: str(r.slug), name: str(r.name), position: num(r.position),
    }));
    const concepts: Concept[] = (c.data as Row[]).map((r) => ({
      id: str(r.id), topicId: str(r.topic_id), slug: str(r.slug), name: str(r.name), position: num(r.position),
    }));
    return (this.curriculum = { subjects, topics, concepts });
  }

  async getPersonas(): Promise<Persona[]> {
    const sb = await this.sb();
    const { data, error } = await sb.from("personas").select("id,code,name,trait,active,position").order("position");
    if (error) fail(error, "sorgu");
    const rows = data as Row[];
    this.personaByCode = new Map(rows.map((r) => [str(r.code) as PersonaCode, str(r.id)]));
    return rows.map((r) => ({
      id: str(r.code) as PersonaCode,
      code: str(r.code) as PersonaCode,
      name: str(r.name),
      trait: str(r.trait),
      active: Boolean(r.active),
      position: num(r.position),
    }));
  }

  /* topic_progress görünümü: yüzde veritabanında hesaplanıyor */
  async getProgress(): Promise<TopicProgress[]> {
    const sb = await this.sb();
    const { data, error } = await sb.from("topic_progress").select("topic_id,settled,gaps,total,percent");
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => ({
      topicId: str(r.topic_id), settled: num(r.settled), gaps: num(r.gaps), total: num(r.total), percent: num(r.percent),
    }));
  }

  async getConceptStates(topicId: string): Promise<ConceptState[]> {
    const sb = await this.sb();
    const cur = await this.getCurriculum();
    const ids = cur.concepts.filter((c) => c.topicId === topicId).map((c) => c.id);
    if (ids.length === 0) return [];
    const { data, error } = await sb.from("concept_states").select("concept_id,status,was_gap,session_id,updated_at").in("concept_id", ids);
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => ({
      conceptId: str(r.concept_id), status: str(r.status) as ConceptStatus,
      wasGap: Boolean(r.was_gap),
      sessionId: r.session_id ? str(r.session_id) : null, updatedAt: str(r.updated_at),
    }));
  }

  private toSession(r: Row): Session {
    return {
      id: str(r.id), mode: (str(r.mode) || "teach") as SessionMode, topicId: str(r.topic_id),
      personaId: str(r.persona_code ?? "curious") as PersonaCode,
      status: str(r.status) as SessionStatus,
      startedAt: str(r.started_at), endedAt: r.ended_at ? str(r.ended_at) : null,
      note: r.note ? str(r.note) : null,
    };
  }

  async listSessions(): Promise<Session[]> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("sessions")
      .select("id,mode,topic_id,status,started_at,ended_at,note,personas(code)")
      .order("started_at", { ascending: false });
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => {
      const p = r.personas as { code?: string } | null;
      return this.toSession({ ...r, persona_code: p?.code });
    });
  }

  async getSession(id: string): Promise<SessionDetail | null> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("sessions")
      .select("id,mode,topic_id,status,started_at,ended_at,note,personas(code)")
      .eq("id", id)
      .maybeSingle();
    if (error) fail(error, "sorgu");
    if (!data) return null;
    const p = (data as Row).personas as { code?: string } | null;
    const session = this.toSession({ ...(data as Row), persona_code: p?.code });

    const [m, g, mo, states] = await Promise.all([
      sb.from("messages").select("id,session_id,role,content,position,created_at").eq("session_id", id).order("position"),
      sb.from("gaps").select("id,session_id,message_id,concept_id,label,created_at").eq("session_id", id),
      sb.from("moments").select("id,session_id,message_id,concept_id,kind,label,created_at").eq("session_id", id),
      this.getConceptStates(session.topicId),
    ]);
    if (m.error) fail(m.error, "m");
    if (g.error) fail(g.error, "g");
    if (mo.error) fail(mo.error, "mo");

    const messages: Message[] = (m.data as Row[]).map((r) => ({
      id: str(r.id), sessionId: str(r.session_id), role: str(r.role) as MessageRole,
      content: str(r.content), position: num(r.position), createdAt: str(r.created_at),
    }));
    const gaps: Gap[] = (g.data as Row[]).map((r) => ({
      id: str(r.id), sessionId: str(r.session_id),
      messageId: r.message_id ? str(r.message_id) : null,
      conceptId: r.concept_id ? str(r.concept_id) : null,
      label: str(r.label), createdAt: str(r.created_at),
    }));
    const moments: Moment[] = (mo.data as Row[]).map((r) => ({
      id: str(r.id), sessionId: str(r.session_id),
      messageId: r.message_id ? str(r.message_id) : null,
      conceptId: r.concept_id ? str(r.concept_id) : null,
      kind: str(r.kind) as MomentKind, label: str(r.label), createdAt: str(r.created_at),
    }));
    return { session, messages, gaps, moments, states };
  }

  async createSession(topicId: string, personaId: PersonaCode, mode: SessionMode = "teach"): Promise<Session> {
    const sb = await this.sb();
    if (this.personaByCode.size === 0) await this.getPersonas();
    const personaUuid = this.personaByCode.get(personaId);
    if (!personaUuid) throw new Error(`Persona bulunamadı: ${personaId}`);
    const { data, error } = await sb
      .from("sessions")
      .insert({ user_id: await this.userId(), topic_id: topicId, persona_id: personaUuid, mode })
      .select("id,mode,topic_id,status,started_at,ended_at,note")
      .single();
    if (error) fail(error, "sorgu");
    return this.toSession({ ...(data as Row), persona_code: personaId });
  }

  async finishSession(sessionId: string, note: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb
      .from("sessions")
      .update({ status: "finished", ended_at: new Date().toISOString(), note })
      .eq("id", sessionId);
    if (error) fail(error, "sorgu");
  }

  async appendMessage(sessionId: string, role: MessageRole, content: string): Promise<Message> {
    const sb = await this.sb();
    const { count, error: cErr } = await sb
      .from("messages").select("id", { count: "exact", head: true }).eq("session_id", sessionId);
    if (cErr) throw cErr;
    const { data, error } = await sb
      .from("messages")
      .insert({ session_id: sessionId, role, content, position: count ?? 0 })
      .select("id,session_id,role,content,position,created_at")
      .single();
    if (error) fail(error, "sorgu");
    const r = data as Row;
    return {
      id: str(r.id), sessionId: str(r.session_id), role: str(r.role) as MessageRole,
      content: str(r.content), position: num(r.position), createdAt: str(r.created_at),
    };
  }

  async addGap(sessionId: string, messageId: string | null, conceptId: string | null, label: string): Promise<Gap> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("gaps")
      .insert({ session_id: sessionId, message_id: messageId, concept_id: conceptId, label })
      .select("id,session_id,message_id,concept_id,label,created_at")
      .single();
    if (error) fail(error, "sorgu");
    const r = data as Row;
    return {
      id: str(r.id), sessionId: str(r.session_id),
      messageId: r.message_id ? str(r.message_id) : null,
      conceptId: r.concept_id ? str(r.concept_id) : null,
      label: str(r.label), createdAt: str(r.created_at),
    };
  }

  async addMoment(sessionId: string, messageId: string | null, conceptId: string | null, kind: MomentKind, label: string): Promise<Moment> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("moments")
      .insert({ session_id: sessionId, message_id: messageId, concept_id: conceptId, kind, label })
      .select("id,session_id,message_id,concept_id,kind,label,created_at")
      .single();
    if (error) fail(error, "sorgu");
    const r = data as Row;
    return {
      id: str(r.id), sessionId: str(r.session_id),
      messageId: r.message_id ? str(r.message_id) : null,
      conceptId: r.concept_id ? str(r.concept_id) : null,
      kind: str(r.kind) as MomentKind, label: str(r.label), createdAt: str(r.created_at),
    };
  }

  /* Anlatarak kapatılan kavramlar — protégé effect'in izi, veritabanında toplanıyor */
  async getLearningEvidence(): Promise<LearningEvidence[]> {
    const sb = await this.sb();
    const { data, error } = await sb.from("learning_evidence").select("topic_id,closed_by_teaching,settled");
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => ({
      topicId: str(r.topic_id), closedByTeaching: num(r.closed_by_teaching), settled: num(r.settled),
    }));
  }

  /* Toplama veritabanında yapılıyor — istemci satır saymıyor */
  async getTeachingProfile(): Promise<TeachingProfile[]> {
    const sb = await this.sb();
    const { data, error } = await sb.from("teaching_profile").select("kind,total,last_at");
    if (error) fail(error, "sorgu");
    return (data as Row[])
      .map((r) => ({ kind: str(r.kind) as MomentKind, total: num(r.total), lastAt: r.last_at ? str(r.last_at) : null }))
      .sort((a, b) => b.total - a.total);
  }

  async setConceptStatus(conceptId: string, status: ConceptStatus, sessionId: string | null): Promise<void> {
    const sb = await this.sb();
    const userId = await this.userId();
    /* Bir kez oturmuş kavram, sonraki bir boşlukla geri düşmesin (local.ts ile aynı kural) */
    let wasGap = status === "gap";
    if (status === "gap") {
      const { data } = await sb.from("concept_states").select("status").eq("concept_id", conceptId).maybeSingle();
      if (data && str((data as Row).status) === "settled") return;
    } else {
      /* Oturturken önceki boşluk izini koru — "anlatarak kapattın" bilgisi ondan geliyor */
      const { data } = await sb.from("concept_states").select("was_gap").eq("concept_id", conceptId).maybeSingle();
      wasGap = Boolean(data && (data as Row).was_gap);
    }
    const { error } = await sb
      .from("concept_states")
      .upsert(
        { user_id: userId, concept_id: conceptId, status, was_gap: wasGap, session_id: sessionId, updated_at: new Date().toISOString() },
        { onConflict: "user_id,concept_id" },
      );
    if (error) fail(error, "sorgu");
  }

  /* ---------------------------------------------------------- sosyal taraf */

  private toProfile(r: Row | null | undefined): Profile | null {
    if (!r) return null;
    const t = (k: string) => (r[k] ? str(r[k]) : null);
    const n = (k: string) => (r[k] === null || r[k] === undefined ? null : num(r[k]));
    return {
      id: str(r.id),
      displayName: t("display_name"),
      handle: t("handle"),
      bio: t("bio"),
      avatarEmoji: str(r.avatar_emoji) || "🦉",
      avatarUrl: t("avatar_url"),
      examId: t("exam_id"),
      grade: t("grade") as Profile["grade"],
      school: t("school"),
      city: t("city"),
      examYear: n("exam_year"),
      targetUniversity: t("target_university"),
      targetDepartment: t("target_department"),
      targetRank: n("target_rank"),
      track: t("track"),
      targetScore: n("target_score"),
      weeklyHours: n("weekly_hours"),
      studyStyle: t("study_style") as Profile["studyStyle"],
      strongSubjects: (r.strong_subjects as string[] | null) ?? [],
      weakSubjects: (r.weak_subjects as string[] | null) ?? [],
      goals: t("goals"),
      isPublic: r.is_public === undefined ? true : Boolean(r.is_public),
      streakDays: num(r.streak_days),
      longestStreak: num(r.longest_streak),
      createdAt: t("created_at"),
      onboardedAt: t("onboarded_at"),
    };
  }

  /* Profil sütunları tek yerde: sorgular arasında kayma olmasın. */
  private static readonly PROFILE_COLS = "id,display_name,handle,bio,avatar_emoji,avatar_url,exam_id,grade,school,city,exam_year,target_university,target_department,target_rank,track,target_score,weekly_hours,study_style,strong_subjects,weak_subjects,goals,is_public,streak_days,longest_streak,created_at,onboarded_at";

  async getMyProfile(): Promise<Profile | null> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("profiles").select(SupabaseRepo.PROFILE_COLS)
      .eq("id", await this.userId()).maybeSingle();
    if (error) fail(error, "sorgu");
    return this.toProfile(data as Row | null);
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const sb = await this.sb();
    const MAP: Record<string, string> = {
      displayName: "display_name", handle: "handle", bio: "bio",
      avatarEmoji: "avatar_emoji", avatarUrl: "avatar_url", examId: "exam_id",
      grade: "grade", school: "school", city: "city", examYear: "exam_year",
      targetUniversity: "target_university", targetDepartment: "target_department",
      targetRank: "target_rank", track: "track", targetScore: "target_score",
      weeklyHours: "weekly_hours", studyStyle: "study_style",
      strongSubjects: "strong_subjects", weakSubjects: "weak_subjects", goals: "goals",
      isPublic: "is_public", onboardedAt: "onboarded_at",
    };
    const row: Row = {};
    for (const [k, col] of Object.entries(MAP)) {
      if (k in patch) row[col] = (patch as Record<string, unknown>)[k];
    }
    const { data, error } = await sb
      .from("profiles").update(row).eq("id", await this.userId())
      .select(SupabaseRepo.PROFILE_COLS).single();
    if (error) fail(error, "sorgu");
    return this.toProfile(data as Row)!;
  }

  async listExams(): Promise<Exam[]> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("exams").select("id,code,name,description,position,active,created_by").order("position");
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => ({
      id: str(r.id), code: str(r.code), name: str(r.name),
      description: r.description ? str(r.description) : null,
      position: num(r.position), active: Boolean(r.active),
      createdBy: r.created_by ? str(r.created_by) : null,
    }));
  }

  async createExam(input: { code: string; name: string; description: string | null }): Promise<Exam> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("exams")
      .insert({ ...input, created_by: await this.userId(), active: false, position: 99 })
      .select("id,code,name,description,position,active,created_by").single();
    if (error) fail(error, "sorgu");
    const r = data as Row;
    return {
      id: str(r.id), code: str(r.code), name: str(r.name),
      description: r.description ? str(r.description) : null,
      position: num(r.position), active: Boolean(r.active),
      createdBy: r.created_by ? str(r.created_by) : null,
    };
  }

  async listExamDocuments(examId: string): Promise<ExamDocument[]> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("exam_documents").select("id,exam_id,title,notes,file_url,created_at")
      .eq("exam_id", examId).order("created_at", { ascending: false });
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => ({
      id: str(r.id), examId: str(r.exam_id), title: str(r.title),
      notes: r.notes ? str(r.notes) : null, fileUrl: r.file_url ? str(r.file_url) : null,
      createdAt: str(r.created_at),
    }));
  }

  async addExamDocument(input: { examId: string; title: string; notes: string | null; file?: File | null }): Promise<ExamDocument> {
    const sb = await this.sb();
    const uid = await this.userId();
    let fileUrl: string | null = null;
    if (input.file) {
      const path = `${uid}/${Date.now()}-${input.file.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await sb.storage.from("exam-docs").upload(path, input.file, { upsert: false });
      if (up.error) fail(up.error, "up");
      fileUrl = path; // özel kova: yol saklanıyor, gerektiğinde imzalı URL üretilir
    }
    const { data, error } = await sb
      .from("exam_documents")
      .insert({ exam_id: input.examId, uploaded_by: uid, title: input.title, notes: input.notes, file_url: fileUrl })
      .select("id,exam_id,title,notes,file_url,created_at").single();
    if (error) fail(error, "sorgu");
    const r = data as Row;
    return {
      id: str(r.id), examId: str(r.exam_id), title: str(r.title),
      notes: r.notes ? str(r.notes) : null, fileUrl: r.file_url ? str(r.file_url) : null,
      createdAt: str(r.created_at),
    };
  }

  /* Tepkileri ve yorum sayısını tek seferde toplayıp gönderilere dağıtıyoruz;
     gönderi başına ayrı sorgu atmak listeyi N+1'e çevirirdi. */
  private async decorate(posts: Row[], me: string): Promise<Post[]> {
    const sb = await this.sb();
    const ids = posts.map((p) => str(p.id));
    if (ids.length === 0) return [];
    const [media, reacts, comms, marks] = await Promise.all([
      sb.from("post_media").select("id,post_id,url,kind,position").in("post_id", ids).order("position"),
      sb.from("reactions").select("post_id,emoji,user_id").in("post_id", ids),
      sb.from("comments").select("id,post_id").in("post_id", ids),
      sb.from("bookmarks").select("post_id").eq("user_id", me).in("post_id", ids),
    ]);
    if (media.error) fail(media.error, "media");
    if (reacts.error) fail(reacts.error, "reacts");
    if (comms.error) fail(comms.error, "comms");
    if (marks.error) fail(marks.error, "marks");
    const marked = new Set((marks.data as Row[]).map((m) => str(m.post_id)));

    return posts.map((p) => {
      const id = str(p.id);
      const rs = (reacts.data as Row[]).filter((r) => str(r.post_id) === id);
      const counts: Record<string, number> = {};
      for (const r of rs) counts[str(r.emoji)] = (counts[str(r.emoji)] ?? 0) + 1;
      return {
        id,
        authorId: str(p.author_id),
        author: this.toProfile(p.profiles as Row | null),
        body: str(p.body),
        examId: p.exam_id ? str(p.exam_id) : null,
        media: (media.data as Row[]).filter((m) => str(m.post_id) === id).map((m) => ({
          id: str(m.id), url: str(m.url), kind: str(m.kind) as MediaKind, position: num(m.position),
        })),
        createdAt: str(p.created_at),
        editedAt: p.edited_at ? str(p.edited_at) : null,
        bookmarked: marked.has(id),
        reactions: counts,
        myReactions: rs.filter((r) => str(r.user_id) === me).map((r) => str(r.emoji)),
        commentCount: (comms.data as Row[]).filter((c) => str(c.post_id) === id).length,
      };
    });
  }

  async listPosts(limit = 40): Promise<Post[]> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("posts")
      .select("id,author_id,body,exam_id,created_at,edited_at,profiles!posts_author_id_fkey(id,display_name,handle,bio,avatar_emoji,avatar_url,exam_id,grade,school,city,exam_year,target_university,target_department,target_rank,weekly_hours,study_style,strong_subjects,weak_subjects,goals,is_public,streak_days,longest_streak,created_at,onboarded_at)")
      .order("created_at", { ascending: false }).limit(limit);
    if (error) fail(error, "sorgu");
    return this.decorate(data as Row[], await this.userId());
  }

  async createPost(input: NewPost): Promise<Post> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("posts")
      .insert({ author_id: await this.userId(), body: input.body, exam_id: input.examId })
      .select("id").single();
    if (error) fail(error, "sorgu");
    const postId = str((data as Row).id);
    if (input.media.length) {
      const { error: mErr } = await sb.from("post_media").insert(
        input.media.map((m, i) => ({ post_id: postId, url: m.url, kind: m.kind, position: i })),
      );
      if (mErr) fail(mErr, "post_media");
    }
    const all = await this.listPosts(1);
    return all[0];
  }

  async deletePost(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("posts").delete().eq("id", id);
    if (error) fail(error, "sorgu");
  }

  async listComments(postId: string): Promise<Comment[]> {
    const sb = await this.sb();
    const me = await this.userId();
    const [c, r] = await Promise.all([
      sb.from("comments")
        .select("id,post_id,parent_id,author_id,body,gif_url,created_at,profiles!comments_author_id_fkey(id,display_name,handle,bio,avatar_emoji,avatar_url,exam_id,grade,school,city,exam_year,target_university,target_department,target_rank,weekly_hours,study_style,strong_subjects,weak_subjects,goals,is_public,streak_days,longest_streak,created_at,onboarded_at)")
        .eq("post_id", postId).order("created_at"),
      sb.from("reactions").select("comment_id,emoji,user_id").not("comment_id", "is", null),
    ]);
    if (c.error) fail(c.error, "c");
    if (r.error) fail(r.error, "r");
    return (c.data as Row[]).map((row) => {
      const id = str(row.id);
      const rs = (r.data as Row[]).filter((x) => str(x.comment_id) === id);
      const counts: Record<string, number> = {};
      for (const x of rs) counts[str(x.emoji)] = (counts[str(x.emoji)] ?? 0) + 1;
      return {
        id, postId: str(row.post_id),
        parentId: row.parent_id ? str(row.parent_id) : null,
        authorId: str(row.author_id),
        author: this.toProfile(row.profiles as Row | null),
        body: str(row.body),
        gifUrl: row.gif_url ? str(row.gif_url) : null,
        createdAt: str(row.created_at),
        reactions: counts,
        myReactions: rs.filter((x) => str(x.user_id) === me).map((x) => str(x.emoji)),
      };
    });
  }

  async addComment(input: { postId: string; parentId: string | null; body: string; gifUrl: string | null }): Promise<Comment> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("comments")
      .insert({ post_id: input.postId, parent_id: input.parentId, author_id: await this.userId(), body: input.body, gif_url: input.gifUrl })
      .select("id").single();
    if (error) fail(error, "sorgu");
    const id = str((data as Row).id);
    const all = await this.listComments(input.postId);
    return all.find((c) => c.id === id)!;
  }

  async deleteComment(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("comments").delete().eq("id", id);
    if (error) fail(error, "sorgu");
  }

  async toggleReaction(target: { postId?: string; commentId?: string }, emoji: string): Promise<void> {
    const sb = await this.sb();
    const uid = await this.userId();
    const col = target.postId ? "post_id" : "comment_id";
    const val = target.postId ?? target.commentId!;
    const { data } = await sb.from("reactions").select("emoji").eq("user_id", uid).eq(col, val).eq("emoji", emoji).maybeSingle();
    if (data) {
      const { error } = await sb.from("reactions").delete().eq("user_id", uid).eq(col, val).eq("emoji", emoji);
      if (error) fail(error, "sorgu");
    } else {
      const { error } = await sb.from("reactions").insert({ user_id: uid, [col]: val, emoji });
      if (error) fail(error, "sorgu");
    }
  }

  async uploadImage(file: File): Promise<{ url: string; kind: MediaKind }> {
    const sb = await this.sb();
    const uid = await this.userId();
    const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error } = await sb.storage.from("feed").upload(path, file, { upsert: false, contentType: file.type });
    if (error) fail(error, "sorgu");
    const { data } = sb.storage.from("feed").getPublicUrl(path);
    return { url: data.publicUrl, kind: file.type === "image/gif" ? "gif" : "image" };
  }

  /* --------------------------------------------------- profil / sosyal */

  async getProfileByHandle(handle: string): Promise<Profile | null> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("profiles").select(SupabaseRepo.PROFILE_COLS).ilike("handle", handle).maybeSingle();
    if (error) fail(error, "sorgu");
    return this.toProfile(data as Row | null);
  }

  /* Sayımlar veritabanında: istemciye satır indirip saymıyoruz. */
  async getProfileStats(userId: string): Promise<ProfileStats> {
    const sb = await this.sb();
    const c = (q: PromiseLike<{ count: number | null }>) => q;
    const [ss, fin, le, tp, po, fr, fg] = await Promise.all([
      c(sb.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", userId)),
      c(sb.from("sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "finished")),
      sb.from("learning_evidence").select("closed_by_teaching").eq("user_id", userId),
      sb.from("teaching_profile").select("total").eq("user_id", userId),
      c(sb.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId)),
      c(sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId)),
      c(sb.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId)),
    ]);
    return {
      sessions: ss.count ?? 0,
      finishedSessions: fin.count ?? 0,
      closedByTeaching: ((le.data ?? []) as Row[]).reduce((n, r) => n + num(r.closed_by_teaching), 0),
      moments: ((tp.data ?? []) as Row[]).reduce((n, r) => n + num(r.total), 0),
      posts: po.count ?? 0,
      followers: fr.count ?? 0,
      following: fg.count ?? 0,
    };
  }

  async uploadAvatar(file: File): Promise<string> {
    const sb = await this.sb();
    const uid = await this.userId();
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${uid}/avatar-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) fail(error, "sorgu");
    const { data } = sb.storage.from("avatars").getPublicUrl(path);
    await this.updateProfile({ avatarUrl: data.publicUrl });
    return data.publicUrl;
  }

  async removeAvatar(): Promise<void> {
    await this.updateProfile({ avatarUrl: null });
  }

  async getFollowState(userId: string): Promise<FollowState> {
    const sb = await this.sb();
    const me = await this.userId();
    const [mine, fr, fg] = await Promise.all([
      sb.from("follows").select("follower_id").eq("follower_id", me).eq("following_id", userId).maybeSingle(),
      sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
      sb.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    return { following: Boolean(mine.data), followers: fr.count ?? 0, followingCount: fg.count ?? 0 };
  }

  async toggleFollow(userId: string): Promise<boolean> {
    const sb = await this.sb();
    const me = await this.userId();
    const { data } = await sb.from("follows").select("follower_id").eq("follower_id", me).eq("following_id", userId).maybeSingle();
    if (data) {
      const { error } = await sb.from("follows").delete().eq("follower_id", me).eq("following_id", userId);
      if (error) fail(error, "sorgu");
      return false;
    }
    const { error } = await sb.from("follows").insert({ follower_id: me, following_id: userId });
    if (error) fail(error, "sorgu");
    return true;
  }

  async listNotifications(limit = 30): Promise<AppNotification[]> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("notifications")
      .select(`id,kind,post_id,comment_id,read_at,created_at,actor:profiles!notifications_actor_id_fkey(${SupabaseRepo.PROFILE_COLS})`)
      .order("created_at", { ascending: false }).limit(limit);
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => ({
      id: str(r.id),
      kind: str(r.kind) as AppNotification["kind"],
      actor: this.toProfile(r.actor as Row | null),
      postId: r.post_id ? str(r.post_id) : null,
      commentId: r.comment_id ? str(r.comment_id) : null,
      readAt: r.read_at ? str(r.read_at) : null,
      createdAt: str(r.created_at),
    }));
  }

  async unreadCount(): Promise<number> {
    const sb = await this.sb();
    const { count, error } = await sb
      .from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    if (error) fail(error, "sorgu");
    return count ?? 0;
  }

  async markNotificationsRead(): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb
      .from("notifications").update({ read_at: new Date().toISOString() })
      .is("read_at", null).eq("user_id", await this.userId());
    if (error) fail(error, "sorgu");
  }

  async report(
    target: { postId?: string; commentId?: string; profileId?: string },
    reason: ReportReason, note: string | null,
  ): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("reports").insert({
      reporter_id: await this.userId(),
      post_id: target.postId ?? null,
      comment_id: target.commentId ?? null,
      profile_id: target.profileId ?? null,
      reason, note,
    });
    if (error) fail(error, "sorgu");
  }

  async toggleBlock(userId: string): Promise<boolean> {
    const sb = await this.sb();
    const me = await this.userId();
    const { data } = await sb.from("blocks").select("blocker_id").eq("blocker_id", me).eq("blocked_id", userId).maybeSingle();
    if (data) {
      const { error } = await sb.from("blocks").delete().eq("blocker_id", me).eq("blocked_id", userId);
      if (error) fail(error, "sorgu");
      return false;
    }
    const { error } = await sb.from("blocks").insert({ blocker_id: me, blocked_id: userId });
    if (error) fail(error, "sorgu");
    return true;
  }

  async listBlocked(): Promise<string[]> {
    const sb = await this.sb();
    const { data, error } = await sb.from("blocks").select("blocked_id").eq("blocker_id", await this.userId());
    if (error) fail(error, "sorgu");
    return (data as Row[]).map((r) => str(r.blocked_id));
  }

  /* İmleç = son gönderinin created_at'i. Sayfa numarası yerine imleç:
     araya yeni gönderi girince kayma olmuyor. */
  async listFeed(scope: FeedScope, cursor: string | null, limit = 15): Promise<FeedPage> {
    const sb = await this.sb();
    const me = await this.userId();

    let ids: string[] | null = null;
    if (scope === "following") {
      const { data } = await sb.from("follows").select("following_id").eq("follower_id", me);
      ids = [...(data as Row[] ?? []).map((r) => str(r.following_id)), me];
    } else if (scope === "bookmarks") {
      const { data } = await sb.from("bookmarks").select("post_id").eq("user_id", me);
      const postIds = (data as Row[] ?? []).map((r) => str(r.post_id));
      if (postIds.length === 0) return { posts: [], nextCursor: null };
      let q = sb.from("posts")
        .select(`id,author_id,body,exam_id,created_at,edited_at,profiles!posts_author_id_fkey(${SupabaseRepo.PROFILE_COLS})`)
        .in("id", postIds).order("created_at", { ascending: false }).limit(limit + 1);
      if (cursor) q = q.lt("created_at", cursor);
      const { data: rows, error } = await q;
      if (error) fail(error, "sorgu");
      return this.page(rows as Row[], me, limit);
    }

    let q = sb.from("posts")
      .select(`id,author_id,body,exam_id,created_at,edited_at,profiles!posts_author_id_fkey(${SupabaseRepo.PROFILE_COLS})`)
      .order("created_at", { ascending: false }).limit(limit + 1);
    if (ids) q = q.in("author_id", ids);
    if (cursor) q = q.lt("created_at", cursor);
    const { data, error } = await q;
    if (error) fail(error, "sorgu");
    return this.page(data as Row[], me, limit);
  }

  private async page(rows: Row[], me: string, limit: number): Promise<FeedPage> {
    const more = rows.length > limit;
    const slice = more ? rows.slice(0, limit) : rows;
    const posts = await this.decorate(slice, me);
    return { posts, nextCursor: more ? str(slice[slice.length - 1].created_at) : null };
  }

  async updatePost(id: string, body: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("posts").update({ body, edited_at: new Date().toISOString() }).eq("id", id);
    if (error) fail(error, "sorgu");
  }

  async toggleBookmark(postId: string): Promise<boolean> {
    const sb = await this.sb();
    const me = await this.userId();
    const { data } = await sb.from("bookmarks").select("post_id").eq("user_id", me).eq("post_id", postId).maybeSingle();
    if (data) {
      const { error } = await sb.from("bookmarks").delete().eq("user_id", me).eq("post_id", postId);
      if (error) fail(error, "sorgu");
      return false;
    }
    const { error } = await sb.from("bookmarks").insert({ user_id: me, post_id: postId });
    if (error) fail(error, "sorgu");
    return true;
  }

  /* ------------------------------------------- kendi sınavının müfredatı */

  private slug(s: string): string {
    return s.toLocaleLowerCase("tr")
      .replaceAll("ı", "i").replaceAll("İ", "i").replaceAll("ş", "s").replaceAll("ğ", "g")
      .replaceAll("ü", "u").replaceAll("ö", "o").replaceAll("ç", "c")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "konu";
  }

  async updateExam(id: string, patch: { name?: string; description?: string | null }): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("exams").update(patch).eq("id", id);
    if (error) fail(error, "exams.update");
    this.curriculum = null;
  }

  async deleteExam(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("exams").delete().eq("id", id);
    if (error) fail(error, "exams.delete");
    this.curriculum = null;
  }

  async addSubject(examId: string, name: string): Promise<void> {
    const sb = await this.sb();
    const { count } = await sb.from("subjects").select("id", { count: "exact", head: true }).eq("exam_id", examId);
    const { error } = await sb.from("subjects")
      .insert({ exam_id: examId, slug: this.slug(name), name, position: (count ?? 0) + 1 });
    if (error) fail(error, "subjects.insert");
    this.curriculum = null;
  }

  async addTopic(subjectId: string, name: string, concepts: string[]): Promise<void> {
    const sb = await this.sb();
    const { count } = await sb.from("topics").select("id", { count: "exact", head: true }).eq("subject_id", subjectId);
    const { data, error } = await sb.from("topics")
      .insert({ subject_id: subjectId, slug: this.slug(name), name, position: (count ?? 0) + 1 })
      .select("id").single();
    if (error) fail(error, "topics.insert");
    const topicId = str((data as Row).id);
    const rows = concepts.map((c, i) => ({ topic_id: topicId, slug: this.slug(c), name: c, position: i + 1 }));
    if (rows.length) {
      const { error: cErr } = await sb.from("concepts").insert(rows);
      if (cErr) fail(cErr, "concepts.insert");
    }
    this.curriculum = null;
  }

  async deleteTopic(topicId: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("topics").delete().eq("id", topicId);
    if (error) fail(error, "topics.delete");
    this.curriculum = null;
  }

  async deleteExamDocument(id: string): Promise<void> {
    const sb = await this.sb();
    const { data } = await sb.from("exam_documents").select("file_url").eq("id", id).maybeSingle();
    const path = data ? (data as Row).file_url : null;
    const { error } = await sb.from("exam_documents").delete().eq("id", id);
    if (error) fail(error, "exam_documents.delete");
    /* Kayıt gitti; dosyayı da temizle. Başarısız olursa kayıt yine silinmiş olur. */
    if (path) await sb.storage.from("exam-docs").remove([str(path)]).catch(() => undefined);
  }

  /* exam-docs özel kova: kalıcı URL yok, kısa ömürlü imzalı bağlantı üretiyoruz. */
  async documentUrl(path: string): Promise<string | null> {
    const sb = await this.sb();
    const { data, error } = await sb.storage.from("exam-docs").createSignedUrl(path, 300);
    if (error) return null;
    return data?.signedUrl ?? null;
  }

  /* -------------------------------------------------------------- arama */

  async search(query: string, limit = 8): Promise<{ people: Profile[]; posts: Post[] }> {
    const q = query.trim();
    if (q.length < 2) return { people: [], posts: [] };
    const sb = await this.sb();
    /* ilike kalıbındaki % ve _ kullanıcıdan gelmemeli: yoksa tek bir "%"
       bütün kayıtları getirir. */
    const safe = q.replace(/[%_\\]/g, (c) => `\\${c}`);

    const [people, posts] = await Promise.all([
      sb.from("profiles")
        .select(SupabaseRepo.PROFILE_COLS)
        .or(`display_name.ilike.%${safe}%,handle.ilike.%${safe}%`)
        .limit(limit),
      sb.from("posts")
        .select(`id,author_id,body,exam_id,created_at,edited_at,profiles!posts_author_id_fkey(${SupabaseRepo.PROFILE_COLS})`)
        .ilike("body", `%${safe}%`)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);
    if (people.error) fail(people.error, "sorgu");
    if (posts.error) fail(posts.error, "sorgu");

    return {
      people: ((people.data as Row[]) ?? []).map((r) => this.toProfile(r)!).filter(Boolean),
      posts: ((posts.data as Row[]) ?? []).map((r) => ({
        id: str(r.id),
        authorId: str(r.author_id),
        author: this.toProfile(r.profiles as Row | null),
        body: str(r.body),
        examId: r.exam_id ? str(r.exam_id) : null,
        createdAt: str(r.created_at),
        editedAt: r.edited_at ? str(r.edited_at) : null,
        media: [],
        reactions: {},
        myReactions: [],
        commentCount: 0,
        bookmarked: false,
      })),
    };
  }

  /* --------------------------------------------------------- mesajlaşma */

  private toDm(r: Row): DmMessage {
    return {
      id: str(r.id),
      threadId: str(r.thread_id),
      senderId: str(r.sender_id),
      body: str(r.body),
      createdAt: str(r.created_at),
    };
  }

  async listThreads(): Promise<DmThread[]> {
    const sb = await this.sb();
    const me = await this.userId();

    /* Kendi üyeliklerim: kanal listesi + en son ne zaman okuduğum */
    const { data: mine, error: e1 } = await sb
      .from("dm_members")
      .select(`thread_id,last_read_at,dm_threads!inner(id,last_message_at)`)
      .eq("user_id", me);
    if (e1) fail(e1, "sorgu");
    const rows = (mine as Row[]) ?? [];
    if (rows.length === 0) return [];

    const ids = rows.map((r) => str(r.thread_id));

    /* Karşı taraflar tek sorguda: kanal başına ikinci üye */
    const { data: others, error: e2 } = await sb
      .from("dm_members")
      .select(`thread_id,profiles!inner(${SupabaseRepo.PROFILE_COLS})`)
      .in("thread_id", ids)
      .neq("user_id", me);
    if (e2) fail(e2, "sorgu");

    /* Son mesaj ve okunmamış sayısı: kanalların tüm mesajları yerine
       yalnızca son 200 satır — liste ekranı için fazlasıyla yeterli. */
    const { data: msgs, error: e3 } = await sb
      .from("dm_messages")
      .select("id,thread_id,sender_id,body,created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: false })
      .limit(200);
    if (e3) fail(e3, "sorgu");

    const otherOf = new Map<string, Profile | null>();
    for (const r of (others as Row[]) ?? []) {
      otherOf.set(str(r.thread_id), this.toProfile(r.profiles as Row | null));
    }
    const last = new Map<string, Row>();
    const unread = new Map<string, number>();
    for (const r of (msgs as Row[]) ?? []) {
      const tid = str(r.thread_id);
      if (!last.has(tid)) last.set(tid, r);
      const seen = rows.find((x) => str(x.thread_id) === tid);
      if (str(r.sender_id) !== me && seen && str(r.created_at) > str(seen.last_read_at)) {
        unread.set(tid, (unread.get(tid) ?? 0) + 1);
      }
    }

    return rows
      .map((r) => {
        const tid = str(r.thread_id);
        const thread = r.dm_threads as Row;
        const lastRow = last.get(tid);
        return {
          id: tid,
          other: otherOf.get(tid) ?? null,
          lastMessage: lastRow ? str(lastRow.body) : null,
          lastMessageAt: str(thread.last_message_at),
          unread: unread.get(tid) ?? 0,
        };
      })
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
  }

  async openThread(userId: string): Promise<string> {
    const sb = await this.sb();
    /* Kanal açmak iki tabloya yazmayı gerektiriyor; veritabanı işlevi
       engel kontrolünü de yapıyor. */
    const { data, error } = await sb.rpc("dm_kanal_ac", { hedef: userId });
    if (error) fail(error, "sorgu");
    return String(data);
  }

  async listMessages(threadId: string, before: string | null = null, limit = 40): Promise<DmMessage[]> {
    const sb = await this.sb();
    let q = sb
      .from("dm_messages")
      .select("id,thread_id,sender_id,body,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) q = q.lt("created_at", before);
    const { data, error } = await q;
    if (error) fail(error, "sorgu");
    /* Ekranda eskiden yeniye */
    return ((data as Row[]) ?? []).map((r) => this.toDm(r)).reverse();
  }

  async sendMessage(threadId: string, body: string): Promise<DmMessage> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("dm_messages")
      .insert({ thread_id: threadId, sender_id: await this.userId(), body })
      .select("id,thread_id,sender_id,body,created_at").single();
    if (error) fail(error, "sorgu");
    return this.toDm(data as Row);
  }

  async deleteMessage(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("dm_messages").delete().eq("id", id);
    if (error) fail(error, "sorgu");
  }

  async markThreadRead(threadId: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb
      .from("dm_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("user_id", await this.userId());
    if (error) fail(error, "sorgu");
  }

  async unreadMessageCount(): Promise<number> {
    const threads = await this.listThreads();
    return threads.reduce((n, t) => n + t.unread, 0);
  }

  subscribeMessages(threadId: string, onMessage: (m: DmMessage) => void): () => void {
    /* Anlık akış: karşı taraf yazdığında yenilemeye gerek kalmasın.
       Bağlantı kurulamazsa sohbet yine çalışır, yalnızca gecikmeli olur. */
    const sb = getSupabase();
    const channel = sb
      .channel(`dm:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => onMessage(this.toDm(payload.new as Row)),
      )
      .subscribe();
    return () => { void sb.removeChannel(channel); };
  }
}
