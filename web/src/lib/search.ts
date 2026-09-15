/* Arama için metin normalleştirme.
   Türkçe iki yönlü sorun çıkarıyor: "türev" yazan da "turev" yazan da aynı
   sonucu bulmalı, "İntegral" ile "integral" eşleşmeli. Küçük harfe çevirirken
   tr kuralı, sonra aksan işaretlerini düşür, "ı"yı da "i"ye eşitle. */
export function normalize(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function matches(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(needle);
}

/* Eşleşmenin kalitesi: baştan eşleşen, ortada geçenden önce gelir. */
export function score(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const i = h.indexOf(needle);
  if (i < 0) return -1;
  if (i === 0) return h.length === needle.length ? 0 : 1;
  /* kelime başı */
  return h[i - 1] === " " ? 2 : 3;
}
