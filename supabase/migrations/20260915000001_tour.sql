-- Tanıtım turu bir kez gösterilsin diye. onboarded_at "profilini doldurdun mu",
-- bu ise "arayüzü gezdin mi" sorusunun yanıtı; ikisi ayrı çünkü kullanıcı
-- tanışmayı atlayıp turu görebilir ya da tersi.
alter table profiles add column if not exists tour_done_at timestamptz;
comment on column profiles.tour_done_at is 'tanıtım turunun tamamlandığı an; null ise tur ilk girişte açılır';
