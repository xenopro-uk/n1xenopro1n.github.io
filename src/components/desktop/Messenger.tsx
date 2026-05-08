// Xeno's Messenger — iMessage-style UI.
// - Global chat by default
// - Private rooms via 8-digit + 1 letter invite codes
// - Realtime updates via Supabase Realtime
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Plus, Hash, Lock, ArrowLeft, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/account";
import { toast } from "sonner";

const GLOBAL_ROOM_ID = "00000000-0000-0000-0000-000000000001";

interface Room { id: string; name: string; kind: "global" | "private"; invite_code: string | null; created_by: string | null }
interface Message { id: string; room_id: string; sender_id: string; sender_name: string | null; body: string; created_at: string }

function genInviteCode() {
  const digits = String(Math.floor(10000000 + Math.random() * 90000000));
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return digits + letter;
}

export function Messenger() {
  const { user } = useAccount();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeId, setActiveId] = useState<string>(GLOBAL_ROOM_ID);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newName, setNewName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const myName = user?.email?.split("@")[0] ?? "anon";

  const loadRooms = async () => {
    const { data } = await supabase.from("chat_rooms").select("id,name,kind,invite_code,created_by");
    if (data) setRooms(data as Room[]);
  };

  useEffect(() => { void loadRooms(); }, [user]);

  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    (async () => {
      const { data } = await supabase.from("chat_messages")
        .select("*").eq("room_id", activeId)
        .order("created_at", { ascending: true }).limit(200);
      if (alive && data) setMessages(data as Message[]);
    })();

    const ch = supabase
      .channel(`chat:${activeId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${activeId}` },
        (payload) => setMessages((m) => [...m, payload.new as Message]))
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !user) return;
    setDraft("");
    const { error } = await supabase.from("chat_messages").insert({
      room_id: activeId, sender_id: user.id, sender_name: myName, body,
    });
    if (error) toast.error(error.message);
  };

  const createPrivate = async () => {
    if (!user) return;
    const name = newName.trim() || "Private chat";
    const code = genInviteCode();
    const { data, error } = await supabase.from("chat_rooms").insert({
      name, kind: "private", invite_code: code, created_by: user.id,
    }).select().single();
    if (error || !data) return toast.error(error?.message || "Failed");
    await supabase.from("chat_room_members").insert({ room_id: data.id, user_id: user.id });
    toast.success(`Room created · code ${code}`);
    setNewName("");
    await loadRooms();
    setActiveId(data.id);
  };

  const joinRoom = async () => {
    if (!user) return;
    const code = joinCode.trim().toUpperCase();
    if (!/^\d{8}[A-Z]$/.test(code)) return toast.error("Code must be 8 digits + 1 letter");
    const { data: room } = await supabase.from("chat_rooms").select("id").eq("invite_code", code).maybeSingle();
    if (!room) return toast.error("Room not found");
    await supabase.from("chat_room_members").insert({ room_id: room.id, user_id: user.id });
    setJoinCode(""); setShowJoin(false);
    await loadRooms();
    setActiveId(room.id);
  };

  const active = useMemo(() => rooms.find((r) => r.id === activeId), [rooms, activeId]);

  const grouped = useMemo(() => {
    // group adjacent messages by same sender
    const groups: { sender_id: string; sender_name: string; items: Message[] }[] = [];
    for (const m of messages) {
      const last = groups[groups.length - 1];
      if (last && last.sender_id === m.sender_id) last.items.push(m);
      else groups.push({ sender_id: m.sender_id, sender_name: m.sender_name || "anon", items: [m] });
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex h-full bg-[#0b0b0c] text-white">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="flex w-64 flex-col border-r border-white/10 bg-black/40">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold">Messages</h2>
            <button onClick={() => setShowJoin((v) => !v)}
              className="rounded-full bg-white/10 p-1 hover:bg-white/20"><Plus className="h-3.5 w-3.5" /></button>
          </div>

          {showJoin && (
            <div className="space-y-2 border-y border-white/5 bg-white/[0.02] p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/40">New private room</div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Room name" className="w-full rounded-md bg-white/5 px-2 py-1.5 text-xs outline-none" />
              <button onClick={() => void createPrivate()}
                className="w-full rounded-md bg-blue-500 py-1.5 text-xs font-medium hover:bg-blue-400">
                Create + get code
              </button>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Join with code</div>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="12345678A" maxLength={9}
                className="w-full rounded-md bg-white/5 px-2 py-1.5 text-xs outline-none" />
              <button onClick={() => void joinRoom()}
                className="w-full rounded-md bg-white/10 py-1.5 text-xs hover:bg-white/15">Join room</button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {rooms.map((r) => (
              <button key={r.id} onClick={() => setActiveId(r.id)}
                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition ${activeId === r.id ? "bg-white/10" : "hover:bg-white/5"}`}>
                <div className={`grid h-9 w-9 place-items-center rounded-full ${r.kind === "global" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"}`}>
                  {r.kind === "global" ? <Hash className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{r.name}</div>
                  <div className="truncate text-[10px] text-white/40">
                    {r.kind === "global" ? "Everyone" : r.invite_code ? `Code ${r.invite_code}` : "Private"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Conversation */}
      <main className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur">
          <button onClick={() => setShowSidebar((v) => !v)}
            className="rounded-md p-1 text-white/60 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex-1">
            <div className="text-sm font-semibold">{active?.name ?? "Chat"}</div>
            <div className="text-[10px] text-white/40">
              {active?.kind === "global" ? "Global · everyone signed in" : "Private room"}
            </div>
          </div>
          {active?.invite_code && (
            <button onClick={async () => {
                await navigator.clipboard.writeText(active.invite_code!);
                setCopied(true); setTimeout(() => setCopied(false), 1200);
              }}
              className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] font-mono ring-1 ring-white/10 hover:bg-white/10">
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {active.invite_code}
            </button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin px-4 py-4">
          {grouped.map((g, gi) => {
            const mine = g.sender_id === user?.id;
            return (
              <div key={gi} className={`flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                {!mine && <div className="px-3 text-[10px] text-white/40">{g.sender_name}</div>}
                {g.items.map((m, i) => {
                  const isLast = i === g.items.length - 1;
                  return (
                    <div key={m.id}
                      className={`max-w-[70%] break-words rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
                        mine
                          ? `bg-gradient-to-br from-[#0a84ff] to-[#0066cc] text-white ${isLast ? "rounded-br-sm" : ""}`
                          : `bg-[#1f1f22] text-white ${isLast ? "rounded-bl-sm" : ""}`
                      }`}>
                      {m.body}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-xs text-white/30">No messages yet — say hi 👋</div>
          )}
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 bg-black/60 p-3">
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="iMessage" disabled={!user}
            className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-blue-400/50" />
          <button type="submit" disabled={!draft.trim() || !user}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#0a84ff] text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-30 hover:bg-[#1a8eff]">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </main>
    </div>
  );
}
