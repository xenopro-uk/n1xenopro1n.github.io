
-- AI message logging
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
create index ai_messages_user_idx on public.ai_messages(user_id, created_at desc);
create index ai_messages_conv_idx on public.ai_messages(conversation_id, created_at);
alter table public.ai_messages enable row level security;
create policy "users insert own ai messages" on public.ai_messages
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users see own ai messages" on public.ai_messages
  for select to authenticated using (auth.uid() = user_id or has_role(auth.uid(),'admin'));
create policy "admins manage ai messages" on public.ai_messages
  for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- Online presence
create table public.presence (
  user_id uuid primary key,
  display_name text,
  last_seen timestamptz not null default now()
);
alter table public.presence enable row level security;
create policy "presence readable to all signed in" on public.presence
  for select to authenticated using (true);
create policy "users upsert own presence" on public.presence
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own presence" on public.presence
  for update to authenticated using (auth.uid() = user_id);
create policy "admins manage presence" on public.presence
  for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- Wallpapers
create table public.wallpapers (
  user_id uuid primary key,
  url text not null,
  kind text not null default 'image' check (kind in ('image','video')),
  loop boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.wallpapers enable row level security;
create policy "users see own wallpaper" on public.wallpapers
  for select to authenticated using (auth.uid() = user_id);
create policy "users upsert own wallpaper" on public.wallpapers
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own wallpaper" on public.wallpapers
  for update to authenticated using (auth.uid() = user_id);

-- Recently watched
create table public.recently_watched (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  media_type text not null check (media_type in ('movie','tv')),
  media_id text not null,
  title text not null,
  poster text,
  watched_at timestamptz not null default now(),
  unique (user_id, media_type, media_id)
);
create index recently_watched_user_idx on public.recently_watched(user_id, watched_at desc);
alter table public.recently_watched enable row level security;
create policy "users see own watched" on public.recently_watched
  for select to authenticated using (auth.uid() = user_id or has_role(auth.uid(),'admin'));
create policy "users insert own watched" on public.recently_watched
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own watched" on public.recently_watched
  for update to authenticated using (auth.uid() = user_id);
create policy "users delete own watched" on public.recently_watched
  for delete to authenticated using (auth.uid() = user_id);

-- Storage bucket for user wallpaper uploads
insert into storage.buckets (id, name, public) values ('wallpapers','wallpapers', true)
  on conflict (id) do nothing;
create policy "wallpapers public read" on storage.objects
  for select using (bucket_id = 'wallpapers');
create policy "users upload own wallpaper" on storage.objects
  for insert to authenticated with check (bucket_id = 'wallpapers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users delete own wallpaper" on storage.objects
  for delete to authenticated using (bucket_id = 'wallpapers' and auth.uid()::text = (storage.foldername(name))[1]);
