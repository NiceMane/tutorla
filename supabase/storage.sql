-- Depolama kovaları ve politikaları (migration değil, elle uygulanır).
-- Dosya yolu kuralı: <kullanıcı-id>/<dosya>. Politikalar ilk klasöre bakıyor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feed', 'feed', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exam-docs', 'exam-docs', false, 10485760,
        array['application/pdf','text/plain','text/markdown','image/png','image/jpeg'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "feed okunabilir" on storage.objects
  for select using (bucket_id = 'feed');
create policy "feed kendi klasorune yazar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'feed' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "feed kendi dosyasini siler" on storage.objects
  for delete to authenticated
  using (bucket_id = 'feed' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "belgeler kendi klasoru" on storage.objects
  for select to authenticated
  using (bucket_id = 'exam-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "belge yukler" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exam-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "belge siler" on storage.objects
  for delete to authenticated
  using (bucket_id = 'exam-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
