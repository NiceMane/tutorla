-- Profili gerçek bir öğrenci kimliğine çevir.
alter table profiles
  add column if not exists avatar_url        text,
  add column if not exists grade             text,
  add column if not exists school            text,
  add column if not exists city              text,
  add column if not exists exam_year         int,
  add column if not exists target_university text,
  add column if not exists target_department text,
  add column if not exists target_rank       int,
  add column if not exists weekly_hours      int,
  add column if not exists study_style       text,
  add column if not exists strong_subjects   text[] not null default '{}',
  add column if not exists weak_subjects     text[] not null default '{}',
  add column if not exists goals             text,
  add column if not exists is_public         boolean not null default true,
  add column if not exists streak_days       int not null default 0,
  add column if not exists longest_streak    int not null default 0,
  add column if not exists last_active_date  date;

alter table profiles
  add constraint profiles_grade_gecerli check (grade is null or grade in ('9','10','11','12','mezun')),
  add constraint profiles_style_gecerli check (study_style is null or study_style in ('sabah','gece','karma')),
  add constraint profiles_year_gecerli  check (exam_year is null or exam_year between 2025 and 2040),
  add constraint profiles_rank_gecerli  check (target_rank is null or target_rank between 1 and 3000000),
  add constraint profiles_hours_gecerli check (weekly_hours is null or weekly_hours between 0 and 120),
  add constraint profiles_handle_bicim  check (handle is null or handle ~ '^[a-zA-Z0-9_]{3,20}$');

create index if not exists profiles_handle_idx on profiles (lower(handle));

-- Gizli profil yalnızca sahibine görünür.
drop policy if exists "profiller okunabilir" on profiles;
create policy "profiller okunabilir" on profiles
  for select to authenticated using (is_public or id = (select auth.uid()));

-- Seri: seans açıldığında günlük aktiflik işaretlenir.
create or replace function touch_streak() returns trigger
language plpgsql security definer set search_path = public as $$
declare last date; cur int; best int;
begin
  select last_active_date, streak_days, longest_streak into last, cur, best
  from profiles where id = new.user_id;
  if last is null or last < current_date then
    cur := case when last = current_date - 1 then coalesce(cur, 0) + 1 else 1 end;
    best := greatest(coalesce(best, 0), cur);
    update profiles set last_active_date = current_date, streak_days = cur, longest_streak = best
    where id = new.user_id;
  end if;
  return new;
end;
$$;
revoke execute on function public.touch_streak() from anon, authenticated, public;

drop trigger if exists sessions_touch_streak on sessions;
create trigger sessions_touch_streak after insert on sessions
  for each row execute function touch_streak();
