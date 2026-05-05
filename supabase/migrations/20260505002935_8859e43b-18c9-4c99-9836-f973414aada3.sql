CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'private',
  invite_code text UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_rooms_kind_valid CHECK (kind IN ('global', 'private')),
  CONSTRAINT chat_rooms_private_code_valid CHECK (kind = 'global' OR invite_code ~ '^[0-9]{8}[A-Z]$')
);

CREATE TABLE IF NOT EXISTS public.chat_room_members (
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_room_created_idx ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_room_members_user_idx ON public.chat_room_members(user_id);

INSERT INTO public.chat_rooms (id, name, kind, invite_code, created_by)
VALUES ('00000000-0000-0000-0000-000000000001', 'Global Chat', 'global', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can see accessible chat rooms" ON public.chat_rooms;
CREATE POLICY "users can see accessible chat rooms"
ON public.chat_rooms FOR SELECT TO authenticated
USING (
  kind = 'global'
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members m
    WHERE m.room_id = chat_rooms.id AND m.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "users can create private chat rooms" ON public.chat_rooms;
CREATE POLICY "users can create private chat rooms"
ON public.chat_rooms FOR INSERT TO authenticated
WITH CHECK (kind = 'private' AND created_by = auth.uid());

DROP POLICY IF EXISTS "room creators can rename rooms" ON public.chat_rooms;
CREATE POLICY "room creators can rename rooms"
ON public.chat_rooms FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "members can see room members" ON public.chat_room_members;
CREATE POLICY "members can see room members"
ON public.chat_room_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members mine
    WHERE mine.room_id = chat_room_members.room_id AND mine.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = chat_room_members.room_id AND r.kind = 'global'
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "users can join rooms as themselves" ON public.chat_room_members;
CREATE POLICY "users can join rooms as themselves"
ON public.chat_room_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users can leave own chat rooms" ON public.chat_room_members;
CREATE POLICY "users can leave own chat rooms"
ON public.chat_room_members FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "users can read accessible chat messages" ON public.chat_messages;
CREATE POLICY "users can read accessible chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = chat_messages.room_id AND r.kind = 'global'
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members m
    WHERE m.room_id = chat_messages.room_id AND m.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "users can send accessible chat messages" ON public.chat_messages;
CREATE POLICY "users can send accessible chat messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.chat_rooms r
      WHERE r.id = room_id AND r.kind = 'global'
    )
    OR EXISTS (
      SELECT 1 FROM public.chat_room_members m
      WHERE m.room_id = room_id AND m.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "users can delete own chat messages" ON public.chat_messages;
CREATE POLICY "users can delete own chat messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.create_private_chat_room(_name text DEFAULT 'Private Chat')
RETURNS public.chat_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  room public.chat_rooms;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  LOOP
    code := lpad(floor(random() * 100000000)::text, 8, '0') || chr(65 + floor(random() * 26)::int);
    BEGIN
      INSERT INTO public.chat_rooms (name, kind, invite_code, created_by)
      VALUES (coalesce(nullif(trim(_name), ''), 'Private Chat'), 'private', code, auth.uid())
      RETURNING * INTO room;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
    END;
  END LOOP;

  INSERT INTO public.chat_room_members (room_id, user_id)
  VALUES (room.id, auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN room;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_private_chat_room(_invite_code text)
RETURNS public.chat_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room public.chat_rooms;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT * INTO room
  FROM public.chat_rooms
  WHERE kind = 'private' AND invite_code = upper(trim(_invite_code));

  IF room.id IS NULL THEN
    RAISE EXCEPTION 'Room code not found';
  END IF;

  INSERT INTO public.chat_room_members (room_id, user_id)
  VALUES (room.id, auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN room;
END;
$$;

DROP TRIGGER IF EXISTS chat_rooms_touch ON public.chat_rooms;
CREATE TRIGGER chat_rooms_touch
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_members;