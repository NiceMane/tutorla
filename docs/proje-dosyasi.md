# Tutorla — Proje Dosyası

**Sürüm:** 1.1 · 11 Eylül 2026
**Durum:** Marka net · landing page hazır · uygulama giriş dahil çalışıyor · yapay zekâ bekliyor
**Ekip:** 2 kişi · Claude Code (Max üyelik) · günde ~3 saat

---

## 1. Tek cümlede

Tutorla, kullanıcının bir konuyu yapay zekâya **anlatarak** öğrendiği bir eğitim uygulamasıdır. Roller terstir: burada öğrenci AI'dır, öğretmen kullanıcıdır.

---

## 2. Problem ve çözüm

**Problem.** Öğrenciler bir konuyu "anladım" sanır, ama anlayış çoğu zaman yüzeyseldir. Gerçek anlama ancak konuyu başkasına anlatmaya çalışınca ortaya çıkar — o an nerede tıkandığın, hangi adımı ezberlediğin belli olur. Klasik test çözme bu boşlukları yakalar ama *nedenini* göstermez.

**Çözüm.** Kullanıcı bir konuyu Tutorla'ya anlatır. AI meraklı bir öğrenci gibi davranır: soru sorar, "neden" der, atlanan adımı fark eder, yanlış anlaşılan yeri geri yansıtır. Oturum sonunda kullanıcı hangi kavramın oturduğunu, hangisinin boşta kaldığını görür.

**Pedagojik dayanak.** Protégé effect / Feynman Tekniği / *Lernen durch Lehren*. Seneca'nın "docendo discimus" (öğreterek öğreniriz) sözü markanın felsefi çıkış noktası.

---

## 3. Hedef kitle

Türkiye'de sınava hazırlanan lise ve üniversite öğrencileri:

- **YKS** — ana kitle, en geniş hacim
- **TÜBİTAK olimpiyatları** (2202 vb.) — küçük ama yüksek motivasyonlu, kavramsal derinlik arayan kesim
- **SAT** — yurt dışı başvurusu yapan kesim

Ortak profil: konuyu gerçekten kavrayıp kavramadığını test etmek isteyen, aktif öğrenme yöntemlerine açık, ezberden rahatsız öğrenci.

---

## 4. Ürün mantığı — bir oturum nasıl işliyor

Tasarımdaki (`1c`) "Öğretme seansı" ekranı ürünün çekirdek akışını gösteriyor:

**1. Bağlam seçimi**
Kullanıcı sınav modunu seçer (YKS / SAT / TÜBİTAK), ardından ders ve konu. Örnek: *matematik → türev → zincir kuralı*.

**2. Öğrenci personası**
AI'ın nasıl bir öğrenci olacağı seçilir. Tasarımda üç persona var:

| Persona | Davranışı |
|---|---|
| **Meraklı** | Çok soru sorar, "neden" der, derinleşmek ister |
| **Şüpheci** | İkna olmaz, karşı örnek arar, gerekçe ister |
| **Aceleci** | Hızlı geçmek ister, özet bekler; kullanıcıyı sadeleştirmeye zorlar |

**3. Anlatım**
Kullanıcı konuyu anlatır. Dört giriş kanalı planlanıyor: **Yaz · Konuş · Tahta · Fotoğraf** (tahta = serbest çizim/formül, fotoğraf = defterden yüklenen çözüm).

**4. Boşluk yakalama**
AI anlatımı takip ederken eksik kalan yerleri işaretler. Tasarımdaki örnek etiket: *"boşluk: çarpımın nedeni açıklanmadı"*. Bu, ürünün en ayırt edici mekanizması — AI cevap vermez, **eksiği görünür kılar**.

**5. Anlayış haritası (sağ panel)**
Konu alt kavramlara bölünür ve her biri oturum boyunca işaretlenir:

```
Zincir kuralı · %40
  ✓ Tanım
  ✓ Bileşke fonksiyon
  ✗ Neden çarpım?
  ✗ Örnek: sin(x²)
  ✗ Sık yapılan hatalar
```

