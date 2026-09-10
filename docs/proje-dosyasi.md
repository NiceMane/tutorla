# Tutorla — Proje Dosyası

**Sürüm:** 1.0 · 9 Eylül 2026
**Durum:** Marka ve konsept netleşti, MVP geliştirmesi başlamadı
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

**6. Seans notu**
Oturum sonunda davranışsal geri bildirim: *"Öğrencin 'neden' sorularına takılıyor. Sebep-sonuçla anlatmayı dene."*

**7. İlerleme**
Sol panelde konu listesi ve her konunun yüzdesi tutulur (Limit 100 · Türev tanımı 92 · Zincir kuralı 40 · Kapalı türev — · İntegral —). Bu, uygulamanın uzun vadeli tutundurma (retention) motoru.

---

## 5. Rekabet ve farklılaşma

**Kategori farkı.** Türkiye'deki eğitim–AI uygulamalarının neredeyse tamamı ters yönde çalışıyor: AI öğretir, öğrenci öğrenir (soru çözüm, özel ders, akıllı öğretici sistemler). Tutorla bunun tersini yapıyor. Yapılan araştırmada Türkiye pazarında "AI'ya öğreterek öğrenme" konseptine odaklanmış yerli bir uygulamaya rastlanmadı.

**Küresel emsaller.** Teach Bob, StudyWizardry — aynı konsept, Türkçe/Türkiye'ye uyarlanmış karşılıkları yok.

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

## 7. Marka kimliği — yön `1c · Laboratuvar`

Üç yön çalışıldı (`1a` Kütüphane — sıcak kâğıt/kehribar, `1b`, `1c` Laboratuvar). **Karar: 1c.**

**Karakter:** Sakin petrol yeşili, hafif italik etiketler. Odaklı ve bilimsel, ama yumuşak. Klinik mavi-beyaz edtech'ten uzak; "çalışma masası" hissi veren, ciddi ama soğuk olmayan bir dil.

**Ana slogan:**
> Bir konuyu bilmenin testi, onu birine anlatabilmektir.

**Destek satırı:** *Sınava değil, anlamaya çalışıyorsun.*

**AI'ın ses tonu (örnek):**
> "Hmm, çarpma kısmını anladım sanırım. Bir de neden işe yaradığını söylesen tam oturur."

Ton kuralları: AI asla üstten bakmaz, asla doğrudan öğretmez, cümleleri kısa ve gündelik kurar, tereddüt eder ("sanırım", "hmm"), hep bir adım daha ister.

---

## 8. Görsel sistem

### 8.1 Renk paleti

| Rol | oklch | HEX |
|---|---|---|
| Ana metin / mürekkep | `oklch(22% 0.03 190)` | `#071F1E` |
| Koyu panel (sidebar) | `oklch(24% 0.04 190)` | `#012523` |
| Koyu panel aktif satır | `oklch(32% 0.04 190)` | `#173937` |
| **Primary — petrol yeşili** | `oklch(55% 0.11 170)` | `#008668` |
| Primary açık (koyu zeminde) | `oklch(70% 0.11 170)` | `#4AB494` |
| **Accent — sıcak turuncu** (uyarı/boşluk) | `oklch(55% 0.11 50)` | `#A45C31` |
| Accent açık (koyu zeminde) | `oklch(75% 0.11 50)` | `#E6996D` |
| Yüzey tint | `oklch(93% 0.02 170)` | `#DCECE6` |
| Arka plan | `oklch(99% 0.005 170)` | `#F9FDFB` |
| Panel arka planı | `oklch(97% 0.01 170)` | `#EFF7F4` |
| Kenarlık | `oklch(87% 0.02 170)` | `#C8D9D2` |
| İkincil metin | `oklch(45% 0.03 190)` | `#425B59` |
| Etiket / soluk metin | `oklch(50% 0.03 190)` | `#506967` |
| Koyu zeminde metin | `oklch(92% 0.02 170)` | `#D8E9E2` |
| Koyu zeminde soluk metin | `oklch(72% 0.03 190)` | `#90ABA9` |

