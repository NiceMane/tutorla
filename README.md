# Tutorla

Kullanıcının bir konuyu yapay zekâya **anlatarak** öğrendiği eğitim uygulaması. Roller ters: öğrenci AI, öğretmen kullanıcı.

> Bir konuyu bilmenin testi, onu birine anlatabilmektir.

**Durum:** Yayında — https://tutorla.vercel.app · giriş dahil çalışıyor · yapay zekâ bekliyor.

**Depo:** github.com/NiceMane/tutorla → Vercel'e bağlı, `main`'e her push otomatik dağıtılıyor.
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
açık/koyu tema (`next-themes`, navbar'daki düğme), GSAP ScrollTrigger (kaydırma yumuşatması
kütüphaneyle değil, `scrub` ile — Lenis kaldırıldı: tekerleği ele geçirmek kaydırmayı kaygan yapıyordu),
hero'da Three.js ile extrude edilmiş 3D `tutorla_` kilidi (imleci takip eder, kaydırdıkça yuvarlanıp yerini seans ekranına bırakır).

```bash
cd web
npm install
npm run dev
```

Ortam değişkenleri için `web/.env.example`'ı `web/.env.local`'a kopyalayıp Supabase panelinden
(Project Settings → API) doldurun. Değişken yoksa uygulama tarayıcı deposuna düşer ve yine çalışır.

### Dağıtım

Vercel projesi `tutorla`, kök dizin `web`, GitHub deposuna bağlı — `main`'e push edince otomatik
dağıtılıyor. Elle dağıtım için **depo kökünden** `npx vercel deploy --prod` (kök dizin ayarı `web`
olduğu için `--cwd web` ile çalışmaz).

Geliştirme sunucusu `http://localhost:3000` (İngilizce: `/en`). Prod build `npm run build`,
lint `npx eslint src`, testler `npm test` (vitest — motor, parola kuralları, müfredat bütünlüğü).
Komutların sonuna `#` ile yorum eklemeyin — zsh onu argüman olarak geçirir.

Kaynak yapısı: `src/app/[locale]/(marketing)/` (landing), `src/app/[locale]/app/` (uygulama),
`src/components/` (nav, hero, sections, app, ui), `src/messages/{tr,en}.json` (tüm metinler),
`src/lib/logoPaths.ts` (logo geometrisi — navbar, footer ve 3D aynı kaynaktan).

**Erken erişim formu çalışıyor:** Supabase'deki `waitlist` tablosuna yazar. Tabloda bilerek `select`
politikası yok — herkes kaydolabilir, kimse listeyi istemciden okuyamaz. Liste Supabase panelinden görülür.

---

## Uygulama (`/app`)

Kalıcı navbar: **Derslerim · Sokratik · Geçmiş · Akış · Mesajlar · Bildirimler · Profil** —
her biri ikonuyla; dar ekranda etiketler düşüyor, ikon kalıyor. Okunmamış mesaj ve
bildirim sayısı rozetle görünüyor.

| Rota | Ne |
|---|---|
| `/app` | Sınav seçimi — YKS hazır, diğerleri "yakında"; kendi sınavını ekleyebilirsin |
| `/app/sinav/[code]` | O sınavın dersleri, konuları, yüzdeleri ve iki kanıt kartı |
| `/app/seans/[id]` | Seans ekranı — üç kolon: konu listesi, sohbet, anlayış haritası |
| `/app/sokratik` | Sokratik mod — ana modun tersi: o sorar, sen düşünürsün |
| `/app/akis` | Akış — Tümü/Takip/Kayıtlılar sekmeleri, sayfalama, iyimser tepkiler, düzenleme, yer imi, şikâyet |
| `/app/profil` | Profil — fotoğraf (kırp/döndür/kameradan çek), kimlik, öğrencilik, hedef, çalışma alışkanlığı, gizlilik + özet |
| `/app/profil/[handle]` | Herkese açık profil — takip et, engelle, şikâyet et |
| `/app/bildirimler` | Bildirimler — yorum, yanıt, tepki, takip |
| `/app/gecmis` | Seans geçmişi — hangi konu, hangi mod, ne zaman |
| `/app/baslangic` | Dört adımlık tanışma — ilk girişte bir kez, `profiles.onboarded_at` ile |
| `/app/mesajlar` | Birebir mesajlaşma — anlık (realtime), okunmamış rozeti, profilden başlatılır |
| `/app/ara` | Arama — konu, kavram, kişi, gönderi, sınav; paylaşılabilir `?q=` adresi |
| `/app/rehber` | Rehber — 11 bölümlük kullanım kılavuzu + turu yeniden başlatma |

