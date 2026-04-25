import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";

// Local-only messenger for now (no backend). Stores in localStorage.
// Conversations with built-in "personas" so it feels populated.
interface Msg { id: string; from: "me" | "them"; text: string; ts: number; }
interface Chat { id: string; name: string; avatar: string; bio: string; msgs: Msg[]; }

const SEED: Chat[] = [
  { id: "lex", name: "Lex", avatar: "🦊", bio: "Tech buddy", msgs: [
    { id: "1", from: "them", text: "yo, did you see the new build?", ts: Date.now() - 1000 * 60 * 12 },
  ]},
  { id: "nova", name: "Nova", avatar: "🌙", bio: "Music friend", msgs: [
    { id: "1", from: "them", text: "send me your playlist", ts: Date.now() - 1000 * 60 * 60 },
  ]},
  { id: "rio", name: "Rio", avatar: "🎮", bio: "Gaming", msgs: [
    { id: "1", from: "them", text: "1v1 me on krunker", ts: Date.now() - 1000 * 60 * 60 * 3 },
  ]},
];

const KEY = "xenopro:pulse";

const REPLIES = [
  "haha for real", "no way", "send pic", "lemme check", "omw",
  "that's wild", "agreed", "lol", "let's go", "later"
];

export function Messenger() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string>(SEED[0].id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setChats(raw ? JSON.parse(raw) : SEED);
    } catch { setChats(SEED); }
  }, []);

  useEffect(() => {
    if (chats.length) localStorage.setItem(KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeId, chats]);

  const active = chats.find(c => c.id === activeId);

  const send = () => {
    if (!text.trim() || !active) return;
    const newMsg: Msg = { id: crypto.randomUUID(), from: "me", text: text.trim(), ts: Date.now() };
    setChats(cs => cs.map(c => c.id === active.id ? { ...c, msgs: [...c.msgs, newMsg] } : c));
    setText("");
    setTimeout(() => {
      const reply: Msg = { id: crypto.randomUUID(), from: "them", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], ts: Date.now() };
      setChats(cs => cs.map(c => c.id === active.id ? { ...c, msgs: [...c.msgs, reply] } : c));
    }, 700 + Math.random() * 1200);
  };

  const clear = () => {
    if (!active) return;
    setChats(cs => cs.map(c => c.id === active.id ? { ...c, msgs: [] } : c));
  };

  return (
    <div className="flex h-full bg-background/40">
      <aside className="flex w-56 flex-col border-r border-white/10">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <MessageCircle className="h-4 w-4" /> <span className="text-sm font-medium">Pulse</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {chats.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left transition ${activeId === c.id ? "bg-white/10" : "hover:bg-white/5"}`}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg">{c.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="line-clamp-1 text-[10px] text-foreground/50">{c.msgs[c.msgs.length - 1]?.text ?? c.bio}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 p-2 text-[10px] text-foreground/40">
          Local demo. Multi-user chat needs Lovable Cloud.
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        {active && (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">{active.avatar}</span>
              <div>
                <div className="text-sm font-medium">{active.name}</div>
                <div className="text-[10px] text-foreground/50">{active.bio}</div>
              </div>
              <button onClick={clear} className="ml-auto rounded p-1.5 text-foreground/50 hover:bg-white/5"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              <div className="flex flex-col gap-2">
                {active.msgs.map(m => (
                  <div key={m.id} className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "me" ? "ml-auto bg-white text-black" : "bg-white/10 text-foreground"}`}>
                    {m.text}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-white/10 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full bg-white/5 px-4 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <button type="submit" className="rounded-full bg-white p-2 text-black hover:bg-white/90"><Send className="h-4 w-4" /></button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
