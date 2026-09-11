import { ScriptedEngine } from "../src/lib/engine/scripted.ts";
import type { EngineContext } from "../src/lib/engine/types.ts";
import { CURRICULUM } from "../src/lib/curriculum.ts";
import type { Concept, ConceptStatus, Message, Topic } from "../src/lib/domain.ts";

const subj = CURRICULUM.find((s) => s.slug === "matematik")!;
const t = subj.topics.find((x) => x.slug === "zincir-kurali")!;
const topic: Topic = { id: "matematik/zincir-kurali", subjectId: "matematik", slug: t.slug, name: t.name, position: 3 };
const concepts: Concept[] = t.concepts.map((c, i) => ({
  id: `matematik/zincir-kurali/${c.slug}`, topicId: topic.id, slug: c.slug, name: c.name, position: i + 1,
}));

const states: Record<string, ConceptStatus> = {};
const messages: Message[] = [];
let pos = 0;
const push = (role: "student" | "teacher", content: string) => {
  messages.push({ id: String(pos), sessionId: "s", role, content, position: pos++, createdAt: "" });
};
const ctx = (): EngineContext => ({ topic, concepts, persona: "curious", messages, states });

const e = new ScriptedEngine();
let fails = 0;
const check = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "✓" : "✗"} ${label}${extra ? "  — " + extra : ""}`);
  if (!cond) fails++;
};

const open = await e.open(ctx());
push("student", open.reply);
check("açılış sorusu zincir kuralının kendi cümlesi", open.reply.includes("zincir kuralı"), open.reply.slice(0, 60));
check("açılışta hedef ilk kavram", open.targetConceptId === concepts[0].id);

// 1) zayıf cevap → boşluk açılmalı, kavram ilerlememeli
push("teacher", "bilmiyorum");
const weak = await e.respond(ctx(), "bilmiyorum");
check("zayıf cevap boşluk üretir", weak.gap !== null, weak.gap?.label);
check("zayıf cevapta kavram ilerlemez", weak.targetConceptId === concepts[0].id);
weak.conceptUpdates.forEach((u) => (states[u.conceptId] = u.status));
check("kavram durumu 'gap'", states[concepts[0].id] === "gap");

// 2) iyi cevap → kavram oturur, sıradakine geçer
const good = "İç içe fonksiyonları düşün: f(g(x)). Dıştaki fonksiyonun türevini alıp içtekinin türeviyle çarpıyorsun, halkalar gibi zincir oluyor.";
push("teacher", good);
const ok = await e.respond(ctx(), good);
ok.conceptUpdates.forEach((u) => (states[u.conceptId] = u.status));
check("iyi cevap kavramı oturtur", states[concepts[0].id] === "settled");
check("boşluk yok", ok.gap === null);
check("sıradaki kavrama geçer", ok.targetConceptId === concepts[1].id, ok.reply.slice(0, 50));

// 3) amiral senaryo: "neden çarpım?" boşluk etiketi marka dosyasındaki cümle olmalı
states[concepts[1].id] = "settled";
push("teacher", "çünkü öyle");
const carpim = await e.respond(ctx(), "çünkü öyle");
check("marka dosyasındaki boşluk etiketi", carpim.gap?.label === "boşluk: çarpımın nedeni açıklanmadı", carpim.gap?.label);

// 4) hepsi oturunca biter
concepts.forEach((c) => (states[c.id] = "settled"));
const done = await e.respond(ctx(), "hepsini anlattım");
check("tüm kavramlar oturunca done", done.done === true && done.targetConceptId === null);

// 5) seans notu duruma göre değişir
const note1 = await e.note(ctx());
check("tamamlanmış seansın notu olumlu", note1.includes("sorusu kalmadı"), note1);
concepts.forEach((c) => (states[c.id] = "gap"));
states[concepts[0].id] = "settled";
const note2 = await e.note(ctx());
check("boşluk ağırlıklı seansın notu uyarıcı", note2.includes("neden"), note2);

console.log(fails ? `\n${fails} BAŞARISIZ` : "\nhepsi geçti");
process.exit(fails ? 1 : 0);
