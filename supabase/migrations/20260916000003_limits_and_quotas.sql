-- Denetimde çıkan üç boşluk: uzunluk sınırları, kota eksikleri, depolama tavanı.
--
-- 1) UZUNLUK: arayüzde maxLength vardı ama API'de yoktu. İstemci kandırılabilir;
--    biri profiline 10 MB metin yazıp bunu profiline bakan herkese servis
--    ettirebilirdi. Kendi sınavını ekleyen kullanıcı için de aynısı geçerliydi.
-- 2) KOTA: gönderi/yorum/mesaj kotası vardı ama takip, tepki, şikâyet ve sınav
--    oluşturma serbestti (takip spam'i, şikâyet bombardımanı).
-- 3) DEPOLAMA: dosya başına boyut sınırı vardı, kişi başına dosya SAYISI yoktu.

-- ----------------------------------------------------------------- yardımcılar
create or replace function private.dizi_gecerli(a text[], azami int, eleman int)
returns boolean language sql immutable as $$
  select a is null
     or (coalesce(array_length(a, 1), 0) <= azami
         and coalesce((select max(length(x)) from unnest(a) x), 0) <= eleman);
$$;
revoke all on function private.dizi_gecerli(text[], int, int) from public;
grant execute on function private.dizi_gecerli(text[], int, int) to authenticated;

create or replace function private.dosya_sayisi(kova text, sahip uuid)
returns bigint language sql stable security definer set search_path = storage as $$
  select count(*) from storage.objects where bucket_id = kova and owner = sahip;
$$;
revoke all on function private.dosya_sayisi(text, uuid) from public;
grant execute on function private.dosya_sayisi(text, uuid) to authenticated;

-- Kota tetikleyicileri için ortak sayaç
create or replace function private.son_dakika(tablo regclass, sutun text, kisi uuid, aralik interval)
returns bigint language plpgsql stable security definer set search_path = public as $$
declare n bigint;
begin
  execute format('select count(*) from %s where %I = $1 and created_at > now() - $2', tablo, sutun)
    into n using kisi, aralik;
  return n;
end;
$$;
revoke all on function private.son_dakika(regclass, text, uuid, interval) from public;
grant execute on function private.son_dakika(regclass, text, uuid, interval) to authenticated;

-- --------------------------------------------------------------- uzunluklar
alter table profiles
  add constraint profiles_ad_uzunluk       check (display_name is null or length(display_name) <= 60),
  add constraint profiles_bio_uzunluk      check (bio is null or length(bio) <= 200),
  add constraint profiles_emoji_uzunluk    check (avatar_emoji is null or length(avatar_emoji) <= 16),
  add constraint profiles_okul_uzunluk     check (school is null or length(school) <= 80),
  add constraint profiles_sehir_uzunluk    check (city is null or length(city) <= 40),
  add constraint profiles_uni_uzunluk      check (target_university is null or length(target_university) <= 80),
  add constraint profiles_bolum_uzunluk    check (target_department is null or length(target_department) <= 80),
  add constraint profiles_hedef_uzunluk    check (goals is null or length(goals) <= 400),
  add constraint profiles_guclu_gecerli    check (private.dizi_gecerli(strong_subjects, 30, 40)),
  add constraint profiles_zayif_gecerli    check (private.dizi_gecerli(weak_subjects, 30, 40));

alter table exams
  add constraint exams_kod_uzunluk  check (length(btrim(code)) between 2 and 12),
  add constraint exams_ad_uzunluk   check (length(btrim(name)) between 1 and 60),
  add constraint exams_aciklama_uzunluk check (description is null or length(description) <= 160);

alter table subjects
  add constraint subjects_ad_uzunluk   check (length(btrim(name)) between 1 and 60),
  add constraint subjects_slug_uzunluk check (length(slug) between 1 and 80);

alter table topics
  add constraint topics_ad_uzunluk   check (length(btrim(name)) between 1 and 80),
  add constraint topics_slug_uzunluk check (length(slug) between 1 and 100);

alter table concepts
  add constraint concepts_ad_uzunluk   check (length(btrim(name)) between 1 and 80),
  add constraint concepts_slug_uzunluk check (length(slug) between 1 and 100);

alter table exam_documents
  add constraint exam_documents_baslik_uzunluk check (length(btrim(title)) <= 120),
  add constraint exam_documents_not_uzunluk    check (notes is null or length(notes) <= 4000);

-- ------------------------------------------------------------------- kotalar
create or replace function kota_takip() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if private.son_dakika('follows', 'follower_id', new.follower_id, interval '1 minute') >= 60 then
    raise exception 'Çok hızlı takip ediyorsun, biraz bekle.';
  end if;
  return new;
end; $$;
revoke execute on function kota_takip() from public, anon, authenticated;
create trigger follows_kota before insert on follows for each row execute function kota_takip();

create or replace function kota_tepki() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if private.son_dakika('reactions', 'user_id', new.user_id, interval '1 minute') >= 60 then
    raise exception 'Çok hızlı tepki veriyorsun, biraz bekle.';
  end if;
  return new;
end; $$;
revoke execute on function kota_tepki() from public, anon, authenticated;
create trigger reactions_kota before insert on reactions for each row execute function kota_tepki();

create or replace function kota_sikayet() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Şikâyet bombardımanı: saatte 10 yeterince cömert.
  if private.son_dakika('reports', 'reporter_id', new.reporter_id, interval '1 hour') >= 10 then
    raise exception 'Çok fazla şikâyet gönderdin, biraz bekle.';
  end if;
  return new;
end; $$;
revoke execute on function kota_sikayet() from public, anon, authenticated;
create trigger reports_kota before insert on reports for each row execute function kota_sikayet();

create or replace function kota_sinav() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null
     and private.son_dakika('exams', 'created_by', new.created_by, interval '1 hour') >= 5 then
    raise exception 'Saatte en fazla 5 sınav ekleyebilirsin.';
  end if;
  return new;
end; $$;
revoke execute on function kota_sinav() from public, anon, authenticated;
create trigger exams_kota before insert on exams for each row execute function kota_sinav();

-- --------------------------------------------------------- depolama tavanı
drop policy if exists "avatar kendi klasoru yazar" on storage.objects;
create policy "avatar kendi klasoru yazar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.dosya_sayisi('avatars', (select auth.uid())) < 30
  );

drop policy if exists "feed kendi klasorune yazar" on storage.objects;
create policy "feed kendi klasorune yazar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'feed'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.dosya_sayisi('feed', (select auth.uid())) < 300
  );

drop policy if exists "belge yukler" on storage.objects;
create policy "belge yukler" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'exam-docs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.dosya_sayisi('exam-docs', (select auth.uid())) < 50
  );
