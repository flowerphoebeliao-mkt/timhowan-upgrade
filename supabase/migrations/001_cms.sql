-- Tim Ho Wan CMS: initial schema (run in Supabase SQL Editor)
-- Never expose service_role keys in browser code.
create extension if not exists pgcrypto;

create table if not exists public.cms_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','publisher','viewer')),
  created_at timestamptz not null default now()
);
alter table public.cms_members enable row level security;

-- No browser can create/promote its own membership.
create policy "read own membership" on public.cms_members
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.cms_has_role(allowed_roles text[])
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.cms_members
    where user_id = (select auth.uid()) and role = any(allowed_roles)
  );
$$;
revoke all on function public.cms_has_role(text[]) from public;
grant execute on function public.cms_has_role(text[]) to authenticated;

create table if not exists public.cms_content (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in (
    'banner','brand_story','news','menu','store','recruitment','contact','site_settings'
  )),
  slug text not null,
  title text not null default '',
  data jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(section,slug)
);
create index if not exists cms_content_public_idx on public.cms_content(section,sort_order)
  where status='published';
alter table public.cms_content enable row level security;

-- Site settings may contain sensitive tracking/configuration: never public.
create policy "public reads published website content" on public.cms_content
  for select to anon, authenticated
  using (status='published' and section <> 'site_settings');
create policy "cms members read editorial content" on public.cms_content
  for select to authenticated using (public.cms_has_role(array['admin','publisher','viewer']));
create policy "editors create content" on public.cms_content
  for insert to authenticated
  with check (public.cms_has_role(array['admin','publisher'])
    and created_by = (select auth.uid()));
create policy "editors update content" on public.cms_content
  for update to authenticated
  using (public.cms_has_role(array['admin','publisher']))
  with check (public.cms_has_role(array['admin','publisher'])
    and updated_by = (select auth.uid()));
create policy "admins delete content" on public.cms_content
  for delete to authenticated using (public.cms_has_role(array['admin']));

create or replace function public.cms_touch_content()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  end if;
  new.updated_by := auth.uid();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published')
    then new.published_at := now();
  elsif new.status <> 'published' then new.published_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists cms_touch_content_trigger on public.cms_content;
create trigger cms_touch_content_trigger before insert or update on public.cms_content
for each row execute function public.cms_touch_content();

-- Bootstrap first admin ONLY via Supabase SQL Editor (trusted operator):
-- insert into public.cms_members(user_id,role)
-- values ('REPLACE_WITH_AUTH_USER_UUID','admin');
-- Do not run this with an arbitrary user ID.

-- Storage policy design is intentionally deferred until bucket visibility,
-- accepted MIME types and upload size limits are confirmed.
