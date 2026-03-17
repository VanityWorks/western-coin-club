-- ============================================================
-- SACCC Membership Applications Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

create table if not exists membership_applications (
  id                uuid        default gen_random_uuid() primary key,
  reference_number  text        unique not null,
  first_name        text        not null,
  surname           text        not null,
  email             text        not null,
  mobile            text,
  whatsapp          text,
  address           text,
  city              text,
  province          text,
  country           text        default 'ZA',
  interests         text[]      default '{}',
  referral          boolean     default false,
  referral_name     text,
  referral_number   text,
  optionals         text[]      default '{}',
  status            text        default 'pending'
                                check (status in ('pending', 'approved', 'rejected')),
  rejection_reason  text,
  submitted_at      timestamptz default now(),
  reviewed_at       timestamptz,
  member_id         uuid        -- set to auth.users.id on approval
);

-- Enable Row Level Security
alter table membership_applications enable row level security;

-- Anyone can submit an application (anon key from the public site)
create policy "public_can_insert"
  on membership_applications for insert
  to anon, authenticated
  with check (true);

-- No public SELECT/UPDATE policies — all reads/writes go through Edge Functions
-- which use the service role key and bypass RLS entirely.
