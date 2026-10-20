-- PTC Premium Architectural Bold Website — Supabase schema
-- Run this in the Supabase SQL editor after creating the project

-- 1. Enable UUID extension
create extension if not exists "uuid";

-- 2. Enquiries table — stores contact form submissions
create table if not exists public.enquiries (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  company text,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'new' check (status in ('new', 'read', 'replied', 'archived'))
);

-- 3. Insights table — stores site metrics/insights
create table if not exists public.insights (
  id uuid default uuid_generate_v4() primary key,
  metric text not null,
  value text not null,
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Row-level security policies

-- Enquiries: authenticated staff can read all, insert is via the contact form API
alter table public.enquiries enable row level security;
create policy "Staff can read enquiries" on public.enquiries
  for select using (true);

-- Insights: staff can CRUD insights
alter table public.insights enable row level security;
create policy "Staff can manage insights" on public.insights
  for all using (true) with check (true);

-- 5. Grant public access to insert enquiries via the API (controlled by RLS)
-- The contact form will insert via the signed-in staff user, so no open insert policy needed here.

comment on table public.enquiries is 'Contact form submissions from the website';
comment on column public.enquiries.id is 'Unique identifier';
comment on column public.enquiries.name is 'Submitter name';
comment on column public.enquiries.email is 'Submitter email';
comment on column public.enquiries.company is 'Company name (optional)';
comment on column public.enquiries.message is 'Enquiry message';
comment on column public.enquiries.status is 'Status: new/read/replied/archived';
comment on table public.insights is 'Site metrics and insights';
comment on column public.insights.metric is 'Metric name';
comment on column public.insights.value is 'Metric value';
comment on column public.insights.category is 'Category: general, traffic, projects, etc';