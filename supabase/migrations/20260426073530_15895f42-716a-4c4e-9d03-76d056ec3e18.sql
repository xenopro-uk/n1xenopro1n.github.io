-- Roles enum + table
create type public.app_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  cursor_color text default '#ffffff',
  cloak_title text,
  cloak_icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  style text not null default 'banner', -- 'banner' | 'toast'
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  reason text,
  banned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.broadcasts enable row level security;
alter table public.bans enable row level security;

-- has_role helper (security definer to dodge RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Profiles policies
create policy "profiles readable by all signed in"
  on public.profiles for select to authenticated using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = user_id);
create policy "users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = user_id);

-- Roles policies
create policy "users see own role"
  on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Broadcasts policies
create policy "broadcasts readable by all signed in"
  on public.broadcasts for select to authenticated using (true);
create policy "admins manage broadcasts"
  on public.broadcasts for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Bans policies
create policy "users see own ban"
  on public.bans for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admins manage bans"
  on public.bans for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create profile + member role on signup; auto-promote dev email to admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.user_roles (user_id, role) values (new.id, 'member');

  if new.email = 'xenoprosites@krisgmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime for broadcasts
alter publication supabase_realtime add table public.broadcasts;
alter publication supabase_realtime add table public.bans;