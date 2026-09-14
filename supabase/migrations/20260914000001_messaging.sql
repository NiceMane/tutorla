-- Öğrenciler arası birebir mesajlaşma.
-- Akış herkese açık; burası iki kişi arasında kalan bir kanal.

create table dm_threads (
  id              uuid primary key default gen_random_uuid(),
  -- İki kişi için tek kanal: küçük id + büyük id. Aynı çift için ikinci
  -- kanal açılmasını veritabanı engelliyor.
  pair_key        text not null unique,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table dm_members (
  thread_id    uuid not null references dm_threads(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index dm_members_user_idx on dm_members (user_id);

create table dm_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references dm_threads(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  constraint dm_body_uzunluk check (length(btrim(body)) between 1 and 2000)
);

create index dm_messages_thread_idx on dm_messages (thread_id, created_at desc);
create index dm_messages_sender_idx on dm_messages (sender_id);

alter table dm_threads  enable row level security;
alter table dm_members  enable row level security;
alter table dm_messages enable row level security;

-- Politikaların içinden dm_members'ı doğrudan sorgulamak sonsuz özyineleme
-- yaratıyor (politika kendi tablosunu okuyor). SECURITY DEFINER sarmalayıcı
-- bunu kesiyor; işlev yalnızca "ben bu kanalın üyesi miyim" sorusuna yanıt
-- verdiği için dışarı bilgi sızdırmıyor.
create function dm_uyesi(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dm_members m where m.thread_id = t and m.user_id = (select auth.uid())
  );
$$;

create policy "kanalini gorur" on dm_threads
  for select to authenticated using (dm_uyesi(id));

create policy "uyeleri gorur" on dm_members
  for select to authenticated using (dm_uyesi(thread_id));

create policy "kendi okundu bilgisini gunceller" on dm_members
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "mesajlari gorur" on dm_messages
  for select to authenticated using (dm_uyesi(thread_id));

create policy "mesaj yazar" on dm_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and dm_uyesi(thread_id)
    -- Engel varsa yazamaz; engelleme tek yönlü de olsa kanal kapanır.
    and not exists (
      select 1 from blocks b
      join dm_members m on m.thread_id = dm_messages.thread_id and m.user_id <> (select auth.uid())
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = m.user_id)
         or (b.blocker_id = m.user_id and b.blocked_id = (select auth.uid()))
    )
  );

create policy "kendi mesajini siler" on dm_messages
  for delete to authenticated using (sender_id = (select auth.uid()));

-- Kanal açmak iki tabloya birden yazmayı gerektiriyor (kanal + iki üyelik);
-- bunu istemciye açmak yerine tek bir işleve veriyoruz. İşlev karşı tarafın
-- profilini ve engel durumunu da kontrol ediyor.
create function dm_kanal_ac(hedef uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := (select auth.uid());
  anahtar text;
  kanal uuid;
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if hedef = ben then raise exception 'kendine mesaj gonderilemez'; end if;
  if not exists (select 1 from profiles p where p.id = hedef) then
    raise exception 'kullanici bulunamadi';
  end if;
  if exists (
    select 1 from blocks b
    where (b.blocker_id = ben and b.blocked_id = hedef)
       or (b.blocker_id = hedef and b.blocked_id = ben)
  ) then
    raise exception 'engel var';
  end if;

  anahtar := least(ben::text, hedef::text) || ':' || greatest(ben::text, hedef::text);

  select id into kanal from dm_threads where pair_key = anahtar;
  if kanal is null then
    insert into dm_threads (pair_key) values (anahtar)
    on conflict (pair_key) do update set pair_key = excluded.pair_key
    returning id into kanal;
    insert into dm_members (thread_id, user_id) values (kanal, ben), (kanal, hedef)
    on conflict do nothing;
  end if;
  return kanal;
end;
$$;

-- Yeni mesaj kanalı öne taşısın + kota
create function dm_mesaj_sonrasi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*) from dm_messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'Çok hızlı mesaj gönderiyorsun, biraz bekle.';
  end if;

  update dm_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;

create trigger dm_messages_sonrasi
  before insert on dm_messages
  for each row execute function dm_mesaj_sonrasi();

-- Anlık güncelleme: açık sohbette yeni mesaj beklemeden görünsün.
alter publication supabase_realtime add table dm_messages;
