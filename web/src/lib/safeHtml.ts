/* Öğrencinin mesajında yalnızca <strong> vurgusu var; gerisi metin.
   Müfredat metinleri bizim, ama kullanıcının yazdığı da aynı borudan geçiyor —
   bu yüzden "izin verilenler dışında her şeyi kaçır" kuralı uygulanıyor.
   Beyaz liste yaklaşımı: kara liste (script'i sil) her zaman delinir. */
const IZINLI = /^<\/?strong>/i;

export function safeInlineHtml(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "&") {
      out += "&amp;";
      continue;
    }
    if (ch !== "<") {
      out += ch;
      continue;
    }
    const kalan = input.slice(i);
    const m = kalan.match(IZINLI);
    if (m) {
      out += m[0].toLowerCase();
      i += m[0].length - 1;
    } else {
      out += "&lt;";
    }
  }
  return out;
}
