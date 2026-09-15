import { describe, expect, it } from "vitest";
import { matches, normalize, score } from "../search";

describe("arama metni", () => {
  it("Türkçe harfleri aksansız yazana da bulur", () => {
    expect(matches("Türev tanımı", normalize("turev"))).toBe(true);
    expect(matches("Zincir kuralı", normalize("zincir kurali"))).toBe(true);
    expect(matches("Coğrafya", normalize("cografya"))).toBe(true);
    expect(matches("İntegral", normalize("integral"))).toBe(true);
  });

  it("aksanlı yazana da bulur", () => {
    expect(matches("Turev", normalize("türev"))).toBe(true);
    expect(matches("Iklim tipleri", normalize("İklim"))).toBe(true);
  });

  it("ilgisiz metni bulmaz", () => {
    expect(matches("Limit", normalize("integral"))).toBe(false);
  });

  it("baştan eşleşmeyi öne alır", () => {
    const q = normalize("tur");
    expect(score("Türev", q)).toBeLessThan(score("Kapalı türev", q));
    expect(score("Türev", q)).toBeLessThan(score("Batur", q));
  });

  it("eşleşme yoksa -1 döner", () => {
    expect(score("Limit", normalize("xyz"))).toBe(-1);
  });
});
