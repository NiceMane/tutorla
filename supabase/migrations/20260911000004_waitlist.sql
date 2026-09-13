-- Landing page'deki erken erişim formu.
-- Tasarım kararı: herkes KAYIT OLABİLİR, kimse LİSTEYİ OKUYAMAZ.
-- select politikası bilerek yok — aksi halde anon anahtarla e-posta listesi toplanabilirdi.
create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  exam       text,
  locale     text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_gecerli check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  constraint waitlist_exam_gecerli  check (exam is null or exam in ('YKS', 'TÜBİTAK', 'SAT')),
  constraint waitlist_locale_gecerli check (locale is null or locale in ('tr', 'en'))
);

alter table waitlist enable row level security;

create policy "herkes kaydolabilir" on waitlist
  for insert to anon, authenticated with check (true);
-- select / update / delete politikası yok: liste yalnızca panelden veya
-- service_role ile okunur.
