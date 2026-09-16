import { describe, expect, it } from "vitest";
import { safeInlineHtml } from "../safeHtml";

describe("mesaj içeriği temizleme", () => {
  it("izin verilen vurguyu bırakır", () => {
    expect(safeInlineHtml("bu <strong>önemli</strong> kısım")).toBe("bu <strong>önemli</strong> kısım");
  });

  it("script etiketini metne çevirir", () => {
    expect(safeInlineHtml("<script>alert(1)</script>")).toBe("&lt;script>alert(1)&lt;/script>");
  });

  it("strong'a öznitelik iliştirilemez", () => {
    expect(safeInlineHtml('<strong onmouseover="x()">a</strong>')).toBe('&lt;strong onmouseover="x()">a</strong>');
  });

  it("img onerror kaçırılır", () => {
    expect(safeInlineHtml('<img src=x onerror=alert(1)>')).toBe("&lt;img src=x onerror=alert(1)>");
  });

  it("& kaçırıldığı için ikinci turda etiket doğmaz", () => {
    /* "&lt;script&gt;" yazan bir kullanıcı gerçekten etiket üretemesin */
    expect(safeInlineHtml("&lt;script&gt;")).toBe("&amp;lt;script&amp;gt;");
  });

  it("boş girdi ve düz metin bozulmaz", () => {
    expect(safeInlineHtml("")).toBe("");
    expect(safeInlineHtml("türev 3 < 5 ve a > b")).toBe("türev 3 &lt; 5 ve a > b");
  });
});