**İki mod, iki motor.** `teach` modunda kullanıcı anlatır, AI öğrencidir (ürünün çekirdeği).
`socratic` modunda roller klasiktir: cevabı vermez, daraltan sorularla götürür. İkisi de
`src/lib/engine/` altında, seçim `getEngine(mode)` ile.

**Tanıtım turu.** İlk girişte (hangi sayfada olursa olsun) animasyonlu bir karşılama
popup'ı açılıyor. "Turu başlat" deyince spot ışığı gerçek arayüzdeki öğelerin üstünde
kayarak ilerliyor — Derslerim, sınav kartı, Sokratik, Geçmiş, Akış, Mesajlar,
Bildirimler, arama, Profil — ve her adımda öğenin yanında, özelliği küçük canlı bir
sahneyle gösteren bir kart beliriyor (yazılan arama, dolan çubuk, gelen mesaj…).
Kapanış popup'ı ilk konuya götürüyor. `profiles.tour_done_at` ile bir kez; navbar'daki
`?` ile tekrar izlenir. Telefonda kart alttan yaprak olarak geliyor. Uzun anlatım
isteyenler için `/app/rehber` ayrıca duruyor.

**Arama.** Navbar'daki büyüteç ya da **⌘K / Ctrl+K**. Konular ve kavramlar zaten
bellekte olduğu için anında eşleşiyor; kişiler ve gönderiler veritabanından geliyor
(220 ms gecikmeli, eski yanıtlar eleniyor). Türkçe iki yönlü normalleştiriliyor:
"turev" yazan da "türev" yazan da aynı sonucu buluyor. Konuya basınca açık seans
varsa ona devam ediyor, yoksa yenisini açıyor. ↑↓ ile gez, ⏎ ile aç.

**Mesajlaşma.** Akış herkese açık; mesajlar iki kişi arasında kalıyor. Kanal bir
profildeki "Mesaj gönder" ile açılıyor (`dm_kanal_ac` işlevi — engel kontrolünü de
o yapıyor), yeni mesajlar Supabase realtime ile anında düşüyor, dakikada 30 mesaj
kotası veritabanı tetikleyicisinde. Engellenen biriyle kanal açılmıyor, açık kanala
da yazılamıyor.

**Profil alanları serbest.** Sınıf, alan, şehir, çalışma düzeni, hedef üniversite ve
bölüm artık öneri listesi gösteren ama listeye hapsetmeyen alanlar: hazırlık sınıfındaki
de, açıköğretimdeki de, "sabah 5'te kalkarım" diyen de kendini yazabiliyor. Eksik
alanlar profilde adıyla sayılıyor ve tek tıkla forma götürüyor.

**Güvenlik ağı.** Şikâyet (gönderi/yorum/profil), engelleme (engellenen içerik RLS düzeyinde
akıştan düşer), kota sınırı (dakikada 3 gönderi / 8 yorum — veritabanı tetikleyicisiyle, istemciye
güvenilmiyor). `error.tsx`, kök ve dil içi `not-found.tsx`, ortak iskelet/boş/hata bileşenleri.

**SEO.** `sitemap.xml`, `robots.txt` (uygulama ve giriş dizine girmez), Open Graph paylaşım görseli.

