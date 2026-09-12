"use client";
/* Supabase veri katmanı. Metotlar local.ts ile aynı sözleşmeyi uygular;
   fark yalnızca verinin nereden geldiği. */
import { getSupabase } from "@/lib/supabase";
import type {
  Comment, Concept, ConceptState, ConceptStatus, Exam, ExamDocument, Gap,
  LearningEvidence, MediaKind, Message, MessageRole, Moment, MomentKind,
  Persona, PersonaCode, Post, Profile, Session, SessionMode, SessionStatus,
  Subject, TeachingProfile, Topic, TopicProgress,
} from "@/lib/domain";
import type { Curriculum, Repo, SessionDetail } from "./types";
import type { NewPost } from "./social";

type Row = Record<string, unknown>;
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
    if (s.error) throw s.error;
    if (t.error) throw t.error;
    if (c.error) throw c.error;

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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
    if (!data) return null;
    const p = (data as Row).personas as { code?: string } | null;
    const session = this.toSession({ ...(data as Row), persona_code: p?.code });

    const [m, g, mo, states] = await Promise.all([
      sb.from("messages").select("id,session_id,role,content,position,created_at").eq("session_id", id).order("position"),
      sb.from("gaps").select("id,session_id,message_id,concept_id,label,created_at").eq("session_id", id),
      sb.from("moments").select("id,session_id,message_id,concept_id,kind,label,created_at").eq("session_id", id),
      this.getConceptStates(session.topicId),
    ]);
    if (m.error) throw m.error;
    if (g.error) throw g.error;
    if (mo.error) throw mo.error;

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
    if (error) throw error;
    return this.toSession({ ...(data as Row), persona_code: personaId });
  }

  async finishSession(sessionId: string, note: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb
      .from("sessions")
      .update({ status: "finished", ended_at: new Date().toISOString(), note })
      .eq("id", sessionId);
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
    return (data as Row[]).map((r) => ({
      topicId: str(r.topic_id), closedByTeaching: num(r.closed_by_teaching), settled: num(r.settled),
    }));
  }

  /* Toplama veritabanında yapılıyor — istemci satır saymıyor */
  async getTeachingProfile(): Promise<TeachingProfile[]> {
    const sb = await this.sb();
    const { data, error } = await sb.from("teaching_profile").select("kind,total,last_at");
    if (error) throw error;
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
    if (error) throw error;
  }

  /* ---------------------------------------------------------- sosyal taraf */

  private toProfile(r: Row | null | undefined): Profile | null {
    if (!r) return null;
    return {
      id: str(r.id),
      displayName: r.display_name ? str(r.display_name) : null,
      handle: r.handle ? str(r.handle) : null,
      bio: r.bio ? str(r.bio) : null,
      avatarEmoji: str(r.avatar_emoji) || "🦉",
      examId: r.exam_id ? str(r.exam_id) : null,
    };
  }

  async getMyProfile(): Promise<Profile | null> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("profiles").select("id,display_name,handle,bio,avatar_emoji,exam_id")
      .eq("id", await this.userId()).maybeSingle();
    if (error) throw error;
    return this.toProfile(data as Row | null);
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const sb = await this.sb();
    const row: Row = {};
    if ("displayName" in patch) row.display_name = patch.displayName;
    if ("handle" in patch) row.handle = patch.handle;
    if ("bio" in patch) row.bio = patch.bio;
    if ("avatarEmoji" in patch) row.avatar_emoji = patch.avatarEmoji;
    if ("examId" in patch) row.exam_id = patch.examId;
    const { data, error } = await sb
      .from("profiles").update(row).eq("id", await this.userId())
      .select("id,display_name,handle,bio,avatar_emoji,exam_id").single();
    if (error) throw error;
    return this.toProfile(data as Row)!;
  }

  async listExams(): Promise<Exam[]> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("exams").select("id,code,name,description,position,active,created_by").order("position");
    if (error) throw error;
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
    if (error) throw error;
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
    if (error) throw error;
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
      if (up.error) throw up.error;
      fileUrl = path; // özel kova: yol saklanıyor, gerektiğinde imzalı URL üretilir
    }
    const { data, error } = await sb
      .from("exam_documents")
      .insert({ exam_id: input.examId, uploaded_by: uid, title: input.title, notes: input.notes, file_url: fileUrl })
      .select("id,exam_id,title,notes,file_url,created_at").single();
    if (error) throw error;
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
    const [media, reacts, comms] = await Promise.all([
      sb.from("post_media").select("id,post_id,url,kind,position").in("post_id", ids).order("position"),
      sb.from("reactions").select("post_id,emoji,user_id").in("post_id", ids),
      sb.from("comments").select("id,post_id").in("post_id", ids),
    ]);
    if (media.error) throw media.error;
    if (reacts.error) throw reacts.error;
    if (comms.error) throw comms.error;

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
      .select("id,author_id,body,exam_id,created_at,profiles(id,display_name,handle,bio,avatar_emoji,exam_id)")
      .order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return this.decorate(data as Row[], await this.userId());
  }

  async createPost(input: NewPost): Promise<Post> {
    const sb = await this.sb();
    const { data, error } = await sb
      .from("posts")
      .insert({ author_id: await this.userId(), body: input.body, exam_id: input.examId })
      .select("id").single();
    if (error) throw error;
    const postId = str((data as Row).id);
    if (input.media.length) {
      const { error: mErr } = await sb.from("post_media").insert(
        input.media.map((m, i) => ({ post_id: postId, url: m.url, kind: m.kind, position: i })),
      );
      if (mErr) throw mErr;
    }
    const all = await this.listPosts(1);
    return all[0];
  }

  async deletePost(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("posts").delete().eq("id", id);
    if (error) throw error;
  }

  async listComments(postId: string): Promise<Comment[]> {
    const sb = await this.sb();
    const me = await this.userId();
    const [c, r] = await Promise.all([
      sb.from("comments")
        .select("id,post_id,parent_id,author_id,body,gif_url,created_at,profiles(id,display_name,handle,bio,avatar_emoji,exam_id)")
        .eq("post_id", postId).order("created_at"),
      sb.from("reactions").select("comment_id,emoji,user_id").not("comment_id", "is", null),
    ]);
    if (c.error) throw c.error;
    if (r.error) throw r.error;
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
    if (error) throw error;
    const id = str((data as Row).id);
    const all = await this.listComments(input.postId);
    return all.find((c) => c.id === id)!;
  }

  async deleteComment(id: string): Promise<void> {
    const sb = await this.sb();
    const { error } = await sb.from("comments").delete().eq("id", id);
    if (error) throw error;
  }

  async toggleReaction(target: { postId?: string; commentId?: string }, emoji: string): Promise<void> {
    const sb = await this.sb();
    const uid = await this.userId();
    const col = target.postId ? "post_id" : "comment_id";
    const val = target.postId ?? target.commentId!;
    const { data } = await sb.from("reactions").select("emoji").eq("user_id", uid).eq(col, val).eq("emoji", emoji).maybeSingle();
    if (data) {
      const { error } = await sb.from("reactions").delete().eq("user_id", uid).eq(col, val).eq("emoji", emoji);
      if (error) throw error;
    } else {
      const { error } = await sb.from("reactions").insert({ user_id: uid, [col]: val, emoji });
      if (error) throw error;
    }
  }

  async uploadImage(file: File): Promise<{ url: string; kind: MediaKind }> {
    const sb = await this.sb();
    const uid = await this.userId();
    const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error } = await sb.storage.from("feed").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = sb.storage.from("feed").getPublicUrl(path);
    return { url: data.publicUrl, kind: file.type === "image/gif" ? "gif" : "image" };
  }
}
