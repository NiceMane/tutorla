-- Veritabanı denetçisinin (database linter) iki bulgusu:
-- 1) reactions tablosunun birincil anahtarı yoktu. Kimliği iki kısmi benzersiz
--    indeks taşıyordu (post/comment XOR); bunlar kalıyor, üstüne yüzey anahtar
--    ekleniyor: satırı tek başına adresleyebilmek replikasyon ve araçlar için şart.
-- 2) 21 yabancı anahtarın kapsayan indeksi yoktu. Asıl bedeli okumada değil
--    SİLMEDE: cascade her seferinde tam tarama yapıyordu (sınav silmek gibi).

alter table reactions add column if not exists id uuid not null default gen_random_uuid();
alter table reactions drop constraint if exists reactions_pkey;
alter table reactions add primary key (id);

create index if not exists bookmarks_post_id_idx        on bookmarks (post_id);
create index if not exists comments_author_id_idx       on comments (author_id);
create index if not exists concept_states_concept_idx   on concept_states (concept_id);
create index if not exists concept_states_session_idx   on concept_states (session_id);
create index if not exists exam_documents_uploader_idx  on exam_documents (uploaded_by);
create index if not exists exams_created_by_idx         on exams (created_by);
create index if not exists gaps_concept_id_idx          on gaps (concept_id);
create index if not exists gaps_message_id_idx          on gaps (message_id);
create index if not exists moments_concept_id_idx       on moments (concept_id);
create index if not exists moments_message_id_idx       on moments (message_id);
create index if not exists notifications_actor_idx      on notifications (actor_id);
create index if not exists notifications_comment_idx    on notifications (comment_id);
create index if not exists notifications_post_idx       on notifications (post_id);
create index if not exists posts_exam_id_idx            on posts (exam_id);
create index if not exists profiles_exam_id_idx         on profiles (exam_id);
create index if not exists reports_comment_id_idx       on reports (comment_id);
create index if not exists reports_post_id_idx          on reports (post_id);
create index if not exists reports_profile_id_idx       on reports (profile_id);
create index if not exists reports_reporter_id_idx      on reports (reporter_id);
create index if not exists sessions_persona_id_idx      on sessions (persona_id);
create index if not exists sessions_topic_id_idx        on sessions (topic_id);
