-- Takip yerine BAĞLANTI, artı profilde kulüp/proje/yarışma gibi girdiler.
--
-- Takip tek yönlüydü: birini takip etmek onunla bir ilişki kurmuyordu. Öğrenciler
-- birbirine konu anlatacaksa ilişki karşılıklı olmalı — istek gönderiliyor, karşı
-- taraf kabul ediyor. Mesajlaşma da bu listenin üstüne oturuyor.

-- ------------------------------------------------------------------ bağlantı
create type connection_status as enum ('beklemede', 'kabul');

create table connections (
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status       connection_status not null default 'beklemede',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester_id, addressee_id),
  constraint connections_kendine_olmaz check (requester_id <> addressee_id)
);

create index connections_addressee_idx on connections (addressee_id, status);
create index connections_requester_idx on connections (requester_id, status);

alter table connections enable row level security;

-- Yalnızca iki taraf görebilir: kimin kiminle bağlantısı olduğu listelenemez.
create policy "kendi baglantilarini gorur" on connections
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy "baglanti istegi gonderir" on connections
  for insert to authenticated with check (
    requester_id = (select auth.uid())
    and status = 'beklemede'
    and not private.engelli_mi((select auth.uid()), addressee_id)
    -- ters yönde zaten bir istek/bağlantı varsa ikinci satır açılmasın
    and not exists (
      select 1 from connections c
      where c.requester_id = connections.addressee_id and c.addressee_id = (select auth.uid())
    )
  );

-- Kabul etme yalnızca isteği ALAN tarafın işi.
create policy "istegi kabul eder" on connections
  for update to authenticated
  using (addressee_id = (select auth.uid()) and status = 'beklemede')
  with check (addressee_id = (select auth.uid()) and status = 'kabul');

-- İsteği geri çekme, reddetme ve bağlantıyı kaldırma: iki taraf da yapabilir.
create policy "baglantiyi kaldirir" on connections
  for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

-- Bağlantı sayısı herkese açık bir rakam; kimlikler değil. RLS'i aşması gerektiği
-- için SECURITY DEFINER, ama yalnızca sayı döndürüyor.
create or replace function baglanti_sayisi(kisi uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from connections
  where status = 'kabul' and (requester_id = kisi or addressee_id = kisi);
$$;
revoke all on function baglanti_sayisi(uuid) from public, anon;
grant execute on function baglanti_sayisi(uuid) to authenticated;

-- Bildirim türleri
alter type notification_kind add value if not exists 'baglanti_istek';
alter type notification_kind add value if not exists 'baglanti_kabul';

-- Kota: bağlantı isteği spam'i
create or replace function kota_baglanti() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if private.son_dakika('connections', 'requester_id', new.requester_id, interval '1 hour') >= 40 then
    raise exception 'Çok fazla bağlantı isteği gönderdin, biraz bekle.';
  end if;
  return new;
end; $$;
revoke execute on function kota_baglanti() from public, anon, authenticated;
create trigger connections_kota before insert on connections
  for each row execute function kota_baglanti();

-- ------------------------------------------------------------ profil girdileri
create type entry_kind as enum ('kulup', 'proje', 'yarisma', 'gonullu', 'sertifika', 'deneyim', 'basari');

create table profile_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        entry_kind not null,
  title       text not null,
  org         text,
  description text,
  start_year  int,
  end_year    int,
  url         text,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  constraint pe_baslik  check (length(btrim(title)) between 1 and 100),
  constraint pe_kurum   check (org is null or length(btrim(org)) <= 100),
  constraint pe_aciklama check (description is null or length(description) <= 600),
  constraint pe_yil     check ((start_year is null or start_year between 1990 and 2100)
                           and (end_year is null or end_year between 1990 and 2100)
                           and (start_year is null or end_year is null or end_year >= start_year)),
  -- Adres serbest metin değil: profilde tıklanabilir bağlantı olacak.
  constraint pe_adres   check (url is null or url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(/[^\s]*)?$')
);

create index profile_entries_user_idx on profile_entries (user_id, position, created_at);

alter table profile_entries enable row level security;

-- Görünürlük profilin görünürlüğüne bağlı (gizli profil + engel kuralı dahil).
create policy "girdiler gorunur profilde okunur" on profile_entries
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      exists (select 1 from profiles p where p.id = profile_entries.user_id)
      and not private.engelli_mi((select auth.uid()), user_id)
    )
  );

create policy "kendi girdisini ekler" on profile_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "kendi girdisini gunceller" on profile_entries
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "kendi girdisini siler" on profile_entries
  for delete to authenticated using (user_id = (select auth.uid()));

create or replace function kota_girdi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from profile_entries where user_id = new.user_id) >= 50 then
    raise exception 'Profiline en fazla 50 girdi ekleyebilirsin.';
  end if;
  return new;
end; $$;
revoke execute on function kota_girdi() from public, anon, authenticated;
create trigger profile_entries_kota before insert on profile_entries
  for each row execute function kota_girdi();

-- ------------------------------------------------------------------- takip son
-- Takip kaldırılıyor: ilişki artık karşılıklı.
drop trigger if exists follows_notify on follows;
drop trigger if exists follows_kota on follows;
drop function if exists notify_on_follow();
drop function if exists kota_takip();
drop table if exists follows;
