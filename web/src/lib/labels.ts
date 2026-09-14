/* Serbest metin alanlarının etiketi: bilinen anahtarın çevirisi varsa onu,
   yoksa kullanıcının yazdığını gösterir. ("hazirlik" → "Hazırlık",
   "sabah 6'da kalkıyorum" → olduğu gibi.) */
type Translator = ((key: string) => string) & { has: (key: string) => boolean };

export function optionLabel(t: unknown, ns: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const tr = t as Translator;
  const key = `${ns}.${value}`;
  try {
    return tr.has(key) ? tr(key) : value;
  } catch {
    return value;
  }
}
