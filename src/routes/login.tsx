import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Lock, Mail, ArrowRight } from "lucide-react";
import { setAuthed, VALID_EMAIL, VALID_PASSWORD } from "@/lib/auth-gate";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — XenoPro" },
      { name: "description", content: "Sign in to access XenoPro." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (email.trim().toLowerCase() !== VALID_EMAIL || password !== VALID_PASSWORD) {
      setErr("Invalid email or password.");
      return;
    }
    setBusy(true);
    setAuthed();
    setTimeout(() => navigate({ to: "/loading" }), 300);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground md:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0a0a0a] p-10 md:flex">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-black">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">XenoPro Portal</span>
        </div>

        <div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
            Welcome back.<br />
            <span className="text-foreground/40">Sign in to continue.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm text-foreground/50">
            Your district account unlocks the full XenoPro suite — proxy, arcade, cinema, AI, and more.
          </p>
        </div>

        <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/30">
          District ID · 2401·XP — Secure SSO
        </div>

        {/* mono haze */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-white text-black">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold">XenoPro Portal</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-foreground/50">
            Use your XenoPro account to continue.
          </p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground/70">Email or Username</span>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-white/40">
                <Mail className="h-4 w-4 text-foreground/40" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="text"
                  autoComplete="username"
                  placeholder="xenopro"
                  className="flex-1 bg-transparent text-sm outline-none"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground/70">Password</span>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-white/40">
                <Lock className="h-4 w-4 text-foreground/40" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="flex-1 bg-transparent text-sm outline-none"
                  required
                />
              </div>
            </label>

            {err && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-[10px] text-foreground/40">
            <div className="h-px flex-1 bg-white/10" />
            <span>SSO · FERPA-compliant</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="mt-6 text-center text-[11px] text-foreground/40">
            Need help? Contact your XenoPro administrator.
          </p>
        </form>
      </div>
    </div>
  );
}
