# Favicon ve uygulama ikonu

Yumuşatılmış kare içinde logonun **`t`** harfi ve sondaki **`_`** alt tiresi, ikisi aynı renkte.
Marka dosyasındaki atölyenin (`brand/marka-dosyasi.html`) `Mesai · nanami` yönü, dört renk şeması.

## Dosyalar

| Dosya | Şema | Zemin | Harf | Kontrast |
|---|---|---|---|---|
| `favicon.svg` | orman zemin | `#333F26` | `#EAE6D3` | 8.91:1 |
| `favicon-blue.svg` | derin mavi zemin | `#1F6E85` | `#F8F5EC` | 5.31:1 |
| `favicon-sand.svg` | kum zemin | `#E3DECB` | `#333F26` | 8.29:1 |
| `favicon-lightblue.svg` | gömlek mavisi | `#4E9BB5` | `#16303A` | 4.40:1 |
| `icon-maskable.svg` | orman, yarıçapsız | `#333F26` | `#EAE6D3` | 8.91:1 |

Ana ikon `favicon.svg`. Başka bir şemayı ana yapmak için dosyaları yeniden adlandırmak yeterli.
`favicon-lightblue.svg` 4.40:1 ile en düşük kontrastlı olan — küçük boyutta en zayıf okunan da o.

## Ölçüler

Atölyedeki ayarlarla birebir:

- **Köşe yarıçapı** %24 — 100 birimlik karede `rx="24"`
- **İç boşluk** %18
- **`t` ↔ `_` aralığı** 8 birim, üstüne logonun `-0.045em` letter-spacing'i
- Alt tire taban çizgisine kaldırılmış (13.14 birim), harflerle aynı düzlemde
- Mürekkep kutusu kare içinde optik olarak ortalanmış

`icon-maskable.svg` bunun dışında: yarıçapı yok ve iç boşluğu %24. Sebebi, Android'in maskeyi
merkezdeki %80'lik daireyle uygulaması — %18 boşlukta mürekkep kutusunun köşesi merkeze 40.6 birim
uzaklıkta kalıyor, güvenli yarıçap 40, yani dairesel maskede alt tirenin ucu kırpılabilir.
%24 boşlukta bu değer 33'e iniyor.

## Font bağımlılığı yok

Harfler Figtree ExtraBold (wght 800) glifleridir, **outline'a çevrilmiş path olarak** gömülüdür.
Atölyenin ürettiği `<text>` tabanlı SVG'yi doğrudan favicon yapmayın — Figtree'si olmayan cihazda bozulur.

Yeniden üretmek gerekirse kaynak `~/Library/Fonts/Figtree[wght].ttf`, wght=800'de sabitlenip
`t` (U+0074) ve `_` (U+005F) glifleri path'e çevrilir.

## Bilinen sınır

16 px'te alt tire ~1.6 piksele düşer ve tarayıcı onu yarı saydam çizer. Sekmede alt tirenin net
kalması isteniyorsa iç boşluğu %12'ye çeken ayrı bir küçük boy varyantı veya elde ayarlanmış
16/32 px bitmap taşıyan bir `.ico` gerekir.
