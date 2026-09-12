/* Senaryolu öğrenci — yapay zekâ DEĞİL.
   Anahtar kelime eşleşmesi ve elle yazılmış cümlelerle çalışır; amacı
   uygulamanın tamamını (veri akışı, anlayış haritası, boşluklar, seans notu)
   gerçek bir AI olmadan uçtan uca çalıştırmak ve test edilebilir kılmak.
   Arayüzde "senaryolu öğrenci" rozetiyle açıkça işaretlenir. */
import { CURRICULUM } from "@/lib/curriculum";
import type { ConceptStatus, MomentKind } from "@/lib/domain";
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

/* ---- öğretme davranışı sinyalleri ----
   Elle yazılmış kalıplar; Claude motoruna geçince yerini gerçek analize bırakacak.
   Kalıplar normalise() sonrası aranır (aksansız, küçük harf). */
const CAUSAL = ["cunku", "bu yuzden", "dolayisiyla", "sebebi", "bu sayede", "o halde", "nedeni"];
const CONCRETE = ["ornegin", "mesela", "diyelim", "ornek olarak", "soyle dusun"];

const MOMENT_LABEL: Record<MomentKind, string> = {
  persistence: "pes etmedin, yeniden anlattın",
  causal: "sadece “ne”yi değil “neden”i de anlattın",
  concrete: "örnek vererek somutladın",
  simplify: "anlaşılmayınca sadeleştirdin",
  curiosity: "sorulmadan bir adım ileri gittin",
};

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
      moment: null,
      conceptUpdates: [],
      done: !target,
    };
  }

  /* Bu turda bir davranış anı var mı? En fazla bir tane, önem sırasına göre. */
  private detectMoment(ctx: EngineContext, targetId: string, text: string): EngineTurn["moment"] {
    /* Aynı kavram için aynı türde an ikinci kez verilmez.
       Aksi halde kavram bir kez "gap" olunca sonraki HER mesaj sebat sayılıyor,
       diğer sinyaller hiç görünmüyor ve an anlamını yitiriyordu. */
    const given = (kind: MomentKind, conceptId: string | null) =>
      ctx.moments.some((m) => m.kind === kind && m.conceptId === conceptId);

    const body = normalise(text);
    const words = body.split(" ").filter(Boolean).length;
    if (words < 6) return null; // tek kelimelik cevaba madalya yok

    const mine = ctx.messages.filter((m) => m.role === "teacher");
    const prev = mine.length ? mine[mine.length - 1].content : "";
    const prevWords = normalise(prev).split(" ").filter(Boolean).length;

    /* Sebat: bu kavramda boşluk çıkmıştı, yine de anlatmaya devam etti. */
    if (ctx.states[targetId] === "gap" && words >= 10) {
      /* Sadeleştirme, sebatın özel hâli: hem devam etti hem kısalttı. */
      if (prevWords > 0 && words < prevWords * 0.7 && !given("simplify", targetId)) {
        return { conceptId: targetId, kind: "simplify", label: MOMENT_LABEL.simplify };
      }
      if (!given("persistence", targetId)) {
        return { conceptId: targetId, kind: "persistence", label: MOMENT_LABEL.persistence };
      }
    }

    if (CAUSAL.some((k) => body.includes(k)) && !given("causal", targetId)) {
      return { conceptId: targetId, kind: "causal", label: MOMENT_LABEL.causal };
    }
    if (CONCRETE.some((k) => body.includes(k)) && !given("concrete", targetId)) {
      return { conceptId: targetId, kind: "concrete", label: MOMENT_LABEL.concrete };
    }

    /* Merak EN SONA bakılır: sezgisellerin en zayıfı.
       Açık bir "çünkü" ya da "mesela" varken cümlenin asıl sinyali odur;
       ileri kavramın kelimesinin geçmesi tesadüf olabilir.
       Merak = sorulmayan, ileride gelen bir kavramı kendiliğinden getirmek.
       Sıkı olmak zorunda — "çarp", "türev" gibi kısa ve konunun her yerinde geçen
       kelimeler eşleşirse merak sinyali her cümlede yanar ve anlamını yitirir.
       Bu yüzden: yalnızca uzun (6+) ve BU noktaya kadarki kavramlarda geçmeyen
       anahtar kelimeler sayılır. */
    const idx = ctx.concepts.findIndex((c) => c.id === targetId);
    const seen = new Set<string>();
    for (const c of ctx.concepts.slice(0, idx + 1)) {
      for (const k of SEED.get(`${ctx.topic.slug}/${c.slug}`)?.keywords ?? []) seen.add(normalise(k));
    }
    for (const later of ctx.concepts.slice(idx + 1)) {
      const kws = (SEED.get(`${ctx.topic.slug}/${later.slug}`)?.keywords ?? [])
        .map(normalise)
        .filter((k) => k.length >= 6 && !seen.has(k));
      if (kws.some((k) => body.includes(k)) && !given("curiosity", later.id)) {
        return { conceptId: later.id, kind: "curiosity", label: MOMENT_LABEL.curiosity };
      }
    }

    return null;
  }

  async respond(ctx: EngineContext, teacherMessage: string): Promise<EngineTurn> {
    const target = this.nextConcept(ctx);
    const turn = ctx.messages.filter((m) => m.role === "teacher").length;

    if (!target) {
      return { reply: "Bu konuda kafamda soru kalmadı, teşekkürler!", targetConceptId: null, gap: null, moment: null, conceptUpdates: [], done: true };
    }

    const moment = this.detectMoment(ctx, target.id, teacherMessage);
    const { ok, thin } = this.evaluate(ctx, target.id, teacherMessage);

    if (ok) {
      const updates: { conceptId: string; status: ConceptStatus }[] = [{ conceptId: target.id, status: "settled" }];
      const after = { ...ctx.states, [target.id]: "settled" as ConceptStatus };
      const next = ctx.concepts.find((c) => after[c.id] !== "settled") ?? null;
      return {
        reply: next ? `${pick(ACK, turn)} ${this.probeFor(ctx, next.id)}` : `${pick(ACK, turn)} Sanırım artık anladım — bu konuda sorum kalmadı.`,
        targetConceptId: next?.id ?? null,
        gap: null,
        moment,
        conceptUpdates: updates,
        done: !next,
      };
    }

    /* Eksik: boşluğu işaretle, aynı kavramda kal ve bir adım daha iste */
    return {
      reply: thin ? pick(THIN, turn) : pick(PUSH, turn),
      targetConceptId: target.id,
      gap: { conceptId: target.id, label: this.gapLabelFor(ctx, target.id) },
      moment,
      conceptUpdates: [{ conceptId: target.id, status: "gap" }],
      done: false,
    };
  }

  async note(ctx: EngineContext, moments: MomentKind[] = []): Promise<string> {
    const total = ctx.concepts.length;
    const settled = ctx.concepts.filter((c) => ctx.states[c.id] === "settled").length;
    const gaps = ctx.concepts.filter((c) => ctx.states[c.id] === "gap").length;

    /* Davranış kanıtı varsa notu onunla aç — övgü değil, olanın kaydı. */
    const behaviour = moments.length
      ? (moments.includes("persistence") || moments.includes("simplify")
          ? "Takıldığın yerde pes etmeyip yeniden anlattın. "
          : moments.includes("curiosity")
            ? "Sorulmadan ileri gittin — merakın anlatımını taşıyor. "
            : moments.includes("causal")
              ? "Nedenleriyle anlattın, ezber gibi durmadı. "
              : "Örneklerle somutladın, öğrencin bunu daha çabuk yakalıyor. ")
      : "";
    if (settled === 0) return behaviour + "Henüz hiçbir kavram oturmadı. Konuyu en baştan, kendi cümlelerinle anlatmayı dene.";
    if (gaps === 0 && settled === total) return behaviour + "Öğrencinin bu konuda sorusu kalmadı. Anlatımın adım adım ve nedenleriyle ilerledi.";
    if (gaps >= settled) return behaviour + "Öğrencin “neden” sorularına takılıyor. Sebep-sonuçla anlatmayı dene.";
    return behaviour + `${total} kavramın ${settled} tanesi oturdu. Kalanları örnek vererek anlatmayı dene — öğrencin somut örnekte daha çabuk yakalıyor.`;
  }
}
