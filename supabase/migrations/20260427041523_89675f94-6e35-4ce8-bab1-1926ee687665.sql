
drop policy if exists "wallpapers public read" on storage.objects;
create policy "wallpapers read by signed in" on storage.objects
  for select to authenticated using (bucket_id = 'wallpapers');
update storage.buckets set public = false where id = 'wallpapers';
