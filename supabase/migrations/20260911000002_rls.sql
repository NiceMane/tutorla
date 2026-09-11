-- Tutorla · satır düzeyi güvenlik
-- Kural: müfredat herkese açık ve salt-okunur; kullanıcı verisine yalnızca sahibi erişir.
-- Bu politikalar veritabanının içinde zorlanır — hangi istemciden gelirse gelsin geçerli.

-- ------------------------------------------------ müfredat: oku, yazma yok
alter table exams    enable row level security;
alter table subjects enable row level security;
alter table topics   enable row level security;
alter table concepts enable row level security;
alter table personas enable row level security;

create policy "müfredat okunabilir" on exams    for select to authenticated using (true);
create policy "müfredat okunabilir" on subjects for select to authenticated using (true);
create policy "müfredat okunabilir" on topics   for select to authenticated using (true);
create policy "müfredat okunabilir" on concepts for select to authenticated using (true);
create policy "müfredat okunabilir" on personas for select to authenticated using (true);
-- Yazma politikası yok: müfredat yalnızca migration/seed ile değişir.

-- --------------------------------------------------------------- profiller
alter table profiles enable row level security;

create policy "kendi profilini görür" on profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "kendi profilini günceller" on profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "kendi profilini oluşturur" on profiles
  for insert to authenticated with check ((select auth.uid()) = id);

-- --------------------------------------------------------------- oturumlar
alter table sessions enable row level security;

create policy "kendi oturumlarını görür" on sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "kendi oturumunu açar" on sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "kendi oturumunu günceller" on sessions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "kendi oturumunu siler" on sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ------------------------------------------------------ mesajlar, boşluklar
-- Sahiplik oturum üzerinden kurulur; alt sorgu her satırda değil bir kez çalışsın diye exists.
alter table messages enable row level security;

create policy "kendi mesajlarını görür" on messages
  for select to authenticated using (
    exists (select 1 from sessions s where s.id = messages.session_id and s.user_id = (select auth.uid()))
  );
create policy "kendi oturumuna mesaj yazar" on messages
  for insert to authenticated with check (
    exists (select 1 from sessions s where s.id = messages.session_id and s.user_id = (select auth.uid()))
  );

alter table gaps enable row level security;

create policy "kendi boşluklarını görür" on gaps
  for select to authenticated using (
    exists (select 1 from sessions s where s.id = gaps.session_id and s.user_id = (select auth.uid()))
  );
create policy "kendi oturumuna boşluk yazar" on gaps
  for insert to authenticated with check (
    exists (select 1 from sessions s where s.id = gaps.session_id and s.user_id = (select auth.uid()))
  );

-- ----------------------------------------------------------- kavram durumu
alter table concept_states enable row level security;

create policy "kendi kavram durumunu görür" on concept_states
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "kendi kavram durumunu yazar" on concept_states
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "kendi kavram durumunu günceller" on concept_states
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- topic_progress görünümü security_invoker olduğu için alttaki tabloların
-- politikalarını miras alır; ayrı politika gerekmez.
