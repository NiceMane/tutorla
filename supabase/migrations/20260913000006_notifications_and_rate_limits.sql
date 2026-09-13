-- Bildirim tetikleyicileri ve kötüye kullanım sınırı.
create or replace function notify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare hedef uuid; tur notification_kind;
begin
  if new.parent_id is null then
    select author_id into hedef from posts where id = new.post_id; tur := 'yorum';
  else
    select author_id into hedef from comments where id = new.parent_id; tur := 'yanit';
  end if;
  if hedef is not null and hedef <> new.author_id then
    insert into notifications (user_id, actor_id, kind, post_id, comment_id)
    values (hedef, new.author_id, tur, new.post_id, new.id);
  end if;
  return new;
end; $$;
revoke execute on function public.notify_on_comment() from anon, authenticated, public;
create trigger comments_notify after insert on comments for each row execute function notify_on_comment();

create or replace function notify_on_reaction() returns trigger
language plpgsql security definer set search_path = public as $$
declare hedef uuid;
begin
  if new.post_id is not null then select author_id into hedef from posts where id = new.post_id;
  else select author_id into hedef from comments where id = new.comment_id; end if;
  if hedef is not null and hedef <> new.user_id then
    insert into notifications (user_id, actor_id, kind, post_id, comment_id)
    values (hedef, new.user_id, 'tepki', new.post_id, new.comment_id);
  end if;
  return new;
end; $$;
revoke execute on function public.notify_on_reaction() from anon, authenticated, public;
create trigger reactions_notify after insert on reactions for each row execute function notify_on_reaction();

create or replace function notify_on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, actor_id, kind) values (new.following_id, new.follower_id, 'takip');
  return new;
end; $$;
revoke execute on function public.notify_on_follow() from anon, authenticated, public;
create trigger follows_notify after insert on follows for each row execute function notify_on_follow();

-- Kota: istemciye güvenmeyip veritabanında uyguluyoruz.
create or replace function kota_kontrol() returns trigger
language plpgsql security definer set search_path = public as $$
declare son_dk int; son_saat int;
begin
  if tg_table_name = 'posts' then
    select count(*) into son_dk from posts where author_id = new.author_id and created_at > now() - interval '1 minute';
    select count(*) into son_saat from posts where author_id = new.author_id and created_at > now() - interval '1 hour';
    if son_dk >= 3 then raise exception 'Çok hızlı paylaşıyorsun. Bir dakika bekle.' using errcode = 'P0001'; end if;
    if son_saat >= 30 then raise exception 'Saatlik paylaşım sınırına ulaştın.' using errcode = 'P0001'; end if;
  elsif tg_table_name = 'comments' then
    select count(*) into son_dk from comments where author_id = new.author_id and created_at > now() - interval '1 minute';
    select count(*) into son_saat from comments where author_id = new.author_id and created_at > now() - interval '1 hour';
    if son_dk >= 8 then raise exception 'Çok hızlı yorum yazıyorsun. Biraz bekle.' using errcode = 'P0001'; end if;
    if son_saat >= 120 then raise exception 'Saatlik yorum sınırına ulaştın.' using errcode = 'P0001'; end if;
  end if;
  return new;
end; $$;
revoke execute on function public.kota_kontrol() from anon, authenticated, public;
create trigger posts_kota before insert on posts for each row execute function kota_kontrol();
create trigger comments_kota before insert on comments for each row execute function kota_kontrol();
