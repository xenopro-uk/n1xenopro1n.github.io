// Lightweight client-side activity logger.
// Records every meaningful user action to the activity_log table for
// admin surveillance. Fails silently — never blocks UX.
import { supabase } from "@/integrations/supabase/client";

let cachedDisplayName: string | null = null;
let cachedUserId: string | null = null;

async function ensureIdentity(): Promise<{ id: string; name: string | null } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (cachedUserId !== user.id) {
    cachedUserId = user.id;
    const { data: prof } = await supabase
      .from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    cachedDisplayName = prof?.display_name ?? user.email?.split("@")[0] ?? null;
  }
  return { id: user.id, name: cachedDisplayName };
}

export async function logActivity(
  action: string,
  target?: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    const id = await ensureIdentity();
    if (!id) return;
    await supabase.from("activity_log").insert({
      user_id: id.id,
      display_name: id.name,
      action,
      target: target ?? null,
      details,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    });
  } catch {
    /* swallow — surveillance must never break UX */
  }
}
