import { describe, expect, it } from "vitest";
import { safeNext } from "../safeRedirect";

describe("giriş sonrası yönlendirme", () => {
  it("kendi yollarımızı kabul eder", () => {
    expect(safeNext("/app/akis")).toBe("/app/akis");
    expect(safeNext("/app/sinav/YKS?x=1")).toBe("/app/sinav/YKS?x=1");
  });

  it("dış adresleri reddeder", () => {
    for (const kotu of ["https://evil.com", "//evil.com", "/\\evil.com", "http://evil.com", "javascript:alert(1)"]) {
      expect(safeNext(kotu)).toBe("/app");
    }
  });

  it("boş ve bozuk girdide varsayılana döner", () => {
    expect(safeNext(null)).toBe("/app");
    expect(safeNext("")).toBe("/app");
    expect(safeNext("/app\\..\\etc")).toBe("/app");
    expect(safeNext("/app\nSet-Cookie: x=1")).toBe("/app");
  });
});
