import { describe, expect, it, beforeEach } from "vitest";
import { ScriptedEngine } from "@/lib/engine/scripted";
import { SocraticEngine } from "@/lib/engine/socratic";
import type { EngineContext } from "@/lib/engine/types";
import { CURRICULUM } from "@/lib/curriculum";
import type { Concept, ConceptStatus, Message, MomentKind, Topic } from "@/lib/domain";

const subj = CURRICULUM.find((s) => s.slug === "matematik")!;
const seed = subj.topics.find((x) => x.slug === "zincir-kurali")!;
const topic: Topic = { id: "m/zincir", subjectId: "m", slug: seed.slug, name: seed.name, position: 3 };
const concepts: Concept[] = seed.concepts.map((c, i) => ({
  id: `m/zincir/${c.slug}`, topicId: topic.id, slug: c.slug, name: c.name, position: i + 1,
}));

let states: Record<string, ConceptStatus>;
let messages: Message[];
let moments: { conceptId: string | null; kind: MomentKind }[];
const ctx = (): EngineContext => ({ topic, concepts, persona: "curious", messages, states, moments });

beforeEach(() => { states = {}; messages = []; moments = []; });

const GOOD = "İç içe fonksiyonları düşün: f(g(x)). Dıştaki fonksiyonun türevini alıp içtekinin türeviyle çarpıyorsun, halkalar gibi zincir oluyor.";

describe("ScriptedEngine — anlatma modu", () => {
  it("açılışta konunun kendi sorusunu sorar", async () => {
    const turn = await new ScriptedEngine().open(ctx());
    expect(turn.reply).toContain("zincir kuralı");
    expect(turn.targetConceptId).toBe(concepts[0].id);
  });

  it("zayıf cevapta boşluk açar ve kavramda kalır", async () => {
    const turn = await new ScriptedEngine().respond(ctx(), "bilmiyorum");
    expect(turn.gap).not.toBeNull();
    expect(turn.targetConceptId).toBe(concepts[0].id);
  });

  it("iyi cevapta kavramı oturtup sıradakine geçer", async () => {
    const turn = await new ScriptedEngine().respond(ctx(), GOOD);
    expect(turn.gap).toBeNull();
    expect(turn.conceptUpdates).toContainEqual({ conceptId: concepts[0].id, status: "settled" });
    expect(turn.targetConceptId).toBe(concepts[1].id);
  });

  it("marka dosyasındaki boşluk etiketini üretir", async () => {
    states[concepts[0].id] = "settled";
    states[concepts[1].id] = "settled";
    const turn = await new ScriptedEngine().respond(ctx(), "çünkü öyle");
    expect(turn.gap?.label).toBe("boşluk: çarpımın nedeni açıklanmadı");
  });

  it("kısa cevaba davranış anı vermez", async () => {
    expect((await new ScriptedEngine().respond(ctx(), "bilmiyorum")).moment).toBeNull();
  });

  it("nedensellik ve somutlamayı ayırt eder", async () => {
    const causal = await new ScriptedEngine().respond(ctx(), "Zincir kuralı işler çünkü değişim hızları birbirine bağlıdır, bu yüzden çarpıyoruz.");
    expect(causal.moment?.kind).toBe("causal");
    const concrete = await new ScriptedEngine().respond(ctx(), "Mesela sin(x kare) olsun, dıştaki sinüsün türevi kosinüstür sonra içtekiyle çarparsın.");
    expect(concrete.moment?.kind).toBe("concrete");
  });

  it("aynı kavrama aynı anı iki kez vermez", async () => {
    states[concepts[0].id] = "gap";
    const e = new ScriptedEngine();
    const first = await e.respond(ctx(), "Tamam baştan alayım: dıştakinin türevini alıp içtekinin türeviyle çarpıyorsun, halkalar gibi.");
    expect(first.moment?.kind).toBe("persistence");
    moments.push({ conceptId: first.moment!.conceptId, kind: first.moment!.kind });
    const second = await e.respond(ctx(), "Mesela sin(x kare) olsun, dıştaki sinüsün türevi kosinüstür sonra içtekiyle çarparsın.");
    expect(second.moment?.kind).not.toBe("persistence");
  });
});

describe("SocraticEngine — roller klasik", () => {
  it("açılışta soru sorar", async () => {
    const turn = await new SocraticEngine().open(ctx());
    expect(turn.reply).toContain("?");
  });

  it("cevabı vermez, soruyla yönlendirir", async () => {
    const turn = await new SocraticEngine().respond(ctx(), "bilmiyorum");
    expect(turn.reply).toContain("?");
    expect(turn.reply).not.toContain("çarpıyorsun");
  });

  it("davranış anı üretmez — o anlatma modunun ölçüsü", async () => {
    expect((await new SocraticEngine().respond(ctx(), GOOD)).moment).toBeNull();
  });
});
