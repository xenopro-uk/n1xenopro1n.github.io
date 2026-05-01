import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Lock, Mail, ArrowRight, BookOpen, KeyRound } from "lucide-react";
import { setAuthed, checkCreds } from "@/lib/auth-gate";
import { resetPassword } from "@/lib/account";
import { DotCursor } from "@/components/desktop/Cursor";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Northridge Unified — Student Sign-in" },
      { name: "description", content: "District student & staff sign-in portal." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const role = checkCreds(email, password);
    if (!role) { setErr("Invalid student ID or password."); return; }
    setBusy(true);
    setAuthed(role === "dev", false);
    setTimeout(() => navigate({ to: "/loading" }), 250);
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    const { error } = await resetPassword(forgotEmail);
    if (error) toast.error(error.message);
    else toast.success("Reset link sent. Check your email.");
    setForgotOpen(false);
    setForgotEmail("");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground md:grid-cols-2">
      <DotCursor />

      {/* Left brand panel — school theme only */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0a0a0a] p-10 md:flex">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-black">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight leading-none">Northridge Unified</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/40">Student Information System</div>
          </div>
        </div>

        <div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
            Welcome back,<br />
            <span className="text-foreground/40">scholars & staff.</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm text-foreground/50">
            Access classroom resources, attendance, gradebook, library catalog and your school calendar — all in one place.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-foreground/55">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <BookOpen className="mb-2 h-4 w-4 text-foreground/40" />
              <div className="font-medium text-foreground/70">Coursework</div>
              <div className="mt-0.5 text-[10px] text-foreground/40">Assignments · Grades · Syllabus</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <GraduationCap className="mb-2 h-4 w-4 text-foreground/40" />
              <div className="font-medium text-foreground/70">Records</div>
              <div className="mt-0.5 text-[10px] text-foreground/40">Transcripts · Attendance</div>
            </div>
          </div>
        </div>

        <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/30">
          District ID · 2401·NRU — FERPA Secure SSO
        </div>

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
              <span className="text-base font-semibold">Northridge Unified</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-foreground/50">
            Use your student ID or staff email to continue.
          </p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground/70">Student ID or Email</span>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-white/40">
                <Mail className="h-4 w-4 text-foreground/40" />
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  type="text" autoComplete="username" placeholder="student.id"
                  className="flex-1 bg-transparent text-sm outline-none" required />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground/70">Password</span>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-white/40">
                <Lock className="h-4 w-4 text-foreground/40" />
                <input value={password} onChange={(e) => setPassword(e.target.value)}
                  type="password" autoComplete="current-password" placeholder="••••••••••"
                  className="flex-1 bg-transparent text-sm outline-none" required />
              </div>
            </label>

            {err && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>
            )}

            <button type="submit" disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60">
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>

            <div className="flex items-center justify-between text-[11px]">
              <button type="button" onClick={() => setForgotOpen((v) => !v)}
                className="flex items-center gap-1 text-foreground/50 hover:text-foreground">
                <KeyRound className="h-3 w-3" /> Forgot password?
              </button>
            </div>

            {forgotOpen && (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="mb-2 text-[11px] text-foreground/60">
                  Enter the email tied to your account. We'll send a password reset link.
                </div>
                <div className="flex gap-2">
                  <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    type="email" placeholder="you@example.com"
                    className="flex-1 rounded-md bg-white/5 px-2 py-1.5 text-xs outline-none ring-1 ring-white/10 focus:ring-white/30" />
                  <button onClick={sendReset}
                    className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-white/90">
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3 text-[10px] text-foreground/40">
            <div className="h-px flex-1 bg-white/10" />
            <span>SSO · FERPA-compliant</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="mt-6 text-center text-[11px] text-foreground/40">
            Trouble signing in? Contact the front office or your homeroom teacher.
          </p>
        </form>
      </div>
    </div>
  );
}
