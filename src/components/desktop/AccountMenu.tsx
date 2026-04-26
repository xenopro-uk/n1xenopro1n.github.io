import { useState } from "react";
import { User as UserIcon, LogIn, LogOut, UserPlus, Loader2 } from "lucide-react";
import { useAccount, signIn, signUp, signOut } from "@/lib/account";
import { toast } from "sonner";

export function AccountMenu() {
  const { user, profile, isAdmin } = useAccount();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name || email.split("@")[0]);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(mode === "signin" ? "Signed in" : "Account created");
    setOpen(false); setEmail(""); setPassword(""); setName("");
  };

  const display = profile?.display_name || user?.email?.split("@")[0] || "Guest";

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-foreground/70 ring-1 ring-white/10 hover:bg-white/10">
        <UserIcon className="h-3 w-3" />
        {user ? display : "Account"}
        {isAdmin && <span className="rounded bg-white px-1 py-0.5 text-[9px] font-bold text-black">DEV</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-black/90 p-3 backdrop-blur-xl">
          {user ? (
            <div>
              <div className="mb-1 text-sm font-medium">{display}</div>
              <div className="mb-3 truncate text-[10px] text-foreground/40">{user.email}</div>
              <button onClick={async () => { await signOut(); toast.success("Signed out"); setOpen(false); }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-white/5 py-2 text-xs hover:bg-white/10">
                <LogOut className="h-3 w-3" /> Sign out of account
              </button>
              <p className="mt-2 text-[10px] text-foreground/40">
                Your settings (cursor color, cloak) are saved across devices.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <div className="flex gap-1 rounded-md bg-white/5 p-0.5 text-[11px]">
                {(["signin", "signup"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={`flex-1 rounded py-1 transition ${mode === m ? "bg-white text-black" : "text-foreground/60"}`}>
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              {mode === "signup" && (
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name"
                  className="w-full rounded-md bg-white/5 px-2 py-1.5 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30" />
              )}
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required
                className="w-full rounded-md bg-white/5 px-2 py-1.5 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required minLength={6}
                className="w-full rounded-md bg-white/5 px-2 py-1.5 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <button type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-white py-1.5 text-xs font-medium text-black hover:bg-white/90 disabled:opacity-60">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> :
                  mode === "signin" ? <LogIn className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
              <p className="text-[10px] text-foreground/40">
                Optional. Saves your cursor & cloak settings across devices.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
