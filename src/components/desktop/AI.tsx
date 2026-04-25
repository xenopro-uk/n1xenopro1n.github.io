import { useRef, useState } from "react";
import { Sparkles, Send, User, Bot } from "lucide-react";

interface Msg { role: "user" | "ai"; text: string }

// Pollinations.ai — free, no API key required, OpenAI-compatible-ish text endpoint.
// https://text.pollinations.ai/{prompt}
async function ask(prompt: string): Promise<string> {
  const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
  if (!r.ok) throw new Error("AI request failed");
  return await r.text();
}

export function AI() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hi — I'm Xeno AI. Ask me anything. Powered by a free public model." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const reply = await ask(q);
      setMsgs((m) => [...m, { role: "ai", text: reply }]);
    } catch (err: any) {
      setMsgs((m) => [...m, { role: "ai", text: "Sorry, I couldn't reach the model. Try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">Xeno AI</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-foreground/40">Free · Public model</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-primary/20" : "bg-accent/20"}`}>
                {m.role === "user" ? <User className="h-3.5 w-3.5 text-primary" /> : <Bot className="h-3.5 w-3.5 text-accent" />}
              </div>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary/15 text-foreground" : "glass text-foreground/90"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-xs text-foreground/40">Thinking…</div>}
          <div ref={endRef} />
        </div>
      </div>
      <form onSubmit={send} className="border-t border-white/10 p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10 focus-within:ring-primary/60">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Xeno AI…"
            className="flex-1 bg-transparent text-sm outline-none"
            disabled={busy}
          />
          <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-primary p-1.5 text-primary-foreground disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
