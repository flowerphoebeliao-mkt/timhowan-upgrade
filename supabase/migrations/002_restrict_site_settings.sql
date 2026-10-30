-- Apply in Supabase SQL Editor after 001_cms.sql.
-- Restrict site_settings to admins at database level (not just browser UI).
drop policy if exists "cms members read editorial content" on public.cms_content;
create policy "cms members read editorial content" on public.cms_content
for select to authenticated using (
  public.cms_has_role(array['admin','publisher','viewer'])
  and (section <> 'site_settings' or public.cms_has_role(array['admin']))
);
drop policy if exists "editors create content" on public.cms_content;
create policy "editors create content" on public.cms_content
for insert to authenticated with check (
  public.cms_has_role(array['admin','publisher'])
  and (section <> 'site_settings' or public.cms_has_role(array['admin']))
  and created_by = (select auth.uid())
);
drop policy if exists "editors update content" on public.cms_content;
create policy "editors update content" on public.cms_content
for update to authenticated
using (
  public.cms_has_role(array['admin','publisher'])
  and (section <> 'site_settings' or public.cms_has_role(array['admin']))
)
with check (
  public.cms_has_role(array['admin','publisher'])
  and (section <> 'site_settings' or public.cms_has_role(array['admin']))
  and updated_by = (select auth.uid())
);
