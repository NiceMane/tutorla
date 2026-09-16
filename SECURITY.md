# Güvenlik

Tutorla'nın saldırı yüzeyi ve alınan önlemler. Bir açık bulursan
`ustadaligok@gmail.com` adresine yaz; kamuya açık bir yerde paylaşma.

## Sınır nerede?

Tek gerçek güvenlik sınırı **veritabanının içi**. İstemci Supabase'e doğrudan
konuşuyor; arada bizim yazdığımız bir sunucu yok. Bu yüzden her tablo RLS
(satır düzeyi güvenlik) ile korunuyor ve arayüzdeki hiçbir kontrol güvenlik
önlemi sayılmıyor — istemciye asla güvenilmiyor.

| Katman | Önlem |
|---|---|
| Veri | 25 tablonun tamamında RLS açık; politikalar `auth.uid()` üzerinden |
| Kota | Gönderi (3/dk), yorum (8/dk), mesaj (30/dk) — veritabanı tetikleyicisinde |
| Taciz | Şikâyet + engelleme; engellenen içerik RLS düzeyinde akıştan düşer |
| Depolama | Kovalar boyut ve MIME sınırlı; `exam-docs` özel, imzalı bağlantı (300 sn) |
| Tarayıcı | CSP (nonce'lu), HSTS, çerçeveleme yasak, Permissions-Policy |

## Uygulanmış önlemler

**İçerik Güvenliği Politikası.** `src/proxy.ts` her istekte bir nonce üretiyor;
Next kendi satır içi script'lerine, biz de next-themes'in tema script'ine bunu
veriyoruz. `script-src` içinde `'unsafe-inline'` yok — bir XSS deliği açılsa bile
script çalıştırmak kolay değil. `connect-src` yalnızca kendi alan adımız,
Supabase (https + wss) ve Giphy API; `img-src` kendi depomuz + Giphy/Tenor;
`frame-ancestors 'none'` ile tıklama hırsızlığı kapalı.

**Diğer başlıklar** (`next.config.ts`): `Strict-Transport-Security` (2 yıl,
preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
(kamera yalnızca kendi sayfamıza, mikrofon/konum/ödeme kapalı),
`Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. `X-Powered-By`
kapatıldı.

**XSS.** React zaten kaçırıyor; tek istisna seans mesajlarındaki `<strong>`
vurgusu. Orası beyaz listeyle temizleniyor (`src/lib/safeHtml.ts`): izin verilen
iki etiket dışında `<` ve `&` kaçırılıyor, yani öznitelik iliştirilemiyor.
Testleri `src/lib/__tests__/safeHtml.test.ts` içinde.

**Açık yönlendirme.** `/giris?next=` kullanıcıdan geliyor; `safeNext()` yalnızca
tek eğik çizgiyle başlayan kendi yollarımızı kabul ediyor.

**Medya adresleri.** `post_media.url`, `comments.gif_url` ve `profiles.avatar_url`
veritabanı kısıtıyla beyaz listeye bağlı (kendi depomuz, Giphy, Tenor). Aksi
halde tek bir kötü niyetli gönderi, onu gören herkesin sayfasını çökertebilir
(next/image tanımadığı alan adında hata fırlatıyor) ve okuyanların IP'sini
yabancı bir sunucuya taşıyabilirdi.

**SECURITY DEFINER işlevler.** RLS'in içinde kullanılan yardımcı işlev API'ye
açılmayan `private` şemasında; tetikleyici işlevlerinin `EXECUTE` yetkisi geri
alındı. Dışarıdan çağrılabilen tek işlev `dm_kanal_ac` ve o da kendi içinde
oturum, engel ve hedef kontrolü yapıyor.

**Sırlar.** Depoda hiçbir anahtar yok. İstemcideki tek anahtar Supabase'in
yayımlanabilir (publishable) anahtarı — zaten herkese açık olacak şekilde
tasarlanmış, yetkisi RLS'e bağlı. `service_role` anahtarı hiçbir yerde
kullanılmıyor.

**Bağımlılıklar.** `npm audit --omit=dev` → 0 açık (16 Eylül 2026).

**Veritabanı denetçisi.** Supabase advisor'da güvenlik uyarısı kalmadı; tek
istisna panelden açılması gereken "Leaked Password Protection" ve bilerek
dışarı açık olan `dm_kanal_ac` (kendi içinde oturum/engel kontrolü yapıyor).


## Denetim — 16 Eylül 2026

Politika politika okundu, bulgular gerçek isteklerle (iki hesap, REST API)
kanıtlandı ve düzeltildikten sonra aynı istekle tekrar doğrulandı.

### Bulgu 1 — Engelleme tek yönlü çalışıyordu (yüksek)

`posts` ve `comments` okuma politikası `blocks` tablosuna bakıyordu; ama o alt
sorgu da `blocks`'un kendi RLS'ine takılıyordu ve orada yalnızca **kendi
eklediğin** engeller görünüyor. Sonuç: A, B'yi engellediğinde A artık B'yi
görmüyordu ama **B, A'nın gönderilerini görmeye devam ediyordu** — engelleme
korumak istediği kişiyi korumuyordu. Aynı delik özel mesajlarda da vardı.

Kanıt (düzeltmeden önce): dev, dev2'yi engelledi → dev2 hâlâ dev'in gönderisini
`GET /rest/v1/posts` ile okuyabiliyordu.

**Düzeltme:** kontrol, RLS'e takılmayan `private.engelli_mi()` işlevine taşındı.
Engellenen taraf artık ne görebiliyor, ne yorum/tepki yazabiliyor, ne de mesaj
gönderebiliyor (403). Engel kalkınca her şey normale dönüyor — ikisi de test
edildi.

### Bulgu 2 — Tepkiler ve takip listesi herkese açıktı (orta)

`reactions` ve `follows` okuma politikaları `true` idi: göremediğin bir
gönderiye gelen tepkiler ve profilini gizlemiş birinin takip ilişkileri
okunabiliyordu. Tepkiler artık yalnızca **görebildiğin içerik** üzerinde,
takipler ise kendi ilişkilerin + herkese açık profillerle sınırlı.

### Bulgu 3 — Yorum ve tepki, görünmeyen içeriğe yazılabiliyordu (orta)

Ekleme politikaları yalnızca "yazan ben miyim" diye bakıyordu; hedefin görünür
olup olmadığına bakmıyordu. Artık ikisi de hedefin okunabilir olmasını şart
koşuyor.

### Bulgu 4 — Metin alanlarının sınırı yoktu (orta)

`profiles` (ad, bio, okul, şehir, hedefler, güçlü/zayıf ders dizileri),
`exams`, `subjects`, `topics`, `concepts`, `exam_documents`: arayüzde
`maxLength` vardı ama veritabanında yoktu. İstemci kandırılabilir; biri
profiline megabaytlarca metin yazıp bunu profiline bakan herkese servis
ettirebilirdi. Hepsine arayüzle aynı sınırlar kondu (5000 karakterlik deneme
artık 400 dönüyor, normal değerler geçiyor).

### Bulgu 5 — Bazı işlemlerde kota yoktu (düşük/orta)

Gönderi, yorum ve mesajda kota vardı; **takip, tepki, şikâyet ve sınav
oluşturmada** yoktu. Eklendi: takip ve tepki 60/dakika, şikâyet 10/saat
(şikâyet bombardımanına karşı), sınav 5/saat.

### Bulgu 6 — Depolamada kişi başı dosya sayısı sınırsızdı (düşük)

Dosya başına boyut ve MIME sınırı vardı ama bir kullanıcı sınırsız sayıda
5 MB'lık dosya yükleyebilirdi (fatura şişirme). Tavan: akış 300, avatar 30,
belge 50 dosya.

### Temiz çıkanlar

- 25 tablonun tamamında RLS açık; oturum/mesaj/boşluk/an tabloları yalnızca
  kendi oturumuna bağlı (başkasının seansına yazılamıyor).
- Depolama politikaları klasör bazlı: kimse başkasının klasörüne yazamıyor,
  `exam-docs` yalnızca sahibine görünür.
- Bildirimler yalnızca tetikleyiciyle oluşuyor; kullanıcı sahte bildirim
  üretemiyor (INSERT politikası bilerek yok).
- Tüm SECURITY DEFINER işlevlerin `search_path`i sabit; tetikleyici işlevlerinin
  `EXECUTE` yetkisi `authenticated`ten alınmış durumda. Dışarı açık tek işlev
  `dm_kanal_ac` ve kendi içinde oturum/engel/hedef kontrolü yapıyor.
- E-posta sızdırma: kayıtlı bir adresle kaydolmayı denemek "bu e-posta zaten
  var" demiyor (Supabase yanıtı maskeliyor) — hesap avlanamıyor.
- CSRF yüzeyi yok: oturum çerezle değil, Authorization başlığıyla taşınıyor.

## Bilinen açık işler

- [ ] **Supabase panelinde "Leaked Password Protection"** açılmalı
      (Authentication → Policies). HaveIBeenPwned'e karşı kontrol ediyor.
      Panelden yapılması gereken bir ayar.
- [ ] **Geliştirme hesapları** (`dev@tutorla.app`, `dev2@tutorla.app`) gerçek
      kullanıcılar gelmeden silinmeli:
      `delete from auth.users where email in ('dev@tutorla.app','dev2@tutorla.app');`
- [ ] **Erken erişim formu** (`waitlist`) anonim yazmaya açık; e-posta tekil
      olduğu için tekrar eden kayıt oluşmuyor ama IP başına sınır yok.
      Gerçek trafikte Turnstile/hCaptcha gerekebilir.
- [ ] **Kendi SMTP'miz** bağlanmalı; yerleşik e-posta saatte birkaç mesajla
      sınırlı olduğu için şifre sıfırlama gerçek kullanıcıda takılabilir.
- [ ] **Şikâyet paneli yok.** Şikâyetler tabloya düşüyor ama bakacak bir ekran
      yok; şimdilik Supabase panelinden okunuyor.
- [ ] **Oturum jetonu localStorage'da.** Bir XSS deliği jetonu çalabilirdi; CSP
      bunu zorlaştırıyor ama asıl çözüm `@supabase/ssr` ile httpOnly çereze
      geçmek. Kullanıcı sayısı artmadan yapılmalı.
- [ ] **Hata izleme yok.** Sentry benzeri bir araç bağlanmadan, canlıdaki
      hatalar ancak kullanıcı söylerse öğreniliyor.
