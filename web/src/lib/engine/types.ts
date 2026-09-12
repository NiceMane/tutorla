/* Yapay zekâya dokunan HER ŞEY bu arayüzün arkasında.
   Bugün: ScriptedEngine (senaryolu, elle yazılmış kurallar).
   Sonra: ClaudeEngine (Claude API) — sadece bu dosyanın uygulaması değişir,
   şema, veri katmanı ve arayüz aynı kalır. */
import type { Concept, ConceptStatus, Message, MomentKind, PersonaCode, Topic } from "@/lib/domain";

export type EngineContext = {
  topic: Topic;
  concepts: Concept[];
  persona: PersonaCode;
  messages: Message[];
  /* kavram id → durum; motor neyin oturduğunu bilmeli */
  states: Record<string, ConceptStatus>;
  /* Bu seansta şimdiye kadar verilmiş anlar — aynısı tekrar verilmesin */
  moments: { conceptId: string | null; kind: MomentKind }[];
};

export type EngineTurn = {
  /* Öğrencinin (yapay zekânın) söyledikleri */
  reply: string;
  /* Şu an hangi kavramı kurcalıyor — sağ paneldeki vurgu için */
  targetConceptId: string | null;
  /* Anlatımda eksik kalan yer. Ürünün ayırt edici mekanizması. */
  gap: { conceptId: string | null; label: string } | null;
  /* Öğretme davranışı anı — boşluğun olumlu ikizi. Kanıtı kullanıcının o mesajı.
     En fazla bir tane: her turda madalya dağıtmak anlamını öldürür. */
  moment: { conceptId: string | null; kind: MomentKind; label: string } | null;
  /* Bu turda değişen kavram durumları */
  conceptUpdates: { conceptId: string; status: ConceptStatus }[];
  /* Konunun tüm kavramları bittiyse seans kapanabilir */
  done: boolean;
};

export interface StudentEngine {
  readonly kind: "scripted" | "claude";
  /* Seansı açan ilk soru */
  open(ctx: EngineContext): Promise<EngineTurn>;
  /* Kullanıcının anlatımına yanıt */
  respond(ctx: EngineContext, teacherMessage: string): Promise<EngineTurn>;
  /* Oturum sonu davranışsal geri bildirim; seansta yakalanan anlar da geçilir */
  note(ctx: EngineContext, moments?: MomentKind[]): Promise<string>;
}
