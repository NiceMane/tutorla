# Kimlik doğrulama e-postaları

Supabase'in varsayılan şablonları düz, markasız ve İngilizce ("Follow this link to
confirm your user"). Buradaki altı dosya onların yerine geçiyor: Tutorla logosu,
`Mesai` paleti, Türkçe metin ve altında İngilizce karşılığı.

| Dosya | Panel alanı | Konu satırı |
|---|---|---|
| `confirmation.html` | Confirm signup | Tutorla hesabını doğrula |
| `invite.html` | Invite user | Tutorla'ya davet edildin |
| `magic-link.html` | Magic Link | Tutorla giriş bağlantın |
| `email-change.html` | Change Email Address | Tutorla e-posta adresi değişikliğini onayla |
| `recovery.html` | Reset Password | Tutorla şifreni sıfırla |
| `reauthentication.html` | Reauthentication | Tutorla doğrulama kodun |

## Nasıl uygulanır

**Tek komutla** (kişisel erişim jetonu gerekir —
[dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)):

```bash
SUPABASE_ACCESS_TOKEN=sbp_... node supabase/emails/uygula.mjs
```

**Elle:** Supabase paneli → Authentication → Emails → ilgili sekme → "Source"
görünümüne geç, dosyanın tamamını yapıştır, konu satırını da yukarıdaki tablodan gir.

## Tasarım kararları

- **Tablo yerleşimi ve satır içi stiller.** E-posta istemcilerinin çoğu `<style>`
  bloğunu atar; buradaki her kural satır içinde de yazılı. `<style>` yalnızca
  koyu mod ve dar ekran için ek.
- **Web fontu yok.** Gmail `@font-face`i siler. Figtree yerine sistem yazı tipi
  yığını kullanılıyor; üst etiket (`hoş geldin`, `giriş`…) Newsreader'ın yedeği
  olan Georgia italik ile yazılıyor — markanın serif dokusu böylece korunuyor.
- **Logo PNG olarak.** `web/public/brand/tutorla-email.png` → yayındaki adres
  üzerinden çekiliyor. Görseller engellenirse `alt="tutorla_"` okunur kalıyor.
  Koyu mod için ikinci bir dosya var; destekleyen istemcilerde o gösteriliyor.
- **Outlook düğmesi.** Outlook masaüstü `border-radius` ve `padding`i yok sayar;
  bu yüzden düğmenin VML karşılığı da gömülü.
- **Önizleme satırı.** Gelen kutusunda konunun yanında görünen gizli metin —
  boş bırakılırsa istemci gövdenin ilk satırını çeker, bu da genelde çirkin olur.
- **Güvenlik cümlesi her şablonda var:** ne kadar geçerli, kaç kez kullanılabilir,
  istemediysen ne yapmalısın.
- **Alan adı değişirse** (`tutorla.com` alınırsa) logonun adresi de değişmeli;
  `uygula.mjs` yeniden çalıştırılırsa yeterli.

## Uyarı: kendi SMTP'n gerekli

Supabase'in yerleşik e-posta servisi **saatte birkaç mesajla** sınırlı ve yalnızca
proje üyelerine gönderim yapar. Gerçek kullanıcılara e-posta gidebilmesi için
Authentication → Emails → SMTP Settings altında kendi sağlayıcın (Resend, Postmark,
Amazon SES…) tanımlanmalı. Şablonlar SMTP'den bağımsız, şimdiden uygulanabilir.
