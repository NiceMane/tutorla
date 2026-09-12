/* Sokratik mod — ana modun TERSİ.
   Ana modda kullanıcı anlatır, AI öğrencidir. Burada roller klasik: AI sorar,
   kullanıcı düşünür. Ama cevabı asla vermez; daraltan sorularla götürür.
   Yine senaryolu: gerçek analiz Claude bağlanınca gelecek. */
import { CURRICULUM } from "@/lib/curriculum";
import type { ConceptStatus } from "@/lib/domain";
import type { EngineContext, EngineTurn, StudentEngine } from "./types";

function normalise(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i").replaceAll("İ", "i")
    .replaceAll("ş", "s").replaceAll("ğ", "g")
    .replaceAll("ü", "u").replaceAll("ö", "o").replaceAll("ç", "c")
    .replace(/[^\p{L}\p{N}\s+/²()-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SEED = new Map<string, { keywords?: string[] }>();
for (const s of CURRICULUM) {
  for (const t of s.topics) for (const c of t.concepts) SEED.set(`${t.slug}/${c.slug}`, c);
}

/* Cevabı vermeyen, yönlendiren sorular. */
const OPEN = [
  "“%s” deyince aklına ilk ne geliyor? Tanımını hatırlamaya çalışma, kendi cümlenle söyle.",
  "“%s” konusunda bildiğini düşündüğün tek şey ne? Oradan başlayalım.",
  "“%s” sence neden var? Olmasaydı ne eksik kalırdı?",
];
const NARROW = [
  "Bunu bir örnekle düşünsen, o örnekte tam olarak ne oluyor?",
  "Peki bu her durumda böyle mi? Aksini düşünebiliyor musun?",
  "Bu cümleyi bir adım daha açsan, hangi kelimenin altını çizerdin?",
  "Şimdi tersinden bak: bu olmasaydı ne değişirdi?",
];
/* Hepsi soruyla biter: modun sözü "cevabı verme, soruyla yönlendir".
   Yönlendirme cümlesi soru değilse o söz tutulmamış olur. */
const NUDGE = [
  "Acele etme — bildiğin en küçük parçadan başlasan, o parça ne olurdu?",
  "Tam bilmiyorsan da olur; tahminin ne?",
  "Şu ana kadar söylediklerinden hangisi sana en sağlam geliyor?",
];
const AFFIRM = [
  "Evet, oraya kendin vardın.",
  "Bunu sen buldun, ben söylemedim.",
  "Tam da orası.",
];
const HINTS = [
  "İpucu: tanımı değil, ne işe yaradığını düşün.",
  "İpucu: iki şeyi karşılaştırınca fark netleşir.",
  "İpucu: bir örnek yaz, sonra örnekten kurala git.",
];

const pick = (arr: string[], n: number) => arr[n % arr.length];

export class SocraticEngine implements StudentEngine {
  readonly kind = "scripted" as const;

  private next(ctx: EngineContext) {
    return ctx.concepts.find((c) => ctx.states[c.id] !== "settled") ?? null;
  }

  /* Sokratik modda "yeterli" çıtası daha düşük: amaç anlattırmak değil,
     düşündürmek. Kullanıcı kendi kelimeleriyle doğru yöne geldiyse ilerliyoruz. */
  private reached(ctx: EngineContext, conceptId: string, text: string) {
    const c = ctx.concepts.find((x) => x.id === conceptId);
    const kws = (SEED.get(`${ctx.topic.slug}/${c?.slug}`)?.keywords ?? []).map(normalise).filter(Boolean);
    const body = normalise(text);
    const words = body.split(" ").filter(Boolean).length;
    const hits = kws.filter((k) => body.includes(k)).length;
    return { ok: kws.length === 0 ? words >= 10 : hits >= 1 && words >= 6, thin: words < 4 };
  }

  async open(ctx: EngineContext): Promise<EngineTurn> {
    const target = this.next(ctx);
    return {
      reply: (target ? pick(OPEN, 0) : "Bu konuyu bitirmişsin. Başka bir konuya geçelim mi?").replace("%s", ctx.topic.name),
      targetConceptId: target?.id ?? null,
      gap: null, moment: null, conceptUpdates: [], done: !target,
    };
  }

  async respond(ctx: EngineContext, userMessage: string): Promise<EngineTurn> {
    const target = this.next(ctx);
    const turn = ctx.messages.filter((m) => m.role === "teacher").length;
    if (!target) {
      return { reply: "Bu konuda kafanda soru kalmadıysa burada bırakalım.", targetConceptId: null, gap: null, moment: null, conceptUpdates: [], done: true };
    }

    const { ok, thin } = this.reached(ctx, target.id, userMessage);

    if (ok) {
      const updates: { conceptId: string; status: ConceptStatus }[] = [{ conceptId: target.id, status: "settled" }];
      const after = { ...ctx.states, [target.id]: "settled" as ConceptStatus };
      const nxt = ctx.concepts.find((c) => after[c.id] !== "settled") ?? null;
      return {
        reply: nxt
          ? `${pick(AFFIRM, turn)} Şimdi “${nxt.name}” tarafına bakalım: ${pick(NARROW, turn)}`
          : `${pick(AFFIRM, turn)} Konuyu kendi cümlelerinle çıkardın — burada bitirebiliriz.`,
        targetConceptId: nxt?.id ?? null,
        gap: null, moment: null, conceptUpdates: updates, done: !nxt,
      };
    }

    /* Takıldıysa: cevabı verme, daralt. Üst üste zorlanıyorsa ipucu bırak. */
    const stuck = ctx.messages.slice(-4).filter((m) => m.role === "teacher").length >= 2;
    return {
      reply: thin
        ? pick(NUDGE, turn)
        : stuck
          ? `${pick(NARROW, turn)} ${pick(HINTS, turn)}`
          : pick(NARROW, turn),
      targetConceptId: target.id,
      gap: null, moment: null, conceptUpdates: [], done: false,
    };
  }

  async note(ctx: EngineContext): Promise<string> {
    const total = ctx.concepts.length;
    const settled = ctx.concepts.filter((c) => ctx.states[c.id] === "settled").length;
    if (settled === 0) return "Bu sefer soruların üstünde kaldık. Bir dahakine küçük bir parçadan başlamayı dene.";
    if (settled === total) return "Konuyu baştan sona kendi cümlelerinle çıkardın — cevapları ben vermedim.";
    return `${total} kavramın ${settled} tanesine kendin vardın. Kalanları anlatma modunda denemek iyi gelebilir.`;
  }
}
