-- Authentication System Migration
-- Creates user profiles, admin access logging, and RLS policies

-- =============================================
-- 1. USER PROFILES TABLE
-- =============================================

create table if not exists user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  business_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table user_profiles enable row level security;

-- Policy: Users can read their own profile
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Policy: Users can insert their own profile (during signup)
create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- Policy: Admin can view all profiles
create policy "Admin can view all profiles"
  on user_profiles for select
  using (auth.email() = 'admin@dockeryai.com');

-- Policy: Admin can update all profiles
create policy "Admin can update all profiles"
  on user_profiles for update
  using (auth.email() = 'admin@dockeryai.com');

-- =============================================
-- 2. ADMIN ACCESS LOG TABLE
-- =============================================

create table if not exists admin_access_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id),
  accessed_user_id uuid references auth.users(id),
  action text not null,
  metadata jsonb default '{}'::jsonb,
  timestamp timestamp with time zone default now()
);

-- Enable RLS (only admin can read)
alter table admin_access_log enable row level security;

create policy "Only admin can view logs"
  on admin_access_log for select
  using (auth.email() = 'admin@dockeryai.com');

create policy "Only admin can insert logs"
  on admin_access_log for insert
  with check (auth.email() = 'admin@dockeryai.com');

-- =============================================
-- 3. ADD user_id TO EXISTING TABLES
-- =============================================

-- Add user_id to business_profiles if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name='business_profiles' and column_name='user_id') then
    alter table business_profiles add column user_id uuid references auth.users(id);
  end if;
end $$;

-- Add user_id to campaigns if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name='campaigns' and column_name='user_id') then
    alter table campaigns add column user_id uuid references auth.users(id);
  end if;
end $$;

-- Add user_id to youtube_channels if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name='youtube_channels' and column_name='user_id') then
    alter table youtube_channels add column user_id uuid references auth.users(id);
  end if;
end $$;

-- Add user_id to intelligence_runs if exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_name='intelligence_runs') then
    if not exists (select 1 from information_schema.columns
                   where table_name='intelligence_runs' and column_name='user_id') then
      alter table intelligence_runs add column user_id uuid references auth.users(id);
    end if;
  end if;
end $$;

-- =============================================
-- 4. RLS POLICIES FOR business_profiles
-- =============================================

-- Enable RLS if not already enabled
alter table business_profiles enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can view own business profile" on business_profiles;
drop policy if exists "Admin can view all business profiles" on business_profiles;
drop policy if exists "Users can insert own business profile" on business_profiles;
drop policy if exists "Users can update own business profile" on business_profiles;

-- Users can view own business profile
create policy "Users can view own business profile"
  on business_profiles for select
  using (auth.uid() = user_id);

-- Admin can view all business profiles
create policy "Admin can view all business profiles"
  on business_profiles for select
  using (auth.email() = 'admin@dockeryai.com');

-- Users can insert own business profile
create policy "Users can insert own business profile"
  on business_profiles for insert
  with check (auth.uid() = user_id);

-- Users can update own business profile
create policy "Users can update own business profile"
  on business_profiles for update
  using (auth.uid() = user_id);

-- =============================================
-- 5. RLS POLICIES FOR campaigns
-- =============================================

alter table campaigns enable row level security;

drop policy if exists "Users can view own campaigns" on campaigns;
drop policy if exists "Admin can view all campaigns" on campaigns;
drop policy if exists "Users can insert own campaigns" on campaigns;
drop policy if exists "Users can update own campaigns" on campaigns;

create policy "Users can view own campaigns"
  on campaigns for select
  using (auth.uid() = user_id);

create policy "Admin can view all campaigns"
  on campaigns for select
  using (auth.email() = 'admin@dockeryai.com');

create policy "Users can insert own campaigns"
  on campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update own campaigns"
  on campaigns for update
  using (auth.uid() = user_id);

-- =============================================
-- 6. RLS POLICIES FOR youtube_channels (if exists)
-- =============================================

do $$
begin
  if exists (select 1 from information_schema.tables where table_name='youtube_channels') then
    alter table youtube_channels enable row level security;

    drop policy if exists "Users can view own youtube channels" on youtube_channels;
    drop policy if exists "Admin can view all youtube channels" on youtube_channels;

    execute 'create policy "Users can view own youtube channels"
      on youtube_channels for select
      using (auth.uid() = user_id)';

    execute 'create policy "Admin can view all youtube channels"
      on youtube_channels for select
      using (auth.email() = ''admin@dockeryai.com'')';
  end if;
end $$;

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

create index if not exists user_profiles_email_idx on user_profiles(email);
create index if not exists admin_access_log_admin_id_idx on admin_access_log(admin_id);
create index if not exists admin_access_log_accessed_user_id_idx on admin_access_log(accessed_user_id);
create index if not exists admin_access_log_timestamp_idx on admin_access_log(timestamp desc);
create index if not exists business_profiles_user_id_idx on business_profiles(user_id);
create index if not exists campaigns_user_id_idx on campaigns(user_id);

-- =============================================
-- 8. UPDATED_AT TRIGGER FOR user_profiles
-- =============================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_profiles_updated_at on user_profiles;
create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row
  execute function update_updated_at_column();

-- =============================================
-- NOTES
-- =============================================
-- After running this migration:
-- 1. Create admin user in Supabase Dashboard:
--    - Email: admin@dockeryai.com
--    - Password: admin123
--    - Auto-confirm email
-- 2. All user data will be isolated via RLS
-- 3. Admin can access all data via email check in policies
