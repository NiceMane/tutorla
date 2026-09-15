/* Akış ve profil sözleşmesi. Çekirdek Repo'dan ayrı tutuluyor:
   biri müfredat/seans, bu ise sosyal taraf. İkisi de aynı sınıfta uygulanıyor
   ama arayüzleri ayrı olduğu için okuması ve değiştirmesi kolay. */
import type {
  AppNotification, Comment, DmMessage, DmThread, Exam, ExamDocument, FollowState,
  MediaKind, Post, Profile, ProfileStats, ReportReason,
} from "@/lib/domain";

export type NewPost = { body: string; examId: string | null; media: { url: string; kind: MediaKind }[] };

export type FeedScope = "all" | "following" | "bookmarks";
export type FeedPage = { posts: Post[]; nextCursor: string | null };

export interface SocialRepo {
  /* profil */
  getMyProfile(): Promise<Profile | null>;
  getProfileByHandle(handle: string): Promise<Profile | null>;
  getProfileStats(userId: string): Promise<ProfileStats>;
  uploadAvatar(file: File): Promise<string>;
  removeAvatar(): Promise<void>;

  /* sosyal grafik */
  getFollowState(userId: string): Promise<FollowState>;
  toggleFollow(userId: string): Promise<boolean>;

  /* bildirimler */
  listNotifications(limit?: number): Promise<AppNotification[]>;
  unreadCount(): Promise<number>;
  markNotificationsRead(): Promise<void>;

  /* güvenlik */
  report(target: { postId?: string; commentId?: string; profileId?: string }, reason: ReportReason, note: string | null): Promise<void>;
  toggleBlock(userId: string): Promise<boolean>;
  listBlocked(): Promise<string[]>;
  /* Salt-okunur alanlar (id, seri, tarihler) düzenlenemez. */
  updateProfile(
    patch: Partial<Omit<Profile, "id" | "streakDays" | "longestStreak" | "createdAt">>,
  ): Promise<Profile>;

  /* sınavlar */
  listExams(): Promise<Exam[]>;
  createExam(input: { code: string; name: string; description: string | null }): Promise<Exam>;
  updateExam(id: string, patch: { name?: string; description?: string | null }): Promise<void>;
  deleteExam(id: string): Promise<void>;
  /* Kendi sınavına müfredat ağacı */
  addSubject(examId: string, name: string): Promise<void>;
  addTopic(subjectId: string, name: string, concepts: string[]): Promise<void>;
  deleteTopic(topicId: string): Promise<void>;
  listExamDocuments(examId: string): Promise<ExamDocument[]>;
  deleteExamDocument(id: string): Promise<void>;
  /* Özel kovadaki belge için imzalı bağlantı */
  documentUrl(path: string): Promise<string | null>;
  addExamDocument(input: { examId: string; title: string; notes: string | null; file?: File | null }): Promise<ExamDocument>;

  /* akış */
  listPosts(limit?: number): Promise<Post[]>;
  listFeed(scope: FeedScope, cursor: string | null, limit?: number): Promise<FeedPage>;
  updatePost(id: string, body: string): Promise<void>;
  toggleBookmark(postId: string): Promise<boolean>;
  createPost(input: NewPost): Promise<Post>;
  deletePost(id: string): Promise<void>;
  listComments(postId: string): Promise<Comment[]>;
  addComment(input: { postId: string; parentId: string | null; body: string; gifUrl: string | null }): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  toggleReaction(target: { postId?: string; commentId?: string }, emoji: string): Promise<void>;

  /* medya */
  uploadImage(file: File): Promise<{ url: string; kind: MediaKind }>;

  /* arama — müfredat istemcide, kişiler ve gönderiler veritabanında */
  search(query: string, limit?: number): Promise<{ people: Profile[]; posts: Post[] }>;

  /* mesajlaşma */
  listThreads(): Promise<DmThread[]>;
  openThread(userId: string): Promise<string>;
  listMessages(threadId: string, before?: string | null, limit?: number): Promise<DmMessage[]>;
  sendMessage(threadId: string, body: string): Promise<DmMessage>;
  deleteMessage(id: string): Promise<void>;
  markThreadRead(threadId: string): Promise<void>;
  unreadMessageCount(): Promise<number>;
  /* Yeni mesaj geldiğinde haber verir; aboneliği kapatan işlevi döndürür. */
  subscribeMessages(threadId: string, onMessage: (m: DmMessage) => void): () => void;
}
