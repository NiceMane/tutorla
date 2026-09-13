-- Takip, yer imi, engelleme, şikâyet, bildirim ve kota sınırları.
-- Bildirimler ve kotalar tetikleyicilerle üretiliyor: istemciye güvenmiyoruz.

create table follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_kendini_takip check (follower_id <> following_id)
);
create index on follows (following_id);
alter table follows enable row level security;
create policy "takipler okunabilir" on follows for select to authenticated using (true);
create policy "kendi takibini ekler" on follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "kendi takibini birakir" on follows for delete to authenticated using ((select auth.uid()) = follower_id);

create table bookmarks (
  user_id    uuid not null references profiles(id) on delete cascade,
  post_id    uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table bookmarks enable row level security;
create policy "kendi yer imlerini gorur" on bookmarks for select to authenticated using ((select auth.uid()) = user_id);
create policy "kendi yer imini ekler" on bookmarks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "kendi yer imini siler" on bookmarks for delete to authenticated using ((select auth.uid()) = user_id);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_kendini_engelleme check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on blocks (blocked_id);
alter table blocks enable row level security;
create policy "kendi engellerini gorur" on blocks for select to authenticated using ((select auth.uid()) = blocker_id);
create policy "kendi engelini ekler" on blocks for insert to authenticated with check ((select auth.uid()) = blocker_id);
create policy "kendi engelini kaldirir" on blocks for delete to authenticated using ((select auth.uid()) = blocker_id);

create type report_reason as enum ('spam', 'taciz', 'uygunsuz', 'yanlis_bilgi', 'diger');
create type report_status as enum ('acik', 'incelendi', 'kapandi');
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  reason report_reason not null,
  note text,
  status report_status not null default 'acik',
  created_at timestamptz not null default now(),
  constraint reports_tek_hedef check (num_nonnulls(post_id, comment_id, profile_id) = 1)
);
create index on reports (status, created_at desc);
alter table reports enable row level security;
create policy "kendi sikayetini gorur" on reports for select to authenticated using ((select auth.uid()) = reporter_id);
create policy "sikayet acar" on reports for insert to authenticated with check ((select auth.uid()) = reporter_id);

create type notification_kind as enum ('yorum', 'yanit', 'tepki', 'takip');
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid not null references profiles(id) on delete cascade,
  kind notification_kind not null,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_kendine_bildirim check (user_id <> actor_id)
);
create index on notifications (user_id, created_at desc);
create index on notifications (user_id, read_at);
alter table notifications enable row level security;
create policy "kendi bildirimlerini gorur" on notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "kendi bildirimini okur" on notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Gönderi düzenleme izi
alter table posts add column if not exists edited_at timestamptz;
create policy "kendi gonderisini duzenler" on posts for update to authenticated
  using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);

-- Engellenenlerin içeriği akıştan düşsün. Kontrol politikanın içinde:
-- yardımcı fonksiyon SECURITY DEFINER olduğu için PostgREST /rpc/ altında yayınlanıyordu.
drop policy if exists "akis okunabilir" on posts;
create policy "akis okunabilir" on posts for select to authenticated using (
  not exists (select 1 from blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = posts.author_id)
       or (b.blocker_id = posts.author_id and b.blocked_id = (select auth.uid())))
);
drop policy if exists "akis okunabilir" on comments;
create policy "akis okunabilir" on comments for select to authenticated using (
  not exists (select 1 from blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = comments.author_id)
       or (b.blocker_id = comments.author_id and b.blocked_id = (select auth.uid())))
);
