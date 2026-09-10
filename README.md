# Tutorla

Kullanıcının bir konuyu yapay zekâya **anlatarak** öğrendiği eğitim uygulaması. Roller ters: öğrenci AI, öğretmen kullanıcı.

> Bir konuyu bilmenin testi, onu birine anlatabilmektir.

**Durum:** Marka ve konsept netleşti, MVP geliştirmesi başlamadı.
**Ekip:** 2 kişi · Claude Code (Max) · günde ~3 saat
**Hedef:** ~2,5–3 haftada web MVP

---

## Bu depoda ne var

```
brand/
  marka-dosyasi.html            → çift tıklayıp tarayıcıda aç (canlı marka dosyası)
  marka-dosyasi.artifact.html   → aynı sayfanın Claude Artifact kaynağı (doctype/head yok)
docs/
  proje-dosyasi.md              → konsept, ürün akışı, rekabet, teknik plan, maliyetler
```

`brand/marka-dosyasi.html` interaktif: üç marka yönü arasında geçiş yapar, tema anahtarı taşır ve içinde favicon/küçük logo atölyesi var (ayarları değiştir, SVG'yi kopyala).

---

## Marka özeti

| | |
|---|---|
| Ad | **Tutorla** — İngilizce *tutor* + Türkçe *-la* eki |
| Aktif yön | `1c · Laboratuvar` (petrol yeşili) |
| Deneysel yönler | `Sınırsız` (gece indigo + cyan), `Mesai` (orman + kum + gömlek mavisi) |
| Tipografi | Figtree (başlık/metin) + Newsreader Light Italic (etiket) |
| Logo | `tutorla_` — kare işaret ve alt tire aynı renk; alt tirenin tabanı harflerin tabanıyla aynı düzlemde |

Renk değerleri, kullanım kuralları ve ekran mimarisi için `brand/marka-dosyasi.html`.

---

## Planlanan teknik yığın

Next.js · Supabase (auth + veritabanı) · Claude API · Vercel.
İlk sürüm web; mobil talep görürse ikinci aşamada.

Model stratejisi: Haiku ile başla, gerektikçe Sonnet'e geç. Ürünün kalbi prompt/persona tasarımı — ilk hafta koda dokunmadan orada harcanacak.

---

## Sıradaki adımlar

- [ ] `tutorla.com` / `.app` / `.co` domain müsaitliği
- [ ] TÜRKPATENT'te "Tutorla" sorgusu ve başvuru
- [ ] `@tutorla` — Instagram, X, LinkedIn
- [ ] Favicon üretimi (atölyedeki ayarları kesinleştir, koyu/açık varyant)
- [ ] Üç maskot karakterinin tasarımı
- [ ] Persona prompt'unun "gerçekten öğrenci gibi" seviyesine getirilmesi
- [ ] Kapalı test için 5–10 gerçek öğrenci
- [ ] Fiyatlandırma kararı — henüz konuşulmadı

Tam liste `docs/proje-dosyasi.md` içinde.
