-- GEÇİCİ — migration DEĞİL, bilerek migrations/ dışında.
--
-- Geliştirme sırasında elle kullanabileceğiniz bir hesap. Giriş ekranı (/giris)
-- yazıldıktan sonra bu artık "otomatik giriş" değil — sadece normal bir hesap,
-- giriş formuna yazarak kullanılıyor. İhtiyaç kalmayınca silinebilir:
--   delete from auth.users where email = 'dev@tutorla.app';
--
-- Daha temiz alternatif: Supabase panelinde
--   Authentication → Sign In / Providers → Anonymous sign-ins
-- açılırsa her cihaz kendi hesabını alır ve bu dosyaya gerek kalmaz.
--
-- ŞİFRE BURADA DEĞİL: DEGISTIR_BENI yerine kendi şifreni yaz.
-- Şifre depoya yazılmıyor; giriş formuna elle girilir.
--
-- Not: bu yol auth.users'a doğrudan yazdığı için e-posta onayını atlar.
-- Normal kullanıcılar /giris üzerinden kaydolur ve doğrulama e-postası alır.

do $$
declare uid uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = 'dev@tutorla.app') then return; end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
    -- GoTrue bu sütunları Go string'ine okur; NULL kalırsa girişte
    -- "Database error querying schema" hatası verir.
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change,
    phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'dev@tutorla.app', crypt('DEGISTIR_BENI', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Geliştirme kullanıcısı"}'::jsonb,
    false, false,
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    uid::text, uid,
    jsonb_build_object('sub', uid::text, 'email', 'dev@tutorla.app', 'email_verified', true),
    'email', now(), now(), now()
  );
end $$;

-- İKİNCİ HESAP (isteğe bağlı): mesajlaşmayı tek başına denemek için iki taraf
-- gerekiyor. Aynı kalıp, farklı e-posta. Yayına çıkmadan ikisini de silin:
--   delete from auth.users where email in ('dev@tutorla.app', 'dev2@tutorla.app');
do $$
declare uid uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = 'dev2@tutorla.app') then return; end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change,
    phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'dev2@tutorla.app', crypt('DEGISTIR_BENI', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Öğrencisi"}'::jsonb,
    false, false,
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    uid::text, uid,
    jsonb_build_object('sub', uid::text, 'email', 'dev2@tutorla.app', 'email_verified', true),
    'email', now(), now(), now()
  );

  update public.profiles
     set display_name = 'Test Öğrencisi', handle = 'test_ogrenci',
         onboarded_at = now(), is_public = true, avatar_emoji = '🦊'
   where id = uid;
end $$;
