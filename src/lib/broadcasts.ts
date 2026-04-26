// Live broadcast hook: listens to the broadcasts table and surfaces banners + toasts.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  style: "banner" | "toast";
  active: boolean;
  created_at: string;
}

const DISMISS_KEY = "xenopro:dismissed-broadcasts";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveDismissed(s: Set<string>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...s]));
}

export function useBroadcasts() {
  const [banners, setBanners] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  useEffect(() => {
    let mounted = true;
    const seenToasts = new Set<string>();

    const apply = (rows: Broadcast[]) => {
      if (!mounted) return;
      setBanners(rows.filter((r) => r.active && r.style === "banner"));
      rows.filter((r) => r.active && r.style === "toast").forEach((r) => {
        if (seenToasts.has(r.id)) return;
        seenToasts.add(r.id);
        toast(r.title, { description: r.body });
      });
    };

    supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { apply((data as Broadcast[]) ?? []); });

    const ch = supabase.channel("broadcasts")
      .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, () => {
        supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(20)
          .then(({ data }) => apply((data as Broadcast[]) ?? []));
      }).subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id);
    setDismissed(next); saveDismissed(next);
  };

  return {
    banners: banners.filter((b) => !dismissed.has(b.id)),
    dismiss,
  };
}