Metrikler: *4 soru soruldu · 2/5 kavram oturdu*.

**6. İki kanıt katmanı — birbirinin ikamesi değil**

Ürün iki farklı şeyi ölçüyor ve ikisi de görünür:

| Katman | Neyi gösterir | Kaynağı |
|---|---|---|
| **Öğrenme kanıtı** | **Ne** öğrendin — anlatarak kapattığın kavramlar | Protégé effect / Feynman |
| **Davranış kanıtı** | **Nasıl** öğrettin — sebat, nedensellik, somutlama… | Wild Zebra hattı |

**Öğrenme kanıtı (protégé effect).** Ürünün temel iddiası: anlatmaya çalışınca boşluğun ortaya çıkar ve yine anlatarak kapanır. Bu yüzden kavramın son durumu yetmez — yolculuğu tutuyoruz. Bir kavram önce `boşluk` olarak işaretlenip sonra `oturdu`ya geçtiyse, arayüzde **"anlatarak kapattın"** diye işaretleniyor. Seansta ilk boşluk çıktığında mekanizma tek cümleyle söyleniyor: *"Öğrencinin takıldığı yer, senin boşluğun."* Panelde birikmiş sayı **öğrenme kanıtın** olarak duruyor. Şemadaki karşılığı `concept_states.was_gap` ve `learning_evidence` görünümü.

**Davranış kanıtı.** Boşluk yakalamanın olumlu ikizi. Sistem anlatım örüntüsünden beş sinyal çıkarır ve her birini **kanıtıyla**, yani o mesajın kendisiyle işaretler:

| Sinyal | Ne zaman |
|---|---|
| **Sebat** | Boşluk çıktıktan sonra pes etmeyip yeniden anlattı |
| **Nedensellik** | Sadece "ne"yi değil "neden"i de anlattı |
| **Somutlama** | Örnek vererek somutladı |
| **Sadeleştirme** | Anlaşılmayınca kısaltıp sadeleştirdi |
| **Merak** | Sorulmadan bir sonraki kavrama geçti |

Aynı kavram için aynı sinyal iki kez verilmez — her tura madalya dağıtmak anlamı öldürür. Birikmiş sinyaller panelde "davranış kanıtın" olarak toplanır.

**İkisi neden birlikte.** Protégé effect ürünün *neden işe yaradığını* açıklar — öğrenme mekanizması odur, ürünün temelidir. Davranış kanıtı ise o mekanizmanın *çalıştığını görünür kılar* ve devam etme motivasyonu verir. Biri temel, diğeri üstüne binen katman; biri diğerinin yerine geçmez. Arayüzde de yan yana duruyorlar: seans ekranında üstte anlayış haritası, altta öğretme davranışı; panelde iki kanıt kartı yan yana.

**Neden bu var.** Fikrin kökeni Wild Zebra (ABD, 2024): 2–9. sınıf için Sokratik AI öğretmen; asıl farklılaştırıcısı değerlendirme tarafında — konuşma örüntüsünden azim/merak sinyali çıkarıp veliye "olumlu an" bildiriyor, yani ürünü satan şey not değil davranış kanıtı.

**Nasıl uyarladık.** Birebir kopyalamadık, çünkü iki fark var. (1) Onlarda AI sorar, öğrenci çözer; bizde öğrenci anlatır — dolayısıyla ölçülen davranış "soruya nasıl yaklaştı" değil **"nasıl öğretti"**. (2) Onların müşterisi veli (2–9. sınıf); bizim kitlemiz YKS'ye hazırlanan lise/üniversite öğrencisi, kararı çoğunlukla kendisi veriyor. Bu yüzden sinyaller **önce öğrencinin kendisine** gösteriliyor: *"Takıldığın yerde pes etmedin"* cümlesi, yüzdeden daha motive edici bir kanıt. Veliye/öğretmene rapor ileride eklenebilir ama ürünün ekseni değil.

