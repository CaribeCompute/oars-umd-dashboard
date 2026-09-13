-- Supabase projects may grant new tables to browser roles by default.
-- Explicitly enforce the existing design: account/application writes go through
-- the authenticated server API, which verifies roles and consent transitions.
begin;
revoke insert, update, delete, truncate, references, trigger
 on public.profiles, public.extension_officer_assignments,
 public.program_applications, public.application_events, public.account_audit_events
 from anon, authenticated;
grant select on public.profiles, public.extension_officer_assignments,
 public.program_applications, public.application_events, public.account_audit_events
 to authenticated;
-- RLS still controls which rows an authenticated account can read.
-- Owner property, GIS, assessment, program-catalog and photo writes are unchanged.
commit;
