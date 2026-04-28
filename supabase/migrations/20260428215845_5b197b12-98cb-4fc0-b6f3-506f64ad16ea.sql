-- Saved/liked songs for the music app
CREATE TABLE IF NOT EXISTS public.saved_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  track_id text NOT NULL,
  track_name text NOT NULL,
  artist_name text NOT NULL,
  artwork_url text,
  preview_url text NOT NULL,
  collection_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

ALTER TABLE public.saved_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own saved songs" ON public.saved_songs
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "users insert own saved songs" ON public.saved_songs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own saved songs" ON public.saved_songs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_songs_user ON public.saved_songs(user_id, created_at DESC);