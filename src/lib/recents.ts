// Loads recent listening + recent watch history for the account chip.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

export interface RecentSong { track_id: string; track_name: string; artist_name: string; artwork_url: string | null }
export interface RecentWatch { media_id: string; title: string; poster: string | null; media_type: string; watched_at: string }

export function useRecents() {
  const { user } = useAccount();
  const [songs, setSongs] = useState<RecentSong[]>([]);
  const [watches, setWatches] = useState<RecentWatch[]>([]);

  useEffect(() => {
    if (!user) { setSongs([]); setWatches([]); return; }
    let alive = true;
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from("saved_songs")
          .select("track_id,track_name,artist_name,artwork_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("recently_watched")
          .select("media_id,title,poster,media_type,watched_at")
          .eq("user_id", user.id)
          .order("watched_at", { ascending: false })
          .limit(8),
      ]);
      if (!alive) return;
      setSongs((a.data ?? []) as RecentSong[]);
      setWatches((b.data ?? []) as RecentWatch[]);
    })();
    return () => { alive = false; };
  }, [user]);

  return { songs, watches };
}
