-- Recruiter Workspace fields for TectMatch saved screening results.
-- Run this in Supabase SQL editor after the existing tectmatch_saved_results table exists.

alter table public.tectmatch_saved_results
  add column if not exists candidate_status text not null default 'New',
  add column if not exists recruiter_notes text not null default '',
  add column if not exists required_skills jsonb not null default '[]'::jsonb,
  add column if not exists candidate_skills jsonb not null default '[]'::jsonb,
  add column if not exists covered_skills jsonb not null default '[]'::jsonb,
  add column if not exists missing_skills jsonb not null default '[]'::jsonb,
  add column if not exists partial_skills jsonb not null default '[]'::jsonb,
  add column if not exists project_validation jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tectmatch_saved_results_candidate_status_check'
  ) then
    alter table public.tectmatch_saved_results
      add constraint tectmatch_saved_results_candidate_status_check
      check (candidate_status in ('New', 'Reviewing', 'Shortlisted', 'Interview', 'Rejected', 'Hired'))
      not valid;

    alter table public.tectmatch_saved_results
      validate constraint tectmatch_saved_results_candidate_status_check;
  end if;
end $$;

create unique index if not exists tectmatch_saved_results_candidate_resume_uidx
  on public.tectmatch_saved_results (candidate_name, resume_name);
