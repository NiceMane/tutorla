-- Öğrenci kendi eklediği sınava ders ve konu ekleyebilsin.
-- Resmî müfredat (created_by is null) korunuyor: yalnızca migration değiştirir.

create or replace function sinav_sahibi(e_id uuid) returns boolean
language sql stable security invoker set search_path = public as $$
  select exists (select 1 from exams e where e.id = e_id and e.created_by = (select auth.uid()));
$$;

create policy "kendi sinavina ders ekler" on subjects
  for insert to authenticated with check (sinav_sahibi(exam_id));
create policy "kendi dersini gunceller" on subjects
  for update to authenticated using (sinav_sahibi(exam_id)) with check (sinav_sahibi(exam_id));
create policy "kendi dersini siler" on subjects
  for delete to authenticated using (sinav_sahibi(exam_id));

create policy "kendi sinavina konu ekler" on topics
  for insert to authenticated with check (
    exists (select 1 from subjects s where s.id = topics.subject_id and sinav_sahibi(s.exam_id))
  );
create policy "kendi konusunu gunceller" on topics
  for update to authenticated using (
    exists (select 1 from subjects s where s.id = topics.subject_id and sinav_sahibi(s.exam_id))
  ) with check (
    exists (select 1 from subjects s where s.id = topics.subject_id and sinav_sahibi(s.exam_id))
  );
create policy "kendi konusunu siler" on topics
  for delete to authenticated using (
    exists (select 1 from subjects s where s.id = topics.subject_id and sinav_sahibi(s.exam_id))
  );

create policy "kendi konusuna kavram ekler" on concepts
  for insert to authenticated with check (
    exists (select 1 from topics t join subjects s on s.id = t.subject_id
            where t.id = concepts.topic_id and sinav_sahibi(s.exam_id))
  );
create policy "kendi kavramini siler" on concepts
  for delete to authenticated using (
    exists (select 1 from topics t join subjects s on s.id = t.subject_id
            where t.id = concepts.topic_id and sinav_sahibi(s.exam_id))
  );

-- Kendi sınavını silebilsin
create policy "kendi sinavini siler" on exams
  for delete to authenticated using (created_by = (select auth.uid()));

-- Yüklediği belgeyi silebilsin (zaten vardı) + güncelleyebilsin
create policy "kendi belgesini gunceller" on exam_documents
  for update to authenticated using ((select auth.uid()) = uploaded_by)
  with check ((select auth.uid()) = uploaded_by);
