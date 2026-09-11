# Tutorla

Kullanıcının bir konuyu yapay zekâya **anlatarak** öğrendiği eğitim uygulaması. Roller ters: öğrenci AI, öğretmen kullanıcı.

> Bir konuyu bilmenin testi, onu birine anlatabilmektir.

**Durum:** Marka net, landing page yayına hazır, uygulama iskeleti çalışıyor. Yapay zekâ ve giriş ekranları bekliyor.
**Ekip:** 2 kişi · Claude Code (Max) · günde ~3 saat
**Hedef:** ~2,5–3 haftada web MVP

---

## Bu depoda ne var

```
brand/
  marka-dosyasi.html            → çift tıklayıp tarayıcıda aç (canlı marka dosyası)
  marka-dosyasi.artifact.html   → aynı sayfanın Claude Artifact kaynağı (doctype/head yok)
  logo/                         → tutorla_ kilitleri (outline SVG, künye README'de)
  favicon/                      → favicon ve uygulama ikonu SVG'leri (künye README'de)
docs/
  proje-dosyasi.md              → konsept, ürün akışı, rekabet, teknik plan, maliyetler
web/
  Next.js landing page          → aşağıda "Landing page" bölümü
```

---

## Landing page (`web/`)

Next.js 16 · React 19 · Tailwind v4 · TypeScript. İki dil (`/` Türkçe, `/en` İngilizce — `next-intl`),
açık/koyu tema (`next-themes`, navbar'daki düğme), Lenis yumuşak kaydırma, GSAP ScrollTrigger,
hero'da Three.js ile extrude edilmiş 3D `tutorla_` kilidi (imleci takip eder, kaydırdıkça yuvarlanıp yerini seans ekranına bırakır).

```bash
cd web
npm install
npm run dev
```

Geliştirme sunucusu `http://localhost:3000` (İngilizce: `/en`). Prod build `npm run build`, lint `npx eslint src`.
Komutların sonuna `#` ile yorum eklemeyin — zsh onu argüman olarak geçirir.

Kaynak yapısı: `src/app/[locale]/(marketing)/` (landing), `src/app/[locale]/app/` (uygulama),
`src/components/` (nav, hero, sections, app, ui), `src/messages/{tr,en}.json` (tüm metinler),
`src/lib/logoPaths.ts` (logo geometrisi — navbar, footer ve 3D aynı kaynaktan).

**Erken erişim formu çalışıyor:** Supabase'deki `waitlist` tablosuna yazar. Tabloda bilerek `select`
politikası yok — herkes kaydolabilir, kimse listeyi istemciden okuyamaz. Liste Supabase panelinden görülür.

---

## Uygulama (`/app`)

`/app` panel — dersler, konular, yüzdeler. `/app/seans/[id]` seans ekranı — üç kolon:
solda konu listesi, ortada sohbet, sağda anlayış haritası.

**Yapay zekâ henüz bağlı değil.** AI'a dokunan her şey `src/lib/engine/` altındaki tek arayüzün
arkasında; şu an elle yazılmış kurallarla çalışan `ScriptedEngine` devrede ve arayüzde
`senaryolu öğrenci` rozetiyle işaretli. Claude'a geçiş `src/lib/engine/index.ts` içinde tek satır.
Eğitim gerekmiyor — Claude API'ye istek, oturum başına ~$0.008 (Haiku).

### Veritabanı

Supabase projesi: **`tutorla`** · ref `bupgkfzkuanzysdpteiy` · eu-central-1 · Postgres 17

```
supabase/migrations/   şema, RLS, tetikleyici sertleştirmesi
supabase/seed.sql      müfredat — ÜRETİLMİŞ, kaynak web/src/lib/curriculum.ts
supabase/dev-user.sql  GEÇİCİ geliştirme hesabı (auth gelince silinecek)
```

Müfredat tek kaynaktan: `web/src/lib/curriculum.ts` → `npm run gen:seed` → `supabase/seed.sql`.
Yüklü içerik: YKS · 4 ders · 17 konu · 85 kavram.

İlerleme yüzdesi saklanmaz, `topic_progress` görünümünde `concept_states`'ten türetilir —
denormalize sayaç yok, sayaç kayması da yok.

### Ortam değişkenleri

`web/.env.local` (git'e girmez, örnek için `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_DEV_EMAIL=...        # geçici
NEXT_PUBLIC_DEV_PASSWORD=...     # geçici
```

Değişkenler yoksa uygulama tarayıcı deposuna düşer ve yine çalışır (`src/lib/repo/index.ts`).

### Auth — açık iş

RLS gerçek bir `auth.uid()` istiyor, ama giriş ekranları henüz yok. Köprü olarak tek bir
geliştirme hesabı kullanılıyor ve **şifresi tarayıcı paketine giriyor** — yayına çıkmadan önce
mutlaka kaldırılmalı. Daha temizi: Supabase panelinde
`Authentication → Sign In / Providers → Anonymous sign-ins` açılırsa her cihaz kendi hesabını alır;
kod bunu zaten destekliyor (`src/lib/supabase.ts`).

`brand/marka-dosyasi.html` interaktif: üç marka yönü arasında geçiş yapar, tema anahtarı taşır ve içinde favicon/küçük logo atölyesi var (ayarları değiştir, SVG'yi kopyala).

---

## Marka özeti

| | |
|---|---|
| Ad | **Tutorla** — İngilizce *tutor* + Türkçe *-la* eki |
| Aktif yön | `Mesai` — orman yeşili + kum, derin gömlek mavisi, kavrulmuş amber |
| Önceki yönler | `1c · Laboratuvar` (petrol yeşili), `Sınırsız` (gece indigo + cyan) |
| Tipografi | Figtree (başlık/metin) + Newsreader Light Italic (etiket) |
| Logo | `tutorla_` — kare işaret ve alt tire aynı renk; alt tirenin tabanı harflerin tabanıyla aynı düzlemde |

Ana renkler: mürekkep `#22271A` · orman `#333F26` · derin mavi `#1F6E85` · kum `#F8F5EC` · amber `#E0A55A`.

Logo kilitleri `brand/logo/`, favicon ve uygulama ikonları `brand/favicon/` — ikisinin de künyesi
kendi klasöründeki README'de. Renk değerleri ve ekran mimarisi için `brand/marka-dosyasi.html`
(dosyanın varsayılanı hâlâ petrol; `Mesai · deneysel` düğmesiyle aktif yöne geçilir).

---

## Planlanan teknik yığın

Next.js · Supabase (auth + veritabanı) · Claude API · Vercel.
İlk sürüm web; mobil talep görürse ikinci aşamada.

Model stratejisi: Haiku ile başla, gerektikçe Sonnet'e geç. Ürünün kalbi prompt/persona tasarımı — ilk hafta koda dokunmadan orada harcanacak.

---

## Sıradaki adımlar

- [x] Favicon ve uygulama ikonu üretimi — `brand/favicon/`, dört şema + maskelenebilir
- [x] Figtree ve Newsreader'ın Türkçe karakter kontrolü — dördü de tam
- [x] Landing page — `web/`, iki dil, açık/koyu tema
- [x] Veritabanı şeması ve RLS — Supabase `tutorla`
- [x] Uygulama iskeleti — panel + seans ekranı, çalışır durumda
- [ ] **Auth** — e-posta + Google; şu an geçici geliştirme hesabı var, şifresi tarayıcıya giriyor
- [ ] **Claude API** — persona prompt'u ve `ClaudeEngine`
- [ ] `tutorla.com` / `.app` / `.co` domain müsaitliği
- [ ] TÜRKPATENT'te "Tutorla" sorgusu ve başvuru
- [ ] `@tutorla` — Instagram, X, LinkedIn
- [ ] Üç maskot karakterinin tasarımı
- [ ] Kapalı test için 5–10 gerçek öğrenci
- [ ] Fiyatlandırma kararı — henüz konuşulmadı

Tam liste `docs/proje-dosyasi.md` içinde.