**Fotoğraf her yerde aynı yoldan geçiyor.** `src/components/media/` altında tek bir
zincir var: dosya seç · sürükle-bırak · panodan yapıştır · kameradan çek → kırp
(sürükle, tekerlek/iki parmak, 90° döndür) → tarayıcıda WebP'ye kodla → yükle.
Önizleme ile çıktı aynı çizim kodundan üretiliyor: ne görüyorsan o kaydediliyor.
512×512 avatar ~4 KB, telefonla çekilen 8 MB'lık kare akışta ~130 KB'a iniyor.

**Hareket sözlüğü.** `globals.css` içinde tek yerde: sıralı beliriş (`stagger`),
kart kalkışı (`lift`), dolan çubuk (`bar-fill`), yeni satır vurgusu (`anim-flash`),
kayma/pop/sarsıntı ve kısa onaylar için `ToastHost`. Hepsi
`prefers-reduced-motion` altında kapanıyor.

**Kendi sınavını ekleme.** Listede olmayan bir sınav eklenip müfredat bilgisi yüklenebiliyor
(`exam_documents` + `exam-docs` depolama kovası). Yapay zekâ bağlanana kadar yüklenenler
**saklanıyor ama işlenmiyor** — arayüzde de böyle yazıyor.

Kendi eklediğin sınava **ders, konu ve kavram** ekleyip silebiliyorsun; yüklediğin belgeyi
imzalı bağlantıyla açıp silebiliyorsun. Resmî müfredata (YKS) dokunulamıyor: RLS'te ayrım
`created_by is null` üzerinden, `sinav_sahibi(exam_id)` kontrolüyle yapılıyor — istemciye güvenilmiyor.

**Yapay zekâ henüz bağlı değil.** AI'a dokunan her şey `src/lib/engine/` altındaki tek arayüzün
arkasında; şu an elle yazılmış kurallarla çalışan `ScriptedEngine` devrede ve arayüzde
`senaryolu öğrenci` rozetiyle işaretli. Claude'a geçiş `src/lib/engine/index.ts` içinde tek satır.
Eğitim gerekmiyor — Claude API'ye istek, oturum başına ~$0.008 (Haiku).

### Veritabanı

Supabase projesi: **`tutorla`** · ref `bupgkfzkuanzysdpteiy` · eu-central-1 · Postgres 17

```
supabase/migrations/   şema, RLS, davranış anları, akış, profil, sınavlar, kendi müfredatın
supabase/storage.sql   depolama kovaları ve politikaları (elle uygulanır)
supabase/seed.sql      müfredat — ÜRETİLMİŞ, kaynak web/src/lib/curriculum.ts
supabase/dev-user.sql  GEÇİCİ geliştirme hesabı (auth gelince silinecek)
```

Müfredat tek kaynaktan: `web/src/lib/curriculum.ts` → `npm run gen:seed` → `supabase/seed.sql`.
Yüklü içerik: **YKS · 11 ders · 24 konu · 120 kavram** — matematik, fizik, kimya, biyoloji,
Türkçe, edebiyat, tarih, coğrafya, felsefe, din kültürü, İngilizce.

İlerleme yüzdesi saklanmaz, `topic_progress` görünümünde `concept_states`'ten türetilir —
denormalize sayaç yok, sayaç kayması da yok.

**İki kanıt katmanı, birbirinin ikamesi değil:**

- **Öğrenme kanıtı — ne öğrendin.** Protégé effect'in üründeki izi: bir kavram önce boşluk olup
  sonra oturduysa "anlatarak kapattın" diye işaretlenir. `concept_states.was_gap` +
  `learning_evidence` görünümü.
- **Davranış kanıtı — nasıl öğrettin.** `moments` tablosu anlatım örüntüsünden çıkan beş sinyali
  (sebat, nedensellik, somutlama, sadeleştirme, merak) kanıt mesajına bağlı tutar;
  `teaching_profile` görünümü toplar.

Protégé effect temel (neden işe yarıyor), davranış kanıtı üstüne binen katman (çalıştığını
görünür kılıyor). Gerekçe ve Wild Zebra karşılaştırması `docs/proje-dosyasi.md` §4'te.

### Ortam değişkenleri

