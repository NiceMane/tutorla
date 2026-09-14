-- Veritabanı denetçisi: yeni SECURITY DEFINER işlevleri /rest/v1/rpc/ altında
-- herkese açıktı. Üçünün de dışarıdan çağrılmaya ihtiyacı yok, biri hariç.
--
--  · dm_uyesi      → yalnızca RLS politikalarının içinde kullanılıyor.
--                    Politikadan çağrıldığı için EXECUTE yetkisi gerekli;
--                    bu yüzden silmek yerine API'ye açılmayan `private`
--                    şemasına taşındı.
--  · dm_mesaj_sonrasi → tetikleyici işlevi; kimsenin elle çağırmasına gerek yok.
--  · dm_kanal_ac   → istemci bilerek çağırıyor (kanal açma). anon'dan alınıyor,
--                    authenticated'te kalıyor.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.dm_uyesi(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dm_members m where m.thread_id = t and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.dm_uyesi(uuid) from public;
grant execute on function private.dm_uyesi(uuid) to authenticated;

drop policy "kanalini gorur" on dm_threads;
create policy "kanalini gorur" on dm_threads
  for select to authenticated using (private.dm_uyesi(id));

drop policy "uyeleri gorur" on dm_members;
create policy "uyeleri gorur" on dm_members
  for select to authenticated using (private.dm_uyesi(thread_id));

drop policy "mesajlari gorur" on dm_messages;
create policy "mesajlari gorur" on dm_messages
  for select to authenticated using (private.dm_uyesi(thread_id));

drop policy "mesaj yazar" on dm_messages;
create policy "mesaj yazar" on dm_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and private.dm_uyesi(thread_id)
    and not exists (
      select 1 from blocks b
      join dm_members m on m.thread_id = dm_messages.thread_id and m.user_id <> (select auth.uid())
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = m.user_id)
         or (b.blocker_id = m.user_id and b.blocked_id = (select auth.uid()))
    )
  );

drop function if exists public.dm_uyesi(uuid);

revoke execute on function public.dm_mesaj_sonrasi() from public, anon, authenticated;
revoke execute on function public.dm_kanal_ac(uuid) from public, anon;
grant execute on function public.dm_kanal_ac(uuid) to authenticated;
