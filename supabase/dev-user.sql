-- GEÇİCİ — migration DEĞİL, bilerek migrations/ dışında.
--
-- Auth ekranları (e-posta + Google) henüz yazılmadı, ama RLS gerçek bir auth.uid()
-- istiyor. Uygulamanın güvenliği gevşetmeden çalışabilmesi için tek bir geliştirme
-- hesabı açıyoruz. Auth geldiğinde bu kullanıcı silinecek:
--   delete from auth.users where email = 'dev@tutorla.app';
--
-- Daha temiz alternatif: Supabase panelinde
--   Authentication → Sign In / Providers → Anonymous sign-ins
-- açılırsa her cihaz kendi hesabını alır ve bu dosyaya gerek kalmaz.
--
-- ŞİFRE BURADA DEĞİL. Aşağıdaki DEGISTIR_BENI yerine kendi şifreni yaz ve
-- aynısını web/.env.local içindeki NEXT_PUBLIC_DEV_PASSWORD'a koy.
-- (Şifreyi depoya yazmıyoruz; .env.local zaten git dışında.)

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
