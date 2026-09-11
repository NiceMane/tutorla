-- Tutorla · çekirdek şema
-- Roller ters: "student" = yapay zekâ (öğrenen), "teacher" = kullanıcı (anlatan).
-- Tanımlayıcılar İngilizce (web/src ile tutarlı), kullanıcıya görünen metinler Türkçe (seed.sql).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- müfredat
-- Bu dört tablo paylaşılan, salt-okunur müfredat ağacı:
-- exam → subject → topic → concept. Kavramlar "anlayış haritası"nın satırları.

create table exams (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- 'YKS'
  name        text not null,
  position    int  not null default 0,
  active      boolean not null default true
);

create table subjects (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references exams(id) on delete cascade,
  slug        text not null,                 -- 'matematik'
  name        text not null,
  position    int  not null default 0,
  unique (exam_id, slug)
);

create table topics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references subjects(id) on delete cascade,
  slug        text not null,                 -- 'zincir-kurali'
  name        text not null,
  position    int  not null default 0,
  unique (subject_id, slug)
);

-- Bir konunun alt kavramları. Konu yüzdesi bunlardan türetilir; ayrıca sayaç tutulmaz.
create table concepts (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  slug        text not null,
  name        text not null,
  position    int  not null default 0,
  unique (topic_id, slug)
);

create table personas (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- 'curious' | 'sceptical' | 'impatient'
  name        text not null,
  trait       text not null,
  active      boolean not null default true,
  position    int  not null default 0
);

-- ------------------------------------------------------------- kullanıcı
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  exam_id     uuid references exams(id) on delete set null,
  onboarded_at timestamptz,
  created_at  timestamptz not null default now()
);

create type session_status as enum ('active', 'finished', 'abandoned');

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic_id    uuid not null references topics(id) on delete restrict,
  persona_id  uuid not null references personas(id) on delete restrict,
  status      session_status not null default 'active',
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  -- seans notu: oturum bitince yazılan davranışsal geri bildirim
  note        text
);

create index on sessions (user_id, started_at desc);
create index on sessions (user_id, topic_id);

-- 'student' = yapay zekâ öğrenci, 'teacher' = anlatan kullanıcı
create type message_role as enum ('student', 'teacher');

create table messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  role        message_role not null,
  content     text not null,
  position    int not null,
  created_at  timestamptz not null default now(),
  unique (session_id, position)
);

create index on messages (session_id, position);

-- Ürünün en ayırt edici mekanizması: AI cevap vermez, eksiği görünür kılar.
-- Bir boşluk her zaman bir mesaja asılıdır; hangi kavramla ilgili olduğu bilinmiyorsa concept_id null.
create table gaps (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  message_id  uuid references messages(id) on delete cascade,
  concept_id  uuid references concepts(id) on delete set null,
  label       text not null,                 -- "boşluk: çarpımın nedeni açıklanmadı"
  created_at  timestamptz not null default now()
);

create index on gaps (session_id);

create type concept_status as enum ('untouched', 'gap', 'settled');

-- Kullanıcı × kavram. Anlayış haritasının tek gerçek kaynağı.
create table concept_states (
  user_id     uuid not null references auth.users(id) on delete cascade,
  concept_id  uuid not null references concepts(id) on delete cascade,
  status      concept_status not null default 'untouched',
  session_id  uuid references sessions(id) on delete set null,  -- son değiştiren oturum
  updated_at  timestamptz not null default now(),
  primary key (user_id, concept_id)
);

create index on concept_states (user_id, status);

-- --------------------------------------------------- türetilmiş ilerleme
-- Sol paneldeki konu listesi + yüzdeler. Denormalize sayaç yok, sayaç kayması da yok.
-- total, kullanıcının dokunduğu kavramları değil KONUNUN TÜM kavramlarını sayar.
-- Aksi halde 5 kavramlık konuda 2'sine dokunup ikisini oturtan öğrenci %100 görürdü.
create view topic_progress
with (security_invoker = true) as
select
  cs.user_id,
  t.id           as topic_id,
  t.subject_id,
  count(*) filter (where cs.status = 'settled')::int   as settled,
  count(*) filter (where cs.status = 'gap')::int       as gaps,
  tc.total,
  round(count(*) filter (where cs.status = 'settled')::numeric
        / nullif(tc.total, 0) * 100)::int              as percent
from concept_states cs
join concepts c on c.id = cs.concept_id
join topics   t on t.id = c.topic_id
join lateral (select count(*)::int as total from concepts c2 where c2.topic_id = t.id) tc on true
group by cs.user_id, t.id, t.subject_id, tc.total;

-- ------------------------------------------------------------ tetikleyici
-- Yeni kullanıcı kaydolunca profil satırı açılır.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function touch_concept_state() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger concept_states_touch
  before update on concept_states
  for each row execute function touch_concept_state();
