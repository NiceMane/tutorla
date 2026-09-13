-- engelli_mi() SECURITY DEFINER olduğu için PostgREST /rpc/ altında yayınlıyordu.
-- RLS içinde çağrıldığından EXECUTE yetkisini geri alamıyoruz; bu yüzden kontrolü
-- doğrudan politikanın içine gömüp fonksiyonu kaldırıyoruz.

drop policy if exists "akis okunabilir" on posts;
create policy "akis okunabilir" on posts
  for select to authenticated using (
    not exists (
      select 1 from blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = posts.author_id)
         or (b.blocker_id = posts.author_id and b.blocked_id = (select auth.uid()))
    )
  );

drop policy if exists "akis okunabilir" on comments;
create policy "akis okunabilir" on comments
  for select to authenticated using (
    not exists (
      select 1 from blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = comments.author_id)
         or (b.blocker_id = comments.author_id and b.blocked_id = (select auth.uid()))
    )
  );

drop function if exists public.engelli_mi(uuid);

create index if not exists blocks_blocked_idx on blocks (blocked_id);
