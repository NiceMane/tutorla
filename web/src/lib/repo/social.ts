/* Akış ve profil sözleşmesi. Çekirdek Repo'dan ayrı tutuluyor:
   biri müfredat/seans, bu ise sosyal taraf. İkisi de aynı sınıfta uygulanıyor
   ama arayüzleri ayrı olduğu için okuması ve değiştirmesi kolay. */
import type { Comment, Exam, ExamDocument, MediaKind, Post, Profile } from "@/lib/domain";

export type NewPost = { body: string; examId: string | null; media: { url: string; kind: MediaKind }[] };

export interface SocialRepo {
  /* profil */
  getMyProfile(): Promise<Profile | null>;
  updateProfile(patch: Partial<Pick<Profile, "displayName" | "handle" | "bio" | "avatarEmoji" | "examId">>): Promise<Profile>;

  /* sınavlar */
  listExams(): Promise<Exam[]>;
  createExam(input: { code: string; name: string; description: string | null }): Promise<Exam>;
  listExamDocuments(examId: string): Promise<ExamDocument[]>;
  addExamDocument(input: { examId: string; title: string; notes: string | null; file?: File | null }): Promise<ExamDocument>;

  /* akış */
  listPosts(limit?: number): Promise<Post[]>;
  createPost(input: NewPost): Promise<Post>;
  deletePost(id: string): Promise<void>;
  listComments(postId: string): Promise<Comment[]>;
  addComment(input: { postId: string; parentId: string | null; body: string; gifUrl: string | null }): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  toggleReaction(target: { postId?: string; commentId?: string }, emoji: string): Promise<void>;

  /* medya */
  uploadImage(file: File): Promise<{ url: string; kind: MediaKind }>;
}
