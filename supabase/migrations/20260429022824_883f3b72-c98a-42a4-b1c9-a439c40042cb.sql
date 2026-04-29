
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  display_name text,
  action text not null,
  target text,
  details jsonb default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "users insert own activity" on public.activity_log
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "admins view all activity" on public.activity_log
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins delete activity" on public.activity_log
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index activity_log_created_at_idx on public.activity_log(created_at desc);
create index activity_log_user_id_idx on public.activity_log(user_id);
