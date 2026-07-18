-- Pune.rent V1 schema
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.rent_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  lat double precision not null,
  lng double precision not null,
  bhk smallint not null check (bhk between 1 and 5),
  rent_inr integer not null check (rent_inr > 0),
  furnishing text not null check (furnishing in ('unfurnished', 'semi', 'fully')),
  society_name text not null,
  area_slug text not null,
  society_key text not null,
  is_gated boolean,
  deposit_months numeric(3, 1),
  maintenance_inr integer,
  as_of_date date not null default current_date,
  source text not null default 'community' check (source in ('community', 'admin')),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  status text not null default 'active' check (status in ('active', 'flagged', 'hidden')),
  outlier_reason text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_obs_area on public.rent_observations(area_slug) where status = 'active';
create index if not exists idx_obs_society_key on public.rent_observations(society_key) where status = 'active';

create table if not exists public.bachelor_votes (
  id uuid primary key default gen_random_uuid(),
  society_key text not null,
  user_id uuid not null references public.profiles(id),
  bachelors_allowed text not null check (bachelors_allowed in ('yes', 'no', 'depends')),
  visitors_restricted text check (visitors_restricted in ('yes', 'no', 'depends')),
  created_at timestamptz not null default now(),
  unique (society_key, user_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  society_key text not null,
  user_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) <= 500),
  owner_strictness smallint check (owner_strictness between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.rent_observations(id) on delete cascade,
  user_id uuid references public.profiles(id),
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.rent_observations enable row level security;
alter table public.bachelor_votes enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

create policy "public read active observations"
  on public.rent_observations for select
  using (status in ('active', 'flagged'));

create policy "public read votes"
  on public.bachelor_votes for select using (true);

create policy "public read reviews"
  on public.reviews for select using (true);
