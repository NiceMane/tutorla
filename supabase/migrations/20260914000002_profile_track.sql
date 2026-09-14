-- Profilde iki eksik alan: YKS'de asıl belirleyici olan "alan" ve hedef puan.
-- Metin olarak tutuluyor, CHECK yok: arayüz öneri sunuyor ama kimseyi
-- listeye hapsetmiyor (bölümü listede olmayan öğrenci de yazabilsin).
alter table profiles add column if not exists track text;
alter table profiles add column if not exists target_score numeric(6,3);

comment on column profiles.track is 'sayisal | esit | sozel | dil | — serbest metin';
comment on column profiles.target_score is 'hedef puan, örn. 480.512';
