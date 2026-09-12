-- ---------------------------------------------------------------- akış
create type media_kind as enum ('image', 'gif');

create table posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0 and length(body) <= 2000),
  exam_id    uuid references exams(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on posts (created_at desc);
create index on posts (author_id);

create table post_media (
  id       uuid primary key default gen_random_uuid(),
  post_id  uuid not null references posts(id) on delete cascade,
  url      text not null,
  kind     media_kind not null,
  position int not null default 0
);
create index on post_media (post_id);

-- Yorumlar kendine referans veriyor: parent_id dolu ise bir yoruma yanıt.
create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  parent_id  uuid references comments(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0 and length(body) <= 1000),
  gif_url    text,
  created_at timestamptz not null default now()
);
create index on comments (post_id, created_at);
create index on comments (parent_id);

-- Tepkiler: bir kullanıcı aynı hedefe aynı emojiyi bir kez verir.
create table reactions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  post_id     uuid references posts(id) on delete cascade,
  comment_id  uuid references comments(id) on delete cascade,
  emoji       text not null check (length(emoji) between 1 and 16),
  created_at  timestamptz not null default now(),
  constraint reactions_tek_hedef check (num_nonnulls(post_id, comment_id) = 1)
);
create unique index reactions_post_uniq    on reactions (user_id, post_id, emoji)    where post_id is not null;
create unique index reactions_comment_uniq on reactions (user_id, comment_id, emoji) where comment_id is not null;
create index on reactions (post_id);
create index on reactions (comment_id);

alter table posts      enable row level security;
alter table post_media enable row level security;
alter table comments   enable row level security;
alter table reactions  enable row level security;

-- Akış paylaşımlı alan: giriş yapmış herkes okur, herkes kendi adına yazar.
create policy "akis okunabilir" on posts      for select to authenticated using (true);
create policy "akis okunabilir" on post_media for select to authenticated using (true);
create policy "akis okunabilir" on comments   for select to authenticated using (true);
create policy "akis okunabilir" on reactions  for select to authenticated using (true);

create policy "kendi gonderisini yazar" on posts
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "kendi gonderisini siler" on posts
  for delete to authenticated using ((select auth.uid()) = author_id);

create policy "kendi gonderisine medya" on post_media
  for insert to authenticated with check (
    exists (select 1 from posts p where p.id = post_media.post_id and p.author_id = (select auth.uid()))
  );

create policy "kendi yorumunu yazar" on comments
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "kendi yorumunu siler" on comments
  for delete to authenticated using ((select auth.uid()) = author_id);

create policy "kendi tepkisini verir" on reactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "kendi tepkisini geri alir" on reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ------------------------------------------- öğrencinin yüklediği müfredat
create table exam_documents (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references exams(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  title       text not null check (length(btrim(title)) > 0),
  notes       text,
  file_url    text,
  created_at  timestamptz not null default now()
);
create index on exam_documents (exam_id);

comment on table exam_documents is
  'Öğrencinin kendi eklediği sınav için yüklediği müfredat bilgisi. Yapay zekâ bağlanana kadar SAKLANIYOR ama İŞLENMİYOR.';

alter table exam_documents enable row level security;

create policy "kendi belgelerini gorur" on exam_documents
  for select to authenticated using ((select auth.uid()) = uploaded_by);
create policy "kendi belgesini yukler" on exam_documents
  for insert to authenticated with check ((select auth.uid()) = uploaded_by);
create policy "kendi belgesini siler" on exam_documents
  for delete to authenticated using ((select auth.uid()) = uploaded_by);
