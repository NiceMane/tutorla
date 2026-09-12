-- Öğretme davranışı anları.
-- Konuşma örüntüsünden davranış sinyali çıkarıp KANITIYLA göster.
-- Bizde roller ters olduğu için ölçülen şey "soruyu nasıl çözdü" değil, "nasıl öğretti".
-- Her an bir mesaja asılıdır — kanıt o mesajın kendisi.

create type moment_kind as enum (
  'persistence',  -- boşluk çıktıktan sonra pes etmeyip yeniden anlattı
  'causal',       -- "neden"i açıkladı, sadece "ne"yi değil
  'concrete',     -- örnek verdi
  'simplify',     -- anlaşılmayınca sadeleştirerek yeniden anlattı
  'curiosity'     -- sorulmadan bir sonraki kavrama geçti
);

create table moments (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  message_id  uuid references messages(id) on delete cascade,
  concept_id  uuid references concepts(id) on delete set null,
  kind        moment_kind not null,
  label       text not null,
  created_at  timestamptz not null default now()
);

create index on moments (session_id);
create index on moments (kind);

alter table moments enable row level security;

create policy "kendi anlarini gorur" on moments
  for select to authenticated using (
    exists (select 1 from sessions s where s.id = moments.session_id and s.user_id = (select auth.uid()))
  );
create policy "kendi oturumuna an yazar" on moments
  for insert to authenticated with check (
    exists (select 1 from sessions s where s.id = moments.session_id and s.user_id = (select auth.uid()))
  );

-- Birikmiş davranış kanıtı: kullanıcı × tür.
create view teaching_profile
with (security_invoker = true) as
select
  s.user_id,
  m.kind,
  count(*)::int     as total,
  max(m.created_at) as last_at
from moments m
join sessions s on s.id = m.session_id
group by s.user_id, m.kind;
