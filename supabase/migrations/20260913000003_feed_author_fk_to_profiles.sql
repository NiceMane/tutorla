-- posts.author_id ve comments.author_id auth.users'a bağlıydı; profiles'a değil.
-- PostgREST bu yüzden yazar profilini gömemiyor ve akış sorgusu 400 dönüyordu.
-- profiles.id zaten auth.users(id)'ye cascade ile bağlı, silme davranışı aynı.
alter table posts drop constraint posts_author_id_fkey;
alter table posts add constraint posts_author_id_fkey
  foreign key (author_id) references profiles(id) on delete cascade;

alter table comments drop constraint comments_author_id_fkey;
alter table comments add constraint comments_author_id_fkey
  foreign key (author_id) references profiles(id) on delete cascade;

insert into profiles (id)
select u.id from auth.users u
left join profiles p on p.id = u.id
where p.id is null;