**7. Seans notu**
Oturum sonunda davranışsal geri bildirim, varsa davranış kanıtıyla açılır: *"Takıldığın yerde pes etmeyip yeniden anlattın. Öğrencin 'neden' sorularına takılıyor — sebep-sonuçla anlatmayı dene."*

**8. İlerleme**
Sol panelde konu listesi ve her konunun yüzdesi tutulur (Limit 100 · Türev tanımı 92 · Zincir kuralı 40 · Kapalı türev — · İntegral —). Bu, uygulamanın uzun vadeli tutundurma (retention) motoru.

---

## 5. Rekabet ve farklılaşma

**Kategori farkı.** Türkiye'deki eğitim–AI uygulamalarının neredeyse tamamı ters yönde çalışıyor: AI öğretir, öğrenci öğrenir (soru çözüm, özel ders, akıllı öğretici sistemler). Tutorla bunun tersini yapıyor. Yapılan araştırmada Türkiye pazarında "AI'ya öğreterek öğrenme" konseptine odaklanmış yerli bir uygulamaya rastlanmadı.

**Küresel emsaller.** Teach Bob, StudyWizardry — aynı konsept (AI'ya öğretme), Türkçe/Türkiye'ye uyarlanmış karşılıkları yok.

**Kısmen örtüşen:** Wild Zebra (ABD, 2024 · Seed $6M, toplam $8M) — 2–9. sınıf matematik ve okuma için Sokratik AI öğretmen. Cevabı vermiyor, yönlendirici soru soruyor; asıl farklılaştırıcısı değerlendirme tarafında: konuşma örüntüsünden azim ve merak sinyali çıkarıp veliye "olumlu an" bildiriyor. Ürünü veliye satan şey not değil, davranış kanıtı.

Roller hâlâ ters: onlarda AI öğretir. Ama **davranış kanıtı fikri doğru** ve bizde daha güçlü karşılık buluyor — anlatan taraf kullanıcı olduğu için ölçülecek davranış zaten öğretme davranışı. §4'te uyarlanmış hâli var.

**Boşluk.** Türkçe dil desteği + yerel müfredat (YKS, LGS, TÜBİTAK) + ters rol. Üçünün kesişimi şu an boş.

---

## 6. İsim: Tutorla

**Yapı:** İngilizce *tutor* + Türkçe *-la* eki. Türkçe okuyan "öğret-le" emir kipini duyar, İngilizce okuyan Wordle/Kahoot ailesinden bir isim görür.

**Neden bu isim (eleme süreci):**

| Aday | Sonuç |
|---|---|
| **Teachle** | ❌ Dolu — Güney Kore merkezli edtech şirketi, App Store + Google Play'de aktif (teachle.co.kr). Ayrıca Teachly, Teachley, Teachable var. |
| **Grasple** | ❌ Dolu — Amsterdam merkezli, Delft/Utrecht ile çalışan matematik-istatistik platformu. Aynı sektörde kurumsal marka. |
| **Tutorca** | ⚠️ Temiz ama *Tutoria* (AI dil öğrenme uygulaması) sesçe çok yakın. |
| **Tutorla** | ✅ **Seçilen.** Birebir eşleşen marka/uygulama bulunamadı. En yakını *Tutorali* (Şili, PAES hazırlık) — isim olarak yeterince farklı. |

**SEO gerekçesi.** Rakipsiz bir marka adı olduğu için "Tutorla" aramasında ilk sıraya çıkmak kolay. Domain + yayın + Google Search Console kaydı sonrası birkaç gün–birkaç hafta içinde marka aramasında görünürlük bekleniyor. "AI ile öğren" gibi genel kelimeler ayrı bir iş ve aylar sürer.

**Henüz doğrulanmadı (yapılacak):** tutorla.com / .app / .co müsaitliği · TÜRKPATENT marka tescili · Instagram / X handle'ları.

---

## 7. Marka kimliği — yön `Mesai`

Önce `1c · Laboratuvar` (petrol yeşili) seçilmişti; sonra **`Mesai` yönüne geçildi** ve karar bu.
JJK/Nanami esinli: orman yeşili + kum zemin, derin gömlek mavisi ve kavrulmuş amber.

**Karakter:** Kum rengi kâğıt üstünde orman yeşili paneller, derin gömlek mavisi vurgular. Odaklı ve sakin, "mesai" disiplini taşıyan bir dil. Klinik mavi-beyaz edtech'ten uzak.

**Ana slogan:**
> Bir konuyu bilmenin testi, onu birine anlatabilmektir.

**Destek satırı:** *Sınava değil, anlamaya çalışıyorsun.*

**AI'ın ses tonu (örnek):**
> "Hmm, çarpma kısmını anladım sanırım. Bir de neden işe yaradığını söylesen tam oturur."

Ton kuralları: AI asla üstten bakmaz, asla doğrudan öğretmez, cümleleri kısa ve gündelik kurar, tereddüt eder ("sanırım", "hmm"), hep bir adım daha ister.

---

## 8. Görsel sistem

### 8.1 Renk paleti — `Mesai`

| Rol | HEX |
|---|---|
| Ana metin / mürekkep | `#22271A` |
| Koyu panel — orman | `#333F26` |
| Koyu panel açık | `#45523A` |
| **Primary — derin gömlek mavisi** | `#1F6E85` |
| Primary açık (koyu zeminde) | `#8FC4D6` |
| **Accent — kavrulmuş amber** (uyarı/boşluk) | `#9A5615` |
| Accent açık (koyu zeminde) | `#E0A55A` |
| Parıltı | `#4E9BB5` |
| Kum tint | `#E3DECB` |
| Arka plan | `#F8F5EC` |
| Panel arka planı | `#F0ECDF` |
| Kenarlık | `#CFC8B4` |
| İkincil metin | `#4C513E` |
| Koyu zeminde metin | `#EAE6D3` |

**Kullanım kuralı:** Derin mavi = ilerleme, doğru, aktif. Amber = boşluk, eksik kavram, dikkat — asla "yanlış/kırmızı" tonunda değil, davetkâr bir uyarı. Amber ekranda nadir görünmeli ki anlamı korunsun.

Önceki petrol paleti (`1c`) `brand/marka-dosyasi.html` içinde duruyor; dosyanın varsayılanı hâlâ petrol, `Mesai · deneysel` düğmesiyle aktif yöne geçiliyor.

### 8.2 Tipografi

| Kullanım | Font | Detay |
|---|---|---|
| Başlık | **Figtree Bold (700)** | letter-spacing −0.03 / −0.04em |
| Gövde metni | **Figtree Regular / Medium** | 15–16px |
| Etiket, meta, zaman damgası | **Newsreader Light Italic (300)** | petrol yeşili, 15–17px |

Newsreader italik, arayüzün "laboratuvar defteri" hissini veren imza öğesi — sadece etiketlerde kullanılır, gövde metninde asla.

**Türkçe karakter kontrolü yapıldı:** `ı İ ş Ş ğ Ğ ü Ü ö Ö ç Ç` dört dosyada da tam (Figtree ve Newsreader, düz + italik). Tipografik tırnak ve tireler de sağlam.

**Bulunan eksik:** Hiçbirinde `✓` `✕` `●` glifi yok; bu karakterler kullanılırsa sistem fontuna düşer. Uygulamada onay/çarpı işaretleri bu yüzden inline SVG olarak çiziliyor. `₺` Figtree'de yok, Newsreader'da var — fiyat TL gösterilecekse dikkat.

### 8.3 Form dili

- **Köşe yarıçapı:** küçük ve keskin — kartlar 10px, butonlar/rozetler 6px, logo işareti 8px
- **Maskot / avatar formu:** squircle, `border-radius: 30%`
- **Çizgi:** 1px kenarlıklar, gölge yok veya çok hafif

### 8.4 Logo

**Ana logo (verildiği gibi kalacak):**
`tutorla_` — Figtree 700, letter-spacing −0.04em, sondaki alt tire (`_`) petrol yeşili. Solunda 36×36px, 8px yarıçaplı petrol yeşili kare işaret.

Alt tire, imleç/terminal çağrışımıyla "yazmaya hazır, anlat" davetini taşıyor — markanın en ayırt edici öğesi.

**Favicon ve küçük logo — üretildi:** `brand/favicon/`

Yumuşatılmış kare içinde logonun `t` harfi ve sondaki `_` alt tiresi, ikisi aynı renkte. Dört şema (orman, derin mavi, kum, gömlek mavisi) + maskelenebilir uygulama ikonu. Yarıçap %24, iç boşluk %18, `t`↔`_` aralığı 8 birim.

Harfler Figtree ExtraBold gliflerinden **outline'a çevrilmiş path** olarak gömülü — font bağımlılığı yok. Ölçüler ve gerekçeler `brand/favicon/README.md` içinde.

**Bilinen sınır:** 16 px'te alt tire ~1.6 piksele düşer ve tarayıcı yarı saydam çizer. Sekmede netlik şartsa iç boşluğu %12'ye çeken ayrı bir küçük boy varyantı ya da elde ayarlanmış `.ico` gerekir.

### 8.5 Maskotlar

Üç persona için üç karakter: **meraklı · şüpheci · aceleci**. Şu an tasarımda yer tutucu (squircle, çapraz tarama dokusu). Gerçek karakter tasarımı henüz yapılmadı — açık iş kalemi.

---

## 9. Ekran mimarisi

Üç kolonlu tek ekran, yükseklik sabit:

```
┌──────────────┬─────────────────────────┬──────────────────┐
│ 232px        │ esnek                   │ 272px            │
│ KOYU SIDEBAR │ SEANS                   │ ANALİZ           │
│              │                         │                  │
│ · logo       │ · konu başlığı + süre   │ · anlayış        │
│ · sınav modu │ · sohbet akışı          │   haritası       │
│ · konu listesi│ · boşluk etiketleri    │ · metrikler      │
│   + yüzdeler │ · giriş: yaz/konuş/     │ · seans notu     │
│ · öğrencin   │   tahta/fotoğraf        │                  │
└──────────────┴─────────────────────────┴──────────────────┘
```

Kurulan diğer ekranlar: tanışma (`/app/baslangic`, dört adım) · sınav seçimi (`/app`) ·
seans geçmişi (`/app/gecmis`) · profil ve herkese açık profil · akış · bildirimler · pazarlama sitesi.
Kalan: oturum sonu özet ekranı · app store görselleri (mobil aşamasında).

---

## 10. Teknik plan

**Yığın:** Next.js / React (frontend) · Supabase (auth + veritabanı) · Claude API (backend'de) · Vercel (hosting).

**Kurulan (11 Eylül 2026):** Next.js 16 · React 19 · Tailwind v4 · TypeScript · next-intl (tr/en) · next-themes · GSAP + Three.js (landing hero). Supabase projesi `tutorla`, ref `bupgkfzkuanzysdpteiy`, eu-central-1, Postgres 17.

**Veri modeli:** `exams → subjects → topics → concepts` müfredat ağacı; `sessions / messages / gaps / concept_states` kullanıcı verisi; `moments` davranış kanıtı; `posts / comments / reactions / follows / blocks / reports / notifications` sosyal katman; `exam_documents` yüklenen müfredat; `waitlist` erken erişim. İlerleme yüzdesi saklanmaz, `topic_progress` görünümünde türetilir. RLS veritabanının içinde zorlanır.

**Yapay zekâ tek arayüzün arkasında:** `web/src/lib/engine/`. Şu an `ScriptedEngine` (elle yazılmış kurallar) devrede ve arayüzde `senaryolu öğrenci` rozetiyle işaretli; `ClaudeEngine` geldiğinde `engine/index.ts` içinde tek satır değişecek. **Model eğitmek gerekmiyor** — API'ye istek atılıyor.

**İlk sürüm web MVP** — mobil değil. Gerekçe: App Store / Play Store süreci hem yavaş hem maliyetli; talep görürse sonra eklenir.

**Model stratejisi:** Haiku ile başla, gerektikçe Sonnet'e geç. Persona kalitesi kritik olduğu için oturumun "soru sorma" kısmı daha güçlü modele, rutin işler ucuz modele verilebilir.

**Testler:** `web/` altında vitest — `npm test`. Üç dosya, 24 test: motorun sinyal üretimi
(sebat/nedensellik/somutlama/sadeleştirme/merak ve tekrar etmemesi), parola kuralları ve
hata sınıflandırması, müfredat bütünlüğü (slug tekilliği, her konuda kavram olması).

**Ürünün kalbi prompt'tur, kod değil.** İlk haftayı hiç koda dokunmadan Claude.ai üzerinde persona prompt'unu olgunlaştırmaya ayırmak, sonradan mimariyi değiştirmek zorunda kalmayı önler.

### Maliyetler
*(Konuşmadaki güncel fiyatlar — sözleşme öncesi doğrulanmalı)*

**Geliştirme aşaması**

| Kalem | Tutar |
|---|---|
| Claude Max 5x × 2 kişi | ~$200 / ay |
| Domain | ~$10–15 / yıl |

**Lansman sonrası (aylık)**

| Kalem | Tutar |
|---|---|
| Hosting + veritabanı (Vercel + Supabase) | Başta ücretsiz katman → büyüdükçe $20–50 |
| Claude API | Kullanıma bağlı (aşağıda) |
| App Store (mobil olursa) | Apple $99/yıl · Google Play $25 tek seferlik |

**API birim maliyeti** — bir "öğretme oturumu" ≈ 3.000 girdi + 1.000 çıktı token varsayımıyla:

| Model | Fiyat (girdi/çıktı, M token) | Oturum başı | 10.000 oturum/ay |
|---|---|---|---|
| Haiku 4.5 | $1 / $5 | ~$0.008 | ~$80 |
| Sonnet 5 | $2 / $10 | ~$0.016 | ~$160 |
| Opus 5 | $5 / $25 | ~$0.040 | ~$400 |

**Toplam beklenti:** Web MVP + Haiku ile ilk aylarda işletme maliyeti **$50–150/ay** bandında kalır.

---

## 11. MVP takvimi

**Hedef: ~2,5–3 hafta** (2 kişi, günde 3 saat, Claude Code).

| Hafta | Kişi A — AI tarafı | Kişi B — arayüz tarafı |
|---|---|---|
| 1 | Prompt/persona tasarımı ve testi, Claude API entegrasyonu, geri bildirim mantığı | Arayüz iskeleti, auth, veritabanı şeması, sohbet ekranı |
| 2 | Entegrasyon — uçtan uca akışın çalışır hale gelmesi | |
| 3 | Gerçek öğrencilerle kapalı test, hata ayıklama, cilalama | |

Kapsam tek konu / tek özellikle sınırlanırsa 2 haftaya inebilir. Entegrasyon günü genelde tahminden uzun sürer — buffer bırakmak gerekiyor.

**Kapsam daraltma önerisi:** İlk sürüm tek ders (matematik), tek sınav modu (YKS), tek persona (meraklı). Sınav modları, üç persona, tahta ve fotoğraf girişi ikinci sürüme.

---

## 12. Açık işler

**Marka / hukuk**
- [ ] tutorla.com / .app / .co domain müsaitliği
- [ ] TÜRKPATENT'te "Tutorla" marka tescili sorgusu ve başvuru
- [ ] @tutorla — Instagram, X, LinkedIn handle'ları

**Tasarım**
- [x] Favicon üretimi — `brand/favicon/`, dört şema + maskelenebilir
- [x] Figtree ve Newsreader'ın Türkçe karakter kontrolü — tam
- [x] Logo kilitleri düzenlendi — `brand/logo/`
- [ ] Üç maskot karakterinin gerçek tasarımı (arayüzde yer tutucu duruyor)
- [x] Onboarding ve profil/ilerleme ekranları — dört adımlık tanışma, detaylı profil, fotoğraf yükleme
- [x] Profil fotoğrafı: kırpma, döndürme, kameradan çekme, sürükle-bırak, panodan yapıştırma
- [x] Arayüz hareketi: tek bir hareket sözlüğü, hareket kısıtlaması olanlarda kapalı
- [ ] Logo kilitleriyle favicon arasındaki küçük renk farkının giderilmesi

**Ürün**
- [ ] **Persona prompt'u ve Claude entegrasyonu** — asıl iş burada
- [x] Anlayış haritasının nasıl üretileceği — konu başına kavram listesi müfredatta elle tanımlı
- [x] Yüzde skorunun hesaplanma mantığı — oturan kavram / toplam kavram, `topic_progress` görünümü
- [ ] Kapalı test için 5–10 gerçek öğrenci
- [ ] Konuş / Tahta / Fotoğraf giriş kanalları (arayüzde pasif duruyor)
- [x] Uygulama navbar'ı, profil, sınav seçimi (7 sınav türü), akış, Sokratik mod
- [x] Öğrencinin kendi sınavını ekleyip müfredat yükleyebilmesi
- [ ] Yüklenen müfredatın gerçekten işlenmesi — Claude'a bağlı
- [ ] GIF araması için Giphy/Tenor anahtarı (NEXT_PUBLIC_GIPHY_KEY); yoksa bağlantı yapıştırma
- [x] Öğretme davranışı sinyalleri — beş tür, kanıtıyla; panelde birikmiş kanıt
- [ ] Davranış sinyallerinin Claude ile gerçek analize taşınması (şu an kalıp eşleşmesi)
- [ ] Veli/öğretmen raporu — istenirse; ürünün ekseni değil

**Teknik**
- [x] **Giriş ekranları** — `/giris`, e-posta + şifre çalışıyor, `/app` korumalı, çıkış var. Tarayıcıda şifre kalmadı.
- [ ] Google girişi — Google Cloud'da OAuth istemcisi + Supabase'de sağlayıcı ayarı (kod hazır)
- [ ] E-posta onayı / SMTP — yeni kayıtlar doğrulama bekliyor; yayında kendi SMTP'niz gerekli
- [x] Vercel'e deploy — https://tutorla.vercel.app, GitHub'a bağlı
- [ ] Alan adı bağlama (tutorla.com / .app / .co)
- [ ] Supabase panelinde "Leaked password protection" açılması (HaveIBeenPwned kontrolü)
- [ ] Mobilde sol konu listesi (anlayış haritası mobilde açılır panel olarak çözüldü)
- [x] Veritabanı denetçisi bulguları — `reactions`'a birincil anahtar, 21 yabancı anahtara kapsayan indeks
- [x] Tarihler dile göre biçimleniyor (`TimeAgo`); öncesinde Türkçe arayüzde "9/13/2026" görünüyordu

**İş modeli**
- [ ] Fiyatlandırma kararı (ücretsiz oturum kotası + abonelik?) — landing'de "şimdilik ücretsiz" yazıyor, rakam yok
- [ ] Birim ekonomi: oturum başına API maliyeti vs. abonelik fiyatı

## Kaynaklar

- [Tutorla konsept ve marka konuşması](https://claude.ai/share/056cb2c1-bfdf-44b8-84bb-c00aaeb3a79c) — pazar araştırması, isim eleme süreci, teknik plan ve maliyetler
- [Tutorla marka yönü tasarımı (1a/1b/1c)](https://claude.ai/code/artifact/23db43fd-4506-4607-bbc6-f54221bec04c) — seçilen yön: `1c · Laboratuvar`
