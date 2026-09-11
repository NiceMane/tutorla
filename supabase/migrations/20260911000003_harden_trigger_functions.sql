-- handle_new_user ve touch_concept_state yalnızca tetikleyici olarak çalışmalı.
-- PostgREST public şemadaki fonksiyonları /rest/v1/rpc/ altında yayınladığı için
-- dışarıdan doğrudan çağrılabiliyorlardı (Supabase güvenlik denetçisi uyardı).
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.touch_concept_state() from anon, authenticated, public;
