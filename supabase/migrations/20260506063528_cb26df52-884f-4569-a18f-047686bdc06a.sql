
-- Harden Realtime: only allow authenticated users to subscribe, and only to chat/broadcast topics.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read allowed realtime topics" ON realtime.messages;
CREATE POLICY "authenticated can read allowed realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'chat:%'
  OR realtime.topic() LIKE 'broadcasts:%'
  OR realtime.topic() LIKE 'public:chat_messages%'
  OR realtime.topic() LIKE 'public:chat_rooms%'
  OR realtime.topic() LIKE 'public:chat_room_members%'
  OR realtime.topic() LIKE 'public:broadcasts%'
);
