-- ENGELLEME TEK YÖNLÜ ÇALIŞIYORDU (kanıtlandı).
--
-- posts/comments okuma politikası "blocks" tablosuna bakıyordu; ama o sorgu da
-- blocks'un kendi RLS'ine takılıyor ve orada yalnızca KENDİ eklediğin engeller
-- görünüyor. Sonuç: A, B'yi engellediğinde A artık B'yi görmüyordu ama B, A'nın
-- gönderilerini görmeye devam ediyordu — yani engelleme, asıl koruması gereken
-- kişiyi korumuyordu.
--
-- Çözüm: kontrolü RLS'e takılmayan bir SECURITY DEFINER işleve taşımak. İşlev
-- API'ye açılmayan `private` şemasında; yalnızca "bu iki kişi arasında engel var
-- mı" sorusuna evet/hayır diyor.

create or replace function private.engelli_mi(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

revoke all on function private.engelli_mi(uuid, uuid) from public;
grant execute on function private.engelli_mi(uuid, uuid) to authenticated;

-- Gönderiler ve yorumlar: iki yönlü engel
drop policy if exists "akis okunabilir" on posts;
create policy "akis okunabilir" on posts
  for select to authenticated
  using (not private.engelli_mi((select auth.uid()), author_id));

drop policy if exists "akis okunabilir" on comments;
create policy "akis okunabilir" on comments
  for select to authenticated
  using (not private.engelli_mi((select auth.uid()), author_id));

-- Tepkiler herkese açıktı: engellediğin kişinin tepkisi de, göremediğin bir
-- gönderiye gelen tepki de listeleniyordu. Artık yalnızca görebildiğin
-- içeriklerin tepkileri (alt sorgular posts/comments RLS'inden geçiyor).
drop policy if exists "akis okunabilir" on reactions;
create policy "tepkiler gorunur icerikte okunur" on reactions
  for select to authenticated
  using (
    (post_id is not null and exists (select 1 from posts p where p.id = reactions.post_id))
    or (comment_id is not null and exists (select 1 from comments c where c.id = reactions.comment_id))
  );

-- Yorum ve tepki yazarken hedefin görünür olması şartı: engellenen biri,
-- göremediği bir gönderiye yorum/tepki bırakamasın.
drop policy if exists "kendi yorumunu yazar" on comments;
create policy "kendi yorumunu yazar" on comments
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (select 1 from posts p where p.id = comments.post_id)
  );

drop policy if exists "kendi tepkisini verir" on reactions;
create policy "kendi tepkisini verir" on reactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      (post_id is not null and exists (select 1 from posts p where p.id = reactions.post_id))
      or (comment_id is not null and exists (select 1 from comments c where c.id = reactions.comment_id))
    )
  );

-- Mesajlarda da aynı delik vardı: karşı taraf seni engellediyse sen yazmaya
-- devam edebiliyordun.
drop policy if exists "mesaj yazar" on dm_messages;
create policy "mesaj yazar" on dm_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and private.dm_uyesi(thread_id)
    and not exists (
      select 1 from dm_members m
      where m.thread_id = dm_messages.thread_id
        and m.user_id <> (select auth.uid())
        and private.engelli_mi((select auth.uid()), m.user_id)
    )
  );

-- Takip listesi herkese açıktı: profilini gizleyen birinin kimi takip ettiği
-- yine okunabiliyordu. Artık kendi takiplerin + herkese açık profiller.
drop policy if exists "takipler okunabilir" on follows;
create policy "takipler okunabilir" on follows
  for select to authenticated
  using (
    follower_id = (select auth.uid())
    or following_id = (select auth.uid())
    or exists (select 1 from profiles p where p.id = follows.following_id and p.is_public)
  );
