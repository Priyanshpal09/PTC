/* ============================================================
   PTC — Enquiries + Insights tables
   Paste this into Supabase dashboard → SQL Editor → Run.
   Safe to run more than once (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
   ============================================================ */

/* ---------- enquiries: contact-form submissions ---------- */
create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  company    text not null default '',
  message    text not null,
  status     text not null default 'new'
             check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

grant usage on schema public to anon, authenticated;
grant insert, select on public.enquiries to anon, authenticated;
grant update, delete on public.enquiries to authenticated;

drop policy if exists enquiries_public_insert on public.enquiries;
create policy enquiries_public_insert on public.enquiries
  for insert to anon, authenticated with check (true);

drop policy if exists enquiries_staff_read on public.enquiries;
create policy enquiries_staff_read on public.enquiries
  for select to anon, authenticated using (true);

drop policy if exists enquiries_staff_write on public.enquiries;
create policy enquiries_staff_write on public.enquiries
  for update to authenticated using (true) with check (true);

drop policy if exists enquiries_staff_delete on public.enquiries;
create policy enquiries_staff_delete on public.enquiries
  for delete to authenticated using (true);

/* ---------- insights: metrics shown in the console ---------- */
create table if not exists public.insights (
  id         uuid primary key default gen_random_uuid(),
  metric     text not null,
  value      text not null,
  category   text not null default 'general',
  created_at timestamptz not null default now()
);

alter table public.insights enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.insights to anon, authenticated;
grant insert, update, delete on public.insights to authenticated;

drop policy if exists insights_staff_read on public.insights;
create policy insights_staff_read on public.insights
  for select to anon, authenticated using (true);

drop policy if exists insights_staff_write on public.insights;
create policy insights_staff_write on public.insights
  for all to authenticated using (true) with check (true);

/* ---------- optional sample insights ---------- */
insert into public.insights (metric, value, category)
select v.metric, v.value, v.category
from (values
  ('Projects delivered', '1,250+', 'practice'),
  ('Featured projects', '50', 'content'),
  ('Index entries', '174', 'content'),
  ('Photographs', '123', 'content')
) as v(metric, value, category)
where not exists (select 1 from public.insights);
