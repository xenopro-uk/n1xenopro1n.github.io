-- Allow users to overwrite their own wallpaper files (needed for upsert)
CREATE POLICY "users update own wallpaper file"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure one wallpaper row per user (so onConflict: 'user_id' works)
ALTER TABLE public.wallpapers
  ADD CONSTRAINT wallpapers_user_id_key UNIQUE (user_id);