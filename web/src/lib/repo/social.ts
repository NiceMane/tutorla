/* Akış ve profil sözleşmesi. Çekirdek Repo'dan ayrı tutuluyor:
   biri müfredat/seans, bu ise sosyal taraf. İkisi de aynı sınıfta uygulanıyor
   ama arayüzleri ayrı olduğu için okuması ve değiştirmesi kolay. */
import type {
  AppNotification, Comment, Exam, ExamDocument, FollowState, MediaKind,
  Post, Profile, ProfileStats, ReportReason,
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
  listExamDocuments(examId: string): Promise<ExamDocument[]>;
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
}
