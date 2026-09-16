-- Medya adresleri artık serbest metin değil.
--
-- Neden: akıştaki görseller next/image ile çiziliyor ve tanınmayan bir alan adı
-- gördüğünde render sırasında hata fırlatıyor — yani kötü niyetli tek bir
-- gönderi, onu gören herkesin sayfasını hata ekranına düşürebilirdi. Ayrıca
-- dışarıdan bir adres, gönderiyi açan herkesin IP'sini o sunucuya taşır.
--
-- İzin verilenler: kendi depolama alanımız, Giphy ve Tenor. Liste
-- next.config.ts'teki remotePatterns ile aynı olmak zorunda.

create or replace function medya_adresi_gecerli(u text) returns boolean
language sql immutable as $$
  select u ~ '^https://bupgkfzkuanzysdpteiy\.supabase\.co/storage/v1/object/(public|sign)/[A-Za-z0-9._~/%?&=+-]+$'
      or u ~ '^https://[A-Za-z0-9-]+\.giphy\.com/[A-Za-z0-9._~/%?&=+-]*$'
      or u ~ '^https://[A-Za-z0-9-]+\.tenor\.com/[A-Za-z0-9._~/%?&=+-]*$';
$$;

alter table post_media add constraint post_media_url_gecerli
  check (medya_adresi_gecerli(url));

alter table comments add constraint comments_gif_url_gecerli
  check (gif_url is null or medya_adresi_gecerli(gif_url));

-- Profil fotoğrafı da aynı kapıdan geçsin (yalnızca kendi depomuz).
alter table profiles add constraint profiles_avatar_url_gecerli
  check (
    avatar_url is null
    or avatar_url ~ '^https://bupgkfzkuanzysdpteiy\.supabase\.co/storage/v1/object/public/avatars/[A-Za-z0-9._~/%-]+$'
  );

-- Denetçi notu: işlevin search_path'i sabitlenmeli (rol değiştirerek başka bir
-- şemayı öne almak mümkün olmasın). Gövde yalnızca düzenli ifade kullanıyor.
alter function medya_adresi_gecerli(text) set search_path = '';