`web/.env.local` (git'e girmez, örnek için `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_DEV_EMAIL=...        # geçici
NEXT_PUBLIC_DEV_PASSWORD=...     # geçici
```

Değişkenler yoksa uygulama tarayıcı deposuna düşer ve yine çalışır (`src/lib/repo/index.ts`).

### Giriş

`/giris` — e-posta + şifre ve Google ile giriş. `/app` altındaki her şey `RequireAuth` ile korunuyor;
oturum yoksa girişe yönlendiriyor. Asıl güvenlik sınırı yine RLS, bu katman yalnızca kullanıcıyı
boş ekranla baş başa bırakmamak için.

Hesap açarken: şifre iki kez, canlı koşul listesi (en az 8 karakter · bir harf · bir rakam) ve
göster/gizle düğmesi. Koşullar sağlanana ve iki alan eşleşene kadar düğme pasif. Girişte yalnızca
uzunluk kontrolü var — eski hesaplar yeni kurallara takılmasın diye.

**Şifremi unuttum** giriş ekranında: adresini yaz, sıfırlama bağlantısı gelsin. Bağlantı
`/sifre-yenile` sayfasına düşer, oradan yeni şifre belirlenir (aynı koşullar geçerli).
Adresin kayıtlı olup olmadığı bilerek söylenmez — "bu adres kayıtlıysa gönderildi" denir.

**E-postalar markalı.** Supabase'in varsayılan şablonları yerine `supabase/emails/`
altındaki altı şablon kullanılıyor: Tutorla logosu, Mesai paleti, Türkçe metin ve altında
İngilizce karşılığı, her birinde "ne kadar geçerli / kaç kez / sen istemediysen" cümlesi.
Uygulaması: `SUPABASE_ACCESS_TOKEN=... node supabase/emails/uygula.mjs`.

Not: bu koşullar istemcide. Sunucu tarafında da zorlamak isterseniz Supabase panelinde
`Authentication → Policies → Password requirements` ayarlanabilir.

Tarayıcı paketinde artık hiçbir şifre yok; geçici otomatik giriş kaldırıldı.

**İki dashboard ayarı gerekiyor:**

1. **Google girişi** — Google Cloud'da bir OAuth istemcisi açıp Supabase'de
   `Authentication → Sign In / Providers → Google` altına anahtarları girmek gerek.
   Yapılmadan düğme "Google girişi bu projede henüz açık değil" der.
2. **E-posta onayı** — yeni kayıtlarda Supabase doğrulama e-postası bekliyor, kullanıcı
   linke tıklayana kadar giremiyor (arayüz bunu "E-postanı kontrol et" ekranıyla gösteriyor).
   Geliştirirken kapatmak için `Authentication → Sign In / Providers → Email → Confirm email`.
   Yayında kendi SMTP'nizi bağlamak gerekiyor — Supabase'in yerleşik e-postası saatte birkaç
   mesajla sınırlı.

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
- [x] **Giriş ekranları** — e-posta + şifre çalışıyor; Google için dashboard ayarı gerekiyor
- [x] Profil derinliği, tanışma akışı, seans geçmişi, kendi müfredatını düzenleme
- [x] Landing'de SSS ve fiyatlandırma bölümleri
- [x] Testler — `npm test` (24 test: motor sinyalleri, parola kuralları, müfredat bütünlüğü)
- [x] Fotoğraf zinciri — kırpma, döndürme, kamera, sürükle-bırak, yapıştırma, WebP sıkıştırma
- [x] Arayüz hareketi — sıralı beliriş, dolan çubuklar, toast onayları, adım geçişleri
- [ ] **Claude API** — persona prompt'u ve `ClaudeEngine`
- [ ] `tutorla.com` / `.app` / `.co` domain müsaitliği
- [ ] TÜRKPATENT'te "Tutorla" sorgusu ve başvuru
- [ ] `@tutorla` — Instagram, X, LinkedIn
- [ ] Üç maskot karakterinin tasarımı
- [ ] Kapalı test için 5–10 gerçek öğrenci
- [ ] Fiyatlandırma kararı — henüz konuşulmadı

Tam liste `docs/proje-dosyasi.md` içinde.
