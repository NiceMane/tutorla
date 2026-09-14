-- Sınıf ve çalışma düzeni sabit listeye kilitliydi: hazırlık sınıfındaki,
-- açıköğretimdeki ya da "sabah 5'te kalkarım" diyen öğrenci alanı hiç
-- dolduramıyordu. Liste artık arayüzde ÖNERİ; veritabanı yalnızca uzunluk
-- ve boşluk kontrolü yapıyor.
alter table profiles drop constraint if exists profiles_grade_gecerli;
alter table profiles drop constraint if exists profiles_style_gecerli;

alter table profiles add constraint profiles_grade_gecerli
  check (grade is null or length(btrim(grade)) between 1 and 40);
alter table profiles add constraint profiles_style_gecerli
  check (study_style is null or length(btrim(study_style)) between 1 and 60);

-- Sınav yılı üst sınırı da dardı; bugün 8. sınıfta olan öğrenci 2041'i yazabilsin.
alter table profiles drop constraint if exists profiles_year_gecerli;
alter table profiles add constraint profiles_year_gecerli
  check (exam_year is null or (exam_year >= 2025 and exam_year <= 2050));

-- Hedef puan aralığı (YKS/LGS ölçeği)
alter table profiles add constraint profiles_score_gecerli
  check (target_score is null or (target_score >= 0 and target_score <= 600));

-- Alan serbest metin ama sınırsız değil
alter table profiles add constraint profiles_track_gecerli
  check (track is null or length(btrim(track)) between 1 and 40);
