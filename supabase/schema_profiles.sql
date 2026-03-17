-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Run this in your Supabase SQL editor

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '',
  avatar_url    text,
  bio           text default '',
  location      text default '',
  show_location boolean default true,
  show_posts    boolean default true,
  awards        text[] default '{}',
  roles         text[] default '{}',
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by everyone"
  on public.profiles for select using (true);

create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
begin
  full_name := trim(
    coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' ||
    coalesce(new.raw_user_meta_data->>'surname', '')
  );
  if full_name = '' or full_name = ' ' then
    full_name := split_part(new.email, '@', 1);
  end if;
  insert into public.profiles (id, display_name)
  values (new.id, full_name)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for avatars (public read)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users upload own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
