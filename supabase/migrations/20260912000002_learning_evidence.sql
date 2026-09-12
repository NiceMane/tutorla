-- Protégé effect'in üründeki karşılığı.
-- İddia: bir konuyu anlatmaya çalışınca boşluğun ortaya çıkar ve anlatarak kapatırsın.
-- Kavramın şu anki durumu bunu göstermez; "önce boşluktu, anlatarak kapattın"
-- yolculuğunu tutmak gerekir.
--
-- İki kanıt katmanı yan yana duruyor ve birbirini ikame etmiyor:
--   moments           → NASIL öğrettiğin  (davranış kanıtı, Wild Zebra hattı)
--   learning_evidence → NE öğrendiğin     (öğrenme kanıtı, protégé effect hattı)

alter table concept_states
  add column was_gap boolean not null default false;

comment on column concept_states.was_gap is
  'Bu kavram bir kez boşluk olarak işaretlendi mi. settled + was_gap = anlatarak kapatılmış kavram.';

update concept_states cs
set was_gap = true
where status = 'gap'
   or exists (select 1 from gaps g where g.concept_id = cs.concept_id);

create view learning_evidence
with (security_invoker = true) as
select
  cs.user_id,
  c.topic_id,
  count(*) filter (where cs.status = 'settled' and cs.was_gap)::int as closed_by_teaching,
  count(*) filter (where cs.status = 'settled')::int               as settled,
  max(cs.updated_at)                                               as last_at
from concept_states cs
join concepts c on c.id = cs.concept_id
group by cs.user_id, c.topic_id;
