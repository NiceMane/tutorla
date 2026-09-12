"use client";
/* Supabase veri katmanı. Metotlar local.ts ile aynı sözleşmeyi uygular;
   fark yalnızca verinin nereden geldiği. */
import { getSupabase } from "@/lib/supabase";
import type {
  Concept, ConceptState, ConceptStatus, Gap, Message, MessageRole, Moment, MomentKind,
  Persona, PersonaCode, Session, SessionStatus, Subject, TeachingProfile, Topic, TopicProgress,
} from "@/lib/domain";
import type { Curriculum, Repo, SessionDetail } from "./types";

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
    const { data, error } = await sb.from("concept_states").select("concept_id,status,session_id,updated_at").in("concept_id", ids);
    if (error) throw error;
    return (data as Row[]).map((r) => ({
      conceptId: str(r.concept_id), status: str(r.status) as ConceptStatus,
      sessionId: r.session_id ? str(r.session_id) : null, updatedAt: str(r.updated_at),
    }));
  }

  private toSession(r: Row): Session {
    return {
      id: str(r.id), topicId: str(r.topic_id),
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
      .select("id,topic_id,status,started_at,ended_at,note,personas(code)")
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
      .select("id,topic_id,status,started_at,ended_at,note,personas(code)")
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

  async createSession(topicId: string, personaId: PersonaCode): Promise<Session> {
    const sb = await this.sb();
    if (this.personaByCode.size === 0) await this.getPersonas();
    const personaUuid = this.personaByCode.get(personaId);
    if (!personaUuid) throw new Error(`Persona bulunamadı: ${personaId}`);
    const { data, error } = await sb
      .from("sessions")
      .insert({ user_id: await this.userId(), topic_id: topicId, persona_id: personaUuid })
      .select("id,topic_id,status,started_at,ended_at,note")
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
    if (status === "gap") {
      const { data } = await sb.from("concept_states").select("status").eq("concept_id", conceptId).maybeSingle();
      if (data && str((data as Row).status) === "settled") return;
    }
    const { error } = await sb
      .from("concept_states")
      .upsert(
        { user_id: userId, concept_id: conceptId, status, session_id: sessionId, updated_at: new Date().toISOString() },
        { onConflict: "user_id,concept_id" },
      );
    if (error) throw error;
  }
}