**Kullanım kuralı:** Petrol yeşili = ilerleme, doğru, aktif. Turuncu = boşluk, eksik kavram, dikkat — asla "yanlış/kırmızı" tonunda değil, davetkâr bir uyarı. Turuncu ekranda nadir görünmeli ki anlamı korunsun.

### 8.2 Tipografi

| Kullanım | Font | Detay |
|---|---|---|
| Başlık | **Figtree Bold (700)** | letter-spacing −0.03 / −0.04em |
| Gövde metni | **Figtree Regular / Medium** | 15–16px |
| Etiket, meta, zaman damgası | **Newsreader Light Italic (300)** | petrol yeşili, 15–17px |

Newsreader italik, arayüzün "laboratuvar defteri" hissini veren imza öğesi — sadece etiketlerde kullanılır, gövde metninde asla.

Türkçe karakter desteği (ı, ş, ğ, ü, ö, ç) her iki fontta da doğrulanmalı.

### 8.3 Form dili

- **Köşe yarıçapı:** küçük ve keskin — kartlar 10px, butonlar/rozetler 6px, logo işareti 8px
- **Maskot / avatar formu:** squircle, `border-radius: 30%`
- **Çizgi:** 1px kenarlıklar, gölge yok veya çok hafif

### 8.4 Logo

**Ana logo (verildiği gibi kalacak):**
`tutorla_` — Figtree 700, letter-spacing −0.04em, sondaki alt tire (`_`) petrol yeşili. Solunda 36×36px, 8px yarıçaplı petrol yeşili kare işaret.

Alt tire, imleç/terminal çağrışımıyla "yazmaya hazır, anlat" davetini taşıyor — markanın en ayırt edici öğesi.

**Favicon ve küçük logo (karar):**
Kenarları yumuşatılmış bir kare içinde, logonun **`t`** harfi ve sondaki **`_`** alt tiresi. Petrol yeşili zemin üzerine açık renk, ya da açık zemin üzerine petrol yeşili — her iki varyant da üretilmeli (koyu/açık tema, App Store, tarayıcı sekmesi).

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

Tasarlanacak diğer ekranlar: onboarding/karşılama · konu seçimi · oturum sonu özet · profil/ilerleme · pazarlama sitesi · app store görselleri (mobil aşamasında).

---

## 10. Teknik plan

**Yığın:** Next.js / React (frontend) · Supabase (auth + veritabanı) · Claude API (backend'de) · Vercel (hosting).

**İlk sürüm web MVP** — mobil değil. Gerekçe: App Store / Play Store süreci hem yavaş hem maliyetli; talep görürse sonra eklenir.

**Model stratejisi:** Haiku ile başla, gerektikçe Sonnet'e geç. Persona kalitesi kritik olduğu için oturumun "soru sorma" kısmı daha güçlü modele, rutin işler ucuz modele verilebilir.

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
- [ ] Favicon üretimi (yuvarlatılmış kare + `t` + `_`, koyu/açık varyant)
- [ ] Üç maskot karakterinin gerçek tasarımı
- [ ] Onboarding, oturum sonu özet, profil ekranları
- [ ] Figtree ve Newsreader'ın Türkçe karakter kontrolü

**Ürün**
- [ ] Persona prompt'unun "gerçekten öğrenci gibi" seviyesine getirilmesi
- [ ] "Anlayış haritası"nın nasıl üretileceği — konu başına kavram listesi elle mi, modelle mi?
- [ ] Yüzde skorunun hesaplanma mantığı
- [ ] Kapalı test için 5–10 gerçek öğrenci bulunması

**İş modeli**
- [ ] Fiyatlandırma kararı (ücretsiz oturum kotası + abonelik?) — henüz konuşulmadı
- [ ] Birim ekonomi: oturum başı API maliyeti vs. abonelik fiyatı

---

## Kaynaklar

- [Tutorla konsept ve marka konuşması](https://claude.ai/share/056cb2c1-bfdf-44b8-84bb-c00aaeb3a79c) — pazar araştırması, isim eleme süreci, teknik plan ve maliyetler
- [Tutorla marka yönü tasarımı (1a/1b/1c)](https://claude.ai/code/artifact/23db43fd-4506-4607-bbc6-f54221bec04c) — seçilen yön: `1c · Laboratuvar`
