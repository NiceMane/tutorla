/* Tarayıcı deposu — Supabase bağlanana kadar.
   Müfredat curriculum.ts'ten türetilir (id'ler slug tabanlı ve kararlı),
   kullanıcı verisi localStorage'da tutulur. Kayıt şekli şemayla aynı,
   böylece Supabase'e geçiş satır satır eşleşir. */
import { CURRICULUM, EXAM, PERSONAS } from "@/lib/curriculum";
import type {
  Comment, Concept, ConceptState, ConceptStatus, DmMessage, DmThread, Exam, ExamDocument, Gap,
  LearningEvidence, MediaKind, Message, MessageRole, Moment, MomentKind,
  AppNotification, FollowState, Persona, PersonaCode, Post, Profile, ProfileStats,
  Session, SessionMode,
  Subject, TeachingProfile, Topic, TopicProgress,
} from "@/lib/domain";
import type { Curriculum, Repo, SessionDetail } from "./types";
import type { FeedPage, FeedScope, NewPost } from "./social";

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
  profile?: Profile;
  exams: Exam[];
  docs: ExamDocument[];
  posts: Post[];
  comments: Comment[];
  sessions: Session[];
  messages: Message[];
  gaps: Gap[];
  moments: Moment[];
  states: (ConceptState & { conceptId: string })[];
  dms?: DmMessage[];
};

const empty: Store = { exams: [], docs: [], posts: [], comments: [], sessions: [], messages: [], gaps: [], moments: [], states: [], dms: [] };

