-- Game ratings (1-5)
CREATE TABLE public.game_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
ALTER TABLE public.game_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings readable by signed in"
  ON public.game_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own rating"
  ON public.game_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own rating"
  ON public.game_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own rating"
  ON public.game_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER game_ratings_touch
  BEFORE UPDATE ON public.game_ratings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Per-user app icon positions (iPhone-style draggable home screen)
CREATE TABLE public.app_positions (
  user_id uuid NOT NULL,
  app_id text NOT NULL,
  x integer NOT NULL,
  y integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, app_id)
);
ALTER TABLE public.app_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own positions"
  ON public.app_positions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users upsert own positions"
  ON public.app_positions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own positions"
  ON public.app_positions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own positions"
  ON public.app_positions FOR DELETE TO authenticated USING (auth.uid() = user_id);