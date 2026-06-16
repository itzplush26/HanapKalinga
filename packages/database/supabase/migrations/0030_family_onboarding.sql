alter table public.families
  add column if not exists has_browsed boolean not null default false,
  add column if not exists checklist_dismissed boolean not null default false,
  add column if not exists welcome_seen boolean not null default false,
  add column if not exists tooltips_dismissed jsonb not null default '{"browse":false,"booking":false,"messages":false}'::jsonb;
