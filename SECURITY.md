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
