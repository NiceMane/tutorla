/* Senaryolu öğrenci — yapay zekâ DEĞİL.
   Anahtar kelime eşleşmesi ve elle yazılmış cümlelerle çalışır; amacı
   uygulamanın tamamını (veri akışı, anlayış haritası, boşluklar, seans notu)
   gerçek bir AI olmadan uçtan uca çalıştırmak ve test edilebilir kılmak.
   Arayüzde "senaryolu öğrenci" rozetiyle açıkça işaretlenir. */
import { CURRICULUM } from "@/lib/curriculum";
import type { ConceptStatus } from "@/lib/domain";
import type { EngineContext, EngineTurn, StudentEngine } from "./types";

/* Türkçe karşılaştırma: küçült, aksanları sadeleştir, noktalamayı at */
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

/* curriculum.ts'teki zengin veriyi (probe, keywords, gapLabel) slug'dan bul */
const SEED = new Map<string, { probe?: string; keywords?: string[]; gapLabel?: string }>();
for (const s of CURRICULUM) {
  for (const t of s.topics) {
    for (const c of t.concepts) SEED.set(`${t.slug}/${c.slug}`, c);
  }
}

const ACK = [
  "Hmm, tamam.",
  "Anladım galiba.",
  "Bir saniye, oturttum sanırım.",
  "Tamam, bu kısmı yakaladım.",
];
const PUSH = [
  "Peki bunu neden böyle yapıyoruz?",
  "Bir örnekle gösterebilir misin?",
  "Bunu daha basit anlatsan nasıl olurdu?",
  "Buradan emin misin? Nedenini söylesen tam oturur.",
];
const THIN = [
  "Bunu anladım sayılmaz. Biraz daha açar mısın?",
  "Şurası boşta kaldı sanki — nedenini söyler misin?",
  "Bu cümleyi ezberden söylüyormuşsun gibi geldi, açıklar mısın?",
];

/* Aynı seansta hep aynı cümle çıkmasın diye tur sayısına göre dolaş */
const pick = (arr: string[], n: number) => arr[n % arr.length];

export class ScriptedEngine implements StudentEngine {
  readonly kind = "scripted" as const;

  private nextConcept(ctx: EngineContext) {
    return ctx.concepts.find((c) => ctx.states[c.id] !== "settled") ?? null;
  }

  private probeFor(ctx: EngineContext, conceptId: string): string {
    const c = ctx.concepts.find((x) => x.id === conceptId);
    if (!c) return "Peki bunu nasıl açıklarsın?";
    const seed = SEED.get(`${ctx.topic.slug}/${c.slug}`);
    return seed?.probe ?? `“${c.name}” kısmını anlatır mısın? Orayı hiç anlamadım.`;
  }

  private gapLabelFor(ctx: EngineContext, conceptId: string): string {
    const c = ctx.concepts.find((x) => x.id === conceptId);
    if (!c) return "boşluk: açıklanmayan bir adım var";
    const seed = SEED.get(`${ctx.topic.slug}/${c.slug}`);
    return seed?.gapLabel ?? `boşluk: “${c.name}” açıklanmadı`;
  }

  /* Anlatım hedef kavramı karşılıyor mu?
     Anahtar kelime eşleşmesi + uzunluk. Kaba ama tutarlı ve test edilebilir. */
  private evaluate(ctx: EngineContext, conceptId: string, text: string) {
    const c = ctx.concepts.find((x) => x.id === conceptId);
    const seed = c ? SEED.get(`${ctx.topic.slug}/${c.slug}`) : undefined;
    const keywords = (seed?.keywords ?? []).map(normalise).filter(Boolean);
    const body = normalise(text);
    const words = body.split(" ").filter(Boolean).length;
    const hits = keywords.filter((k) => body.includes(k)).length;
    /* Anahtar kelime yoksa (yazılmamış kavram) sadece uzunluğa bak */
    const ok = keywords.length === 0 ? words >= 12 : hits >= Math.min(2, keywords.length) && words >= 8;
    return { ok, hits, words, thin: words < 6 };
  }

  async open(ctx: EngineContext): Promise<EngineTurn> {
    const target = this.nextConcept(ctx);
    return {
      reply: target
        ? this.probeFor(ctx, target.id)
        : `${ctx.topic.name} konusunu galiba biliyorum. Yine de baştan anlatır mısın?`,
      targetConceptId: target?.id ?? null,
      gap: null,
      conceptUpdates: [],
      done: !target,
    };
  }

  async respond(ctx: EngineContext, teacherMessage: string): Promise<EngineTurn> {
    const target = this.nextConcept(ctx);
    const turn = ctx.messages.filter((m) => m.role === "teacher").length;

    if (!target) {
      return { reply: "Bu konuda kafamda soru kalmadı, teşekkürler!", targetConceptId: null, gap: null, conceptUpdates: [], done: true };
    }

    const { ok, thin } = this.evaluate(ctx, target.id, teacherMessage);

    if (ok) {
      const updates: { conceptId: string; status: ConceptStatus }[] = [{ conceptId: target.id, status: "settled" }];
      const after = { ...ctx.states, [target.id]: "settled" as ConceptStatus };
      const next = ctx.concepts.find((c) => after[c.id] !== "settled") ?? null;
      return {
        reply: next ? `${pick(ACK, turn)} ${this.probeFor(ctx, next.id)}` : `${pick(ACK, turn)} Sanırım artık anladım — bu konuda sorum kalmadı.`,
        targetConceptId: next?.id ?? null,
        gap: null,
        conceptUpdates: updates,
        done: !next,
      };
    }

    /* Eksik: boşluğu işaretle, aynı kavramda kal ve bir adım daha iste */
    return {
      reply: thin ? pick(THIN, turn) : pick(PUSH, turn),
      targetConceptId: target.id,
      gap: { conceptId: target.id, label: this.gapLabelFor(ctx, target.id) },
      conceptUpdates: [{ conceptId: target.id, status: "gap" }],
      done: false,
    };
  }

  async note(ctx: EngineContext): Promise<string> {
    const total = ctx.concepts.length;
    const settled = ctx.concepts.filter((c) => ctx.states[c.id] === "settled").length;
    const gaps = ctx.concepts.filter((c) => ctx.states[c.id] === "gap").length;
    if (settled === 0) return "Henüz hiçbir kavram oturmadı. Konuyu en baştan, kendi cümlelerinle anlatmayı dene.";
    if (gaps === 0 && settled === total) return "Öğrencinin bu konuda sorusu kalmadı. Anlatımın adım adım ve nedenleriyle ilerledi.";
    if (gaps >= settled) return "Öğrencin “neden” sorularına takılıyor. Sebep-sonuçla anlatmayı dene.";
    return `${total} kavramın ${settled} tanesi oturdu. Kalanları örnek vererek anlatmayı dene — öğrencin somut örnekte daha çabuk yakalıyor.`;
  }
}
