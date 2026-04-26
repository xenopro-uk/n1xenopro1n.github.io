import { useEffect, useState } from "react";
import { Megaphone, Ban, Trash2, Send, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { isDevGate } from "@/lib/auth-gate";
import { toast } from "sonner";

interface BroadcastRow {
  id: string; title: string; body: string;
  style: "banner" | "toast"; active: boolean; created_at: string;
}
interface BanRow { id: string; user_id: string; reason: string | null; created_at: string; }
interface ProfileLite { user_id: string; display_name: string | null; }

export function AdminPanel() {
  const { isAdmin, user } = useAccount();
  const devGate = typeof window !== "undefined" && isDevGate();
  // The hardcoded dev gate alone unlocks the panel UI, but DB writes still need a
  // signed-in admin account. Show a hint if they're on the gate without an account.
  const hasDbWrite = isAdmin;

  const [tab, setTab] = useState<"broadcast" | "users">("broadcast");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [style, setStyle] = useState<"banner" | "toast">("banner");
  const [sending, setSending] = useState(false);
  const [list, setList] = useState<BroadcastRow[]>([]);
  const [users, setUsers] = useState<ProfileLite[]>([]);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [banReason, setBanReason] = useState("");

  useEffect(() => { void refresh(); }, [user, isAdmin]);

  const refresh = async () => {
    const [b, p, ba] = await Promise.all([
      supabase.from("broadcasts").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("user_id, display_name").order("created_at", { ascending: false }).limit(100),
      supabase.from("bans").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setList((b.data as BroadcastRow[]) ?? []);
    setUsers((p.data as ProfileLite[]) ?? []);
    setBans((ba.data as BanRow[]) ?? []);
  };

  const send = async () => {
    if (!hasDbWrite || !user) { toast.error("Sign in with the dev Cloud account to publish."); return; }
    if (!title || !body) { toast.error("Title and body required"); return; }
    setSending(true);
    const { error } = await supabase.from("broadcasts").insert({ title, body, style, author_id: user.id });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setTitle(""); setBody("");
    toast.success("Broadcast sent");
    refresh();
  };

  const toggle = async (b: BroadcastRow) => {
    await supabase.from("broadcasts").update({ active: !b.active }).eq("id", b.id);
    refresh();
  };
  const remove = async (b: BroadcastRow) => {
    await supabase.from("broadcasts").delete().eq("id", b.id);
    refresh();
  };

  const ban = async (uid: string) => {
    if (!hasDbWrite || !user) { toast.error("Sign in with the dev Cloud account to ban."); return; }
    const { error } = await supabase.from("bans").insert({ user_id: uid, reason: banReason || null, banned_by: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("User banned");
    setBanReason(""); refresh();
  };
  const unban = async (uid: string) => {
    await supabase.from("bans").delete().eq("user_id", uid);
    refresh();
  };

  if (!devGate && !isAdmin) {
    return <div className="p-8 text-center text-sm text-foreground/50">Admin access only.</div>;
  }

  return (
    <div className="flex h-full flex-col bg-background/40 text-foreground">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">Dev Panel</span>
        {!hasDbWrite && (
          <span className="ml-auto rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-300 ring-1 ring-yellow-500/20">
            Sign in with the dev account in the menu bar to publish
          </span>
        )}
      </div>

      <div className="flex gap-1 border-b border-white/10 px-3 py-1.5">
        {(["broadcast", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-xs capitalize transition ${
              tab === t ? "bg-white text-black" : "text-foreground/60 hover:bg-white/5"}`}>
            {t === "broadcast" ? "Broadcasts" : "Users / Bans"}
          </button>
        ))}
      </div>

      {tab === "broadcast" && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Megaphone className="h-4 w-4" /> New global message
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
              className="mb-2 w-full rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={3}
              className="mb-2 w-full resize-none rounded-md bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
            <div className="flex items-center gap-2">
              <select value={style} onChange={(e) => setStyle(e.target.value as "banner" | "toast")}
                className="rounded-md bg-white/5 px-2 py-1.5 text-xs ring-1 ring-white/10">
                <option value="banner">Banner (sticky top)</option>
                <option value="toast">Toast (popup)</option>
              </select>
              <button onClick={send} disabled={sending}
                className="ml-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-white/90 disabled:opacity-60">
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Publish
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {list.map((b) => (
              <div key={b.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">{b.style}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${b.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-foreground/40"}`}>
                      {b.active ? "live" : "off"}
                    </span>
                    <span className="font-medium">{b.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-foreground/60">{b.body}</div>
                </div>
                <button onClick={() => toggle(b)} className="rounded px-2 py-1 text-[10px] text-foreground/60 hover:bg-white/5">
                  {b.active ? "Hide" : "Show"}
                </button>
                <button onClick={() => remove(b)} className="rounded p-1 text-red-400/70 hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {list.length === 0 && <div className="py-8 text-center text-xs text-foreground/40">No messages yet.</div>}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Optional ban reason (used for next ban)…"
            className="mb-3 w-full rounded-md bg-white/5 px-3 py-2 text-xs outline-none ring-1 ring-white/10" />
          <div className="space-y-1.5">
            {users.map((u) => {
              const banned = bans.find((b) => b.user_id === u.user_id);
              return (
                <div key={u.user_id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                  <span className="flex-1 truncate font-mono">{u.display_name || u.user_id.slice(0, 8)}</span>
                  {banned && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300">banned</span>}
                  {banned ? (
                    <button onClick={() => unban(u.user_id)} className="rounded bg-white/5 px-2 py-1 text-[10px] hover:bg-white/10">Unban</button>
                  ) : (
                    <button onClick={() => ban(u.user_id)} className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20">
                      <Ban className="h-3 w-3" /> Ban
                    </button>
                  )}
                </div>
              );
            })}
            {users.length === 0 && <div className="py-8 text-center text-xs text-foreground/40">No users have signed up yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
