import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DotCursor } from "@/components/desktop/Cursor";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: "Reset password" }, { name: "description", content: "Set a new password for your account." }],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery session in the URL hash. Listen for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { toast.error("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <DotCursor />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-black">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold leading-tight">Reset password</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">XenoPro account</div>
          </div>
        </div>

        {!ready && (
          <div className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Open this page from the password reset link in your email.
          </div>
        )}

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-medium text-foreground/70">New password</span>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-white/40">
            <Lock className="h-4 w-4 text-foreground/40" />
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              minLength={6} required className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-foreground/70">Confirm password</span>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-white/40">
            <Lock className="h-4 w-4 text-foreground/40" />
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
              minLength={6} required className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </label>

        <button type="submit" disabled={busy || !ready}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60">
          {busy ? "Updating…" : "Update password"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}
