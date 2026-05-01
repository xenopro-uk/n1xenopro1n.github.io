// Heartbeat presence + online users count.
// Updates `presence.last_seen` every 30s while user is signed in,
// and exposes a count of users seen in the last 90s.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

export function usePresenceHeartbeat() {
  const { user, profile } = useAccount();
  useEffect(() => {
    if (!user) return;
    const beat = async () => {
      await supabase.from("presence").upsert(
        { user_id: user.id, display_name: profile?.display_name ?? user.email?.split("@")[0] ?? null, last_seen: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    };
    void beat();
    const id = setInterval(beat, 30_000);
    return () => clearInterval(id);
  }, [user, profile]);
}

export function useOnlineCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const cutoff = new Date(Date.now() - 90_000).toISOString();
      const { count: c } = await supabase
        .from("presence")
        .select("user_id", { count: "exact", head: true })
        .gte("last_seen", cutoff);
      if (alive) setCount(c ?? 0);
    };
    void load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return count;
}
