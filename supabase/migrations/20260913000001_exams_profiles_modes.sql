-- 1) Sınavlar: birden fazla sınav türü + öğrencinin kendi ekleyebilmesi
alter table exams add column if not exists description text;
alter table exams add column if not exists created_by uuid references auth.users(id) on delete set null;
comment on column exams.active is 'İçeriği hazır mı. false ise arayüzde "yakında" olarak görünür.';
comment on column exams.created_by is 'Öğrencinin kendi eklediği sınavlarda dolu; resmî sınavlarda null.';

insert into exams (code, name, description, position, active) values
  ('LGS',     'LGS',     'Liseye Geçiş Sınavı · 8. sınıf',                2, false),
  ('KPSS',    'KPSS',    'Kamu Personel Seçme Sınavı',                    3, false),
  ('DGS',     'DGS',     'Dikey Geçiş Sınavı',                            4, false),
  ('ALES',    'ALES',    'Akademik Personel ve Lisansüstü Eğitim Sınavı', 5, false),
  ('SAT',     'SAT',     'Yurt dışı lisans başvurusu',                    6, false),
  ('TUBITAK', 'TÜBİTAK', 'Bilim olimpiyatları (2202 vb.)',                7, false)
on conflict (code) do nothing;

update exams set description = 'Yükseköğretim Kurumları Sınavı', position = 1, active = true where code = 'YKS';

create policy "kendi sinavini ekler" on exams
  for insert to authenticated with check ((select auth.uid()) = created_by);
create policy "kendi sinavini gunceller" on exams
  for update to authenticated using ((select auth.uid()) = created_by) with check ((select auth.uid()) = created_by);

-- 2) Profil: görünen kimlik. Akışta yazar adı görünmeli, o yüzden profiller
-- giriş yapmış herkese okunabilir (e-posta profiles'ta tutulmuyor).
alter table profiles add column if not exists handle text unique;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists avatar_emoji text default '🦉';

drop policy if exists "kendi profilini görür" on profiles;
drop policy if exists "kendi profilini gorur" on profiles;
create policy "profiller okunabilir" on profiles
  for select to authenticated using (true);

-- 3) Seans modu
create type session_mode as enum ('teach', 'socratic');
alter table sessions add column if not exists mode session_mode not null default 'teach';
comment on column sessions.mode is
  'teach = kullanıcı anlatır, AI öğrenci (ürünün çekirdeği). socratic = AI yönlendirici soru sorar.';

create index if not exists sessions_user_mode_idx on sessions (user_id, mode, started_at desc);
