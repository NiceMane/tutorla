-- Bağlantı bildirimleri. Ayrı migration: enum değerleri önceki migration'da
-- eklendi, aynı işlem içinde kullanılamıyor.

create or replace function notify_on_connection() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- İstek geldi → alan tarafa haber
    insert into notifications (user_id, actor_id, kind)
    values (new.addressee_id, new.requester_id, 'baglanti_istek');
  elsif tg_op = 'UPDATE' and new.status = 'kabul' and old.status = 'beklemede' then
    -- Kabul edildi → isteği gönderene haber
    insert into notifications (user_id, actor_id, kind)
    values (new.requester_id, new.addressee_id, 'baglanti_kabul');
  end if;
  return new;
end; $$;

revoke execute on function notify_on_connection() from public, anon, authenticated;

create trigger connections_notify
  after insert or update on connections
  for each row execute function notify_on_connection();

-- Kabul anını işaretle
create or replace function connection_responded() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'kabul' and old.status = 'beklemede' then
    new.responded_at = now();
  end if;
  return new;
end; $$;

create trigger connections_responded
  before update on connections
  for each row execute function connection_responded();
