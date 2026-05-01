// Persists per-user app icon positions on the home screen.
// Falls back to localStorage for unsigned users.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";

export interface AppPos { x: number; y: number }
export type AppPositions = Record<string, AppPos>;

const LS_KEY = "xenopro:app-positions";

function readLocal(): AppPositions {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function writeLocal(p: AppPositions) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

export function useAppPositions() {
  const { user } = useAccount();
  const [positions, setPositions] = useState<AppPositions>(() => readLocal());
  const debounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("app_positions").select("app_id,x,y").eq("user_id", user.id);
      if (data && data.length) {
        const next: AppPositions = {};
        for (const r of data) next[r.app_id as string] = { x: r.x as number, y: r.y as number };
        setPositions((prev) => ({ ...prev, ...next }));
        writeLocal({ ...readLocal(), ...next });
      }
    })();
  }, [user]);

  const setPosition = useCallback((appId: string, pos: AppPos) => {
    setPositions((prev) => {
      const next = { ...prev, [appId]: pos };
      writeLocal(next);
      return next;
    });
    if (!user) return;
    if (debounce.current[appId]) clearTimeout(debounce.current[appId]);
    debounce.current[appId] = setTimeout(() => {
      void supabase.from("app_positions").upsert(
        { user_id: user.id, app_id: appId, x: pos.x, y: pos.y, updated_at: new Date().toISOString() },
        { onConflict: "user_id,app_id" },
      );
    }, 400);
  }, [user]);

  return { positions, setPosition };
}
