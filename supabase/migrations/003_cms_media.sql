-- Run in timhowan-cms2 SQL Editor before uploading images from the original CMS.
-- Public bucket is intentional: website visitors need to read published images.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('cms-media','cms-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "cms media editor upload" on storage.objects;
create policy "cms media editor upload" on storage.objects
for insert to authenticated with check (
 bucket_id='cms-media'
 and public.cms_has_role(array['admin','publisher'])
 and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "cms media editor update" on storage.objects;
create policy "cms media editor update" on storage.objects
for update to authenticated
using (bucket_id='cms-media' and public.cms_has_role(array['admin','publisher'])
 and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id='cms-media' and public.cms_has_role(array['admin','publisher'])
 and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "cms media admin delete" on storage.objects;
create policy "cms media admin delete" on storage.objects
for delete to authenticated using (
 bucket_id='cms-media' and public.cms_has_role(array['admin'])
);
