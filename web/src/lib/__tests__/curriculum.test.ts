import { describe, expect, it } from "vitest";
import { CURRICULUM, PERSONAS } from "@/lib/curriculum";

describe("müfredat bütünlüğü", () => {
  const topics = CURRICULUM.flatMap((s) => s.topics);
  const concepts = topics.flatMap((t) => t.concepts);

  it("beklenen hacimde", () => {
    expect(CURRICULUM.length).toBe(11);
    expect(topics.length).toBe(24);
    expect(concepts.length).toBe(120);
  });

  it("ders slug'ları benzersiz", () => {
    const slugs = CURRICULUM.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("her konunun kavramları kendi içinde benzersiz", () => {
    for (const t of topics) {
      const slugs = t.concepts.map((c) => c.slug);
      expect(new Set(slugs).size, `${t.slug} içinde tekrar var`).toBe(slugs.length);
    }
  });

  it("her konuda en az üç kavram var — anlayış haritası anlamlı olsun", () => {
    for (const t of topics) expect(t.concepts.length, t.slug).toBeGreaterThanOrEqual(3);
  });

  it("tam olarak bir persona aktif", () => {
    expect(PERSONAS.filter((p) => p.active).length).toBe(1);
  });
});