function read(): Store {
  if (typeof window === "undefined") return { ...empty };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const p = JSON.parse(raw) as Partial<Store>;
    return {
      profile: p.profile,
      exams: p.exams ?? [],
      docs: p.docs ?? [],
      posts: p.posts ?? [],
      comments: p.comments ?? [],
      sessions: p.sessions ?? [],
      messages: p.messages ?? [],
      gaps: p.gaps ?? [],
      moments: p.moments ?? [],
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
      moments: st.moments.filter((m) => m.sessionId === id),
      states: st.states.filter((s) => ids.has(s.conceptId)),
    };
  }

  async createSession(topicId_: string, personaId: PersonaCode, mode: SessionMode = "teach"): Promise<Session> {
    const st = read();
    const session: Session = {
      id: uid(),
      mode,
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

  async addMoment(sessionId: string, messageId: string | null, conceptId_: string | null, kind: MomentKind, label: string): Promise<Moment> {
    const st = read();
    const moment: Moment = { id: uid(), sessionId, messageId, conceptId: conceptId_, kind, label, createdAt: new Date().toISOString() };
    st.moments.push(moment);
    write(st);
    return moment;
  }

  /* Anlatarak kapatılan kavramlar — protégé effect'in izi */
  async getLearningEvidence(): Promise<LearningEvidence[]> {
    const st = read();
    const by = new Map(st.states.map((x) => [x.conceptId, x]));
    return CUR.topics.map((t) => {
      const cs = CUR.concepts.filter((c) => c.topicId === t.id);
      let closed = 0, settled = 0;
      for (const c of cs) {
        const x = by.get(c.id);
        if (x?.status === "settled") {
          settled++;
          if (x.wasGap) closed++;
        }
      }
      return { topicId: t.id, closedByTeaching: closed, settled };
    }).filter((x) => x.settled > 0);
  }

  async getTeachingProfile(): Promise<TeachingProfile[]> {
    const st = read();
    const by = new Map<MomentKind, TeachingProfile>();
    for (const m of st.moments) {
      const cur = by.get(m.kind) ?? { kind: m.kind, total: 0, lastAt: null };
      cur.total += 1;
      if (!cur.lastAt || m.createdAt > cur.lastAt) cur.lastAt = m.createdAt;
      by.set(m.kind, cur);
    }
    return [...by.values()].sort((a, b) => b.total - a.total);
  }

  async setConceptStatus(conceptId_: string, status: ConceptStatus, sessionId: string | null): Promise<void> {
    const st = read();
    const now = new Date().toISOString();
    const found = st.states.find((s) => s.conceptId === conceptId_);
    if (found) {
      /* Bir kez oturmuş kavram, sonraki bir boşlukla geri düşmesin */
      if (status === "gap") found.wasGap = true;
      /* Bir kez oturmuş kavram, sonraki bir boşlukla geri düşmesin */
      if (found.status === "settled" && status === "gap") return;
      found.status = status;
      found.sessionId = sessionId;
      found.updatedAt = now;
    } else {
      st.states.push({ conceptId: conceptId_, status, wasGap: status === "gap", sessionId, updatedAt: now });
    }
    write(st);
  }

  /* ---------------------------------------------------------- sosyal taraf
     Tarayıcı deposunda akış tek kişiliktir; paylaşım ancak Supabase ile anlam
     kazanır. Yine de çökmesin diye burada da çalışıyor. */

  async getMyProfile(): Promise<Profile | null> {
    const st = read();
    return st.profile ?? {
      id: "local", displayName: "Sen", handle: null, bio: null,
      avatarEmoji: "🦉", avatarUrl: null, examId: null,
      grade: null, school: null, city: null, examYear: null,
      targetUniversity: null, targetDepartment: null, targetRank: null,
      track: null, targetScore: null,
      weeklyHours: null, studyStyle: null, strongSubjects: [], weakSubjects: [],
      goals: null, isPublic: true, streakDays: 0, longestStreak: 0,
      createdAt: null, onboardedAt: null, tourDoneAt: null,
    };
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const st = read();
    const next = { ...(await this.getMyProfile())!, ...patch } as Profile;
    st.profile = next;
    write(st);
    return next;
  }

  async listExams(): Promise<Exam[]> {
    const st = read();
    return [
      { id: EXAM_ID, code: EXAM.code, name: EXAM.name, description: null, position: 1, active: true, createdBy: null },
      ...st.exams,
    ];
  }

  async createExam(input: { code: string; name: string; description: string | null }): Promise<Exam> {
    const st = read();
    const exam: Exam = { id: uid(), ...input, position: 99, active: false, createdBy: "local" };
    st.exams.push(exam);
    write(st);
    return exam;
  }

  async listExamDocuments(examId: string): Promise<ExamDocument[]> {
    return read().docs.filter((d) => d.examId === examId);
  }

  async addExamDocument(input: { examId: string; title: string; notes: string | null }): Promise<ExamDocument> {
    const st = read();
    const doc: ExamDocument = { id: uid(), examId: input.examId, title: input.title, notes: input.notes, fileUrl: null, createdAt: new Date().toISOString() };
    st.docs.push(doc);
    write(st);
    return doc;
  }

  async listPosts(): Promise<Post[]> {
    return read().posts.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createPost(input: NewPost): Promise<Post> {
    const st = read();
    const me = (await this.getMyProfile())!;
    const post: Post = {
      id: uid(), authorId: me.id, author: me, body: input.body, examId: input.examId,
      media: input.media.map((m, i) => ({ id: uid(), url: m.url, kind: m.kind, position: i })),
      createdAt: new Date().toISOString(), editedAt: null, reactions: {}, myReactions: [],
      commentCount: 0, bookmarked: false,
    };
    st.posts.push(post);
    write(st);
    return post;
  }

  async deletePost(id: string): Promise<void> {
    const st = read();
    st.posts = st.posts.filter((p) => p.id !== id);
    st.comments = st.comments.filter((c) => c.postId !== id);
    write(st);
  }

  async listComments(postId: string): Promise<Comment[]> {
    return read().comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addComment(input: { postId: string; parentId: string | null; body: string; gifUrl: string | null }): Promise<Comment> {
    const st = read();
    const me = (await this.getMyProfile())!;
    const c: Comment = {
      id: uid(), postId: input.postId, parentId: input.parentId, authorId: me.id, author: me,
      body: input.body, gifUrl: input.gifUrl, createdAt: new Date().toISOString(), reactions: {}, myReactions: [],
    };
    st.comments.push(c);
    const p = st.posts.find((x) => x.id === input.postId);
    if (p) p.commentCount += 1;
    write(st);
    return c;
  }

  async deleteComment(id: string): Promise<void> {
    const st = read();
    st.comments = st.comments.filter((c) => c.id !== id);
    write(st);
  }

  async toggleReaction(target: { postId?: string; commentId?: string }, emoji: string): Promise<void> {
    const st = read();
    const item = target.postId
      ? st.posts.find((p) => p.id === target.postId)
      : st.comments.find((c) => c.id === target.commentId);
    if (!item) return;
    const on = item.myReactions.includes(emoji);
    item.myReactions = on ? item.myReactions.filter((e) => e !== emoji) : [...item.myReactions, emoji];
    item.reactions = { ...item.reactions, [emoji]: Math.max(0, (item.reactions[emoji] ?? 0) + (on ? -1 : 1)) };
    if (item.reactions[emoji] === 0) delete item.reactions[emoji];
    write(st);
  }

  async uploadImage(file: File): Promise<{ url: string; kind: MediaKind }> {
    /* Sunucu yok: dosyayı data URI olarak gömüyoruz. Yalnızca yerel geliştirme için. */
    const url = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    return { url, kind: file.type === "image/gif" ? "gif" : "image" };
  }

  async reset(): Promise<void> {
    write({ exams: [], docs: [], posts: [], comments: [], sessions: [], messages: [], gaps: [], moments: [], states: [] });
  }

  /* --------------------------------------------------- profil / sosyal
     Tarayıcı deposunda sosyal grafik tek kişilik; yine de çökmesin diye
     sözleşmenin tamamı burada da karşılanıyor. */

  async getProfileByHandle(handle: string): Promise<Profile | null> {
    const me = await this.getMyProfile();
    return me && me.handle?.toLowerCase() === handle.toLowerCase() ? me : null;
  }

  async getProfileStats(): Promise<ProfileStats> {
    const st = read();
    const closed = st.states.filter((x) => x.status === "settled" && x.wasGap).length;
    return {
      sessions: st.sessions.length,
      finishedSessions: st.sessions.filter((x) => x.status === "finished").length,
      closedByTeaching: closed,
      moments: st.moments.length,
      posts: st.posts.length,
      followers: 0,
      following: 0,
    };
  }

  async uploadAvatar(file: File): Promise<string> {
    const { url } = await this.uploadImage(file);
    await this.updateProfile({ avatarUrl: url });
    return url;
  }

  async removeAvatar(): Promise<void> {
    await this.updateProfile({ avatarUrl: null });
  }

  async getFollowState(): Promise<FollowState> {
    return { following: false, followers: 0, followingCount: 0 };
  }
  async toggleFollow(): Promise<boolean> { return false; }

  async listNotifications(): Promise<AppNotification[]> { return []; }
  async unreadCount(): Promise<number> { return 0; }
  async markNotificationsRead(): Promise<void> {}

  async report(): Promise<void> {}
  async toggleBlock(): Promise<boolean> { return false; }
  async listBlocked(): Promise<string[]> { return []; }

  async listFeed(scope: FeedScope, cursor: string | null, limit = 15): Promise<FeedPage> {
    const st = read();
    let rows = st.posts.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (scope === "bookmarks") rows = rows.filter((p) => p.bookmarked);
    if (cursor) rows = rows.filter((p) => p.createdAt < cursor);
    const slice = rows.slice(0, limit);
    return { posts: slice, nextCursor: rows.length > limit ? slice[slice.length - 1].createdAt : null };
  }

  async updatePost(id: string, body: string): Promise<void> {
    const st = read();
    const p = st.posts.find((x) => x.id === id);
    if (p) { p.body = body; p.editedAt = new Date().toISOString(); write(st); }
  }

  async toggleBookmark(postId: string): Promise<boolean> {
    const st = read();
    const p = st.posts.find((x) => x.id === postId);
    if (!p) return false;
    p.bookmarked = !p.bookmarked;
    write(st);
    return p.bookmarked;
  }

  async updateExam(id: string, patch: { name?: string; description?: string | null }): Promise<void> {
    const st = read();
    const e = st.exams.find((x) => x.id === id);
    if (e) { Object.assign(e, patch); write(st); }
  }
  async deleteExam(id: string): Promise<void> {
    const st = read();
    st.exams = st.exams.filter((x) => x.id !== id);
    write(st);
  }
  async addSubject(): Promise<void> {}
  async addTopic(): Promise<void> {}
  async deleteTopic(): Promise<void> {}
  async deleteExamDocument(id: string): Promise<void> {
    const st = read();
    st.docs = st.docs.filter((d) => d.id !== id);
    write(st);
  }
  async documentUrl(): Promise<string | null> { return null; }

  /* Arama: tarayıcı deposunda yalnızca kendi gönderilerin var. */
  async search(query: string): Promise<{ people: Profile[]; posts: Post[] }> {
    const q = query.trim().toLocaleLowerCase("tr");
    if (q.length < 2) return { people: [], posts: [] };
    return { people: [], posts: read().posts.filter((p) => p.body.toLocaleLowerCase("tr").includes(q)).slice(0, 8) };
  }

  /* ---------------------------------------------------------- mesajlaşma
     Tarayıcı deposunda karşı taraf yok: kanal listesi boş kalıyor, gönderilen
     mesaj yalnızca kendi cihazında duruyor. Supabase bağlıyken asıl hâli. */
  async listThreads(): Promise<DmThread[]> { return []; }
  async openThread(): Promise<string> { throw new Error("Mesajlaşma için giriş yapman gerekiyor."); }
  async listMessages(threadId: string): Promise<DmMessage[]> {
    return read().dms?.filter((m) => m.threadId === threadId) ?? [];
  }
  async sendMessage(threadId: string, body: string): Promise<DmMessage> {
    const st = read();
    const msg: DmMessage = {
      id: uid(), threadId, senderId: "local", body, createdAt: new Date().toISOString(),
    };
    st.dms = [...(st.dms ?? []), msg];
    write(st);
    return msg;
  }
  async deleteMessage(id: string): Promise<void> {
    const st = read();
    st.dms = (st.dms ?? []).filter((m) => m.id !== id);
    write(st);
  }
  async markThreadRead(): Promise<void> {}
  async unreadMessageCount(): Promise<number> { return 0; }
  subscribeMessages(): () => void { return () => {}; }
}
