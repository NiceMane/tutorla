/* supabase/seed.sql'i src/lib/curriculum.ts'ten üretir.
   Çalıştır: npm run gen:seed   —   elle düzenleme, kaynak curriculum.ts */
import { writeFileSync } from "node:fs";
import { CURRICULUM, EXAM, PERSONAS } from "../src/lib/curriculum.ts";

const q = (s: string) => "'" + s.replace(/'/g, "''") + "'";

const lines: string[] = [
  "-- Tutorla · müfredat tohumu (" + EXAM.code + ")",
  "-- ÜRETİLMİŞ DOSYA — elle düzenleme. Kaynak: web/src/lib/curriculum.ts",
  "-- Yeniden üretmek için: cd web && npm run gen:seed",
  "",
  `insert into exams (code, name, position) values (${q(EXAM.code)}, ${q(EXAM.name)}, 1)`,
  "on conflict (code) do nothing;",
  "",
  "insert into personas (code, name, trait, position, active) values",
  PERSONAS.map((p, i) => `  (${q(p.code)}, ${q(p.name)}, ${q(p.trait)}, ${i + 1}, ${p.active})`).join(",\n"),
  "on conflict (code) do nothing;",
  "",
  "insert into subjects (exam_id, slug, name, position)",
  "select e.id, v.slug, v.name, v.position",
  "from exams e join (values",
  CURRICULUM.map((s, i) => `  (${q(s.slug)}, ${q(s.name)}, ${i + 1})`).join(",\n"),
  ") as v(slug, name, position) on true",
  `where e.code = ${q(EXAM.code)}`,
  "on conflict (exam_id, slug) do nothing;",
  "",
  "insert into topics (subject_id, slug, name, position)",
  "select s.id, v.topic_slug, v.name, v.position",
  "from subjects s join (values",
  CURRICULUM.flatMap((s) => s.topics.map((t, i) => `  (${q(s.slug)}, ${q(t.slug)}, ${q(t.name)}, ${i + 1})`)).join(",\n"),
  ") as v(subject_slug, topic_slug, name, position) on v.subject_slug = s.slug",
  `join exams e on e.id = s.exam_id and e.code = ${q(EXAM.code)}`,
  "on conflict (subject_id, slug) do nothing;",
  "",
  "insert into concepts (topic_id, slug, name, position)",
  "select t.id, v.concept_slug, v.name, v.position",
  "from topics t",
  "join subjects s on s.id = t.subject_id",
  "join (values",
  CURRICULUM.flatMap((s) =>
    s.topics.flatMap((t) =>
      t.concepts.map((c, i) => `  (${q(s.slug)}, ${q(t.slug)}, ${q(c.slug)}, ${q(c.name)}, ${i + 1})`),
    ),
  ).join(",\n"),
  ") as v(subject_slug, topic_slug, concept_slug, name, position)",
  "  on v.topic_slug = t.slug and v.subject_slug = s.slug",
  `join exams e on e.id = s.exam_id and e.code = ${q(EXAM.code)}`,
  "on conflict (topic_id, slug) do nothing;",
  "",
];

writeFileSync(new URL("../../supabase/seed.sql", import.meta.url), lines.join("\n"));

const topics = CURRICULUM.flatMap((s) => s.topics);
const concepts = topics.flatMap((t) => t.concepts);
console.log(
  `seed.sql üretildi — ${CURRICULUM.length} ders · ${topics.length} konu · ${concepts.length} kavram · ${PERSONAS.length} persona`,
);
const probes = concepts.filter((c) => c.probe).length;
console.log(`senaryolu soru yazılmış kavram: ${probes}/${concepts.length} (gerisi genel soruyla idare eder)`);
