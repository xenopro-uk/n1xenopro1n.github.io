// Optional Lovable Cloud account layer (real signup/signin so users can save settings,
// post broadcasts / ban users, and log AI conversations).
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  cursor_color: string | null;
  cloak_title: string | null;
  cloak_icon: string | null;
}

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); setIsAdmin(false); return; }
    (async () => {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      setProfile(p as Profile | null);
      setIsAdmin(!!roles?.some((r: { role: string }) => r.role === "admin"));
    })();
  }, [user]);

  return { user, profile, isAdmin, loading };
}

export async function signUp(email: string, password: string, displayName: string) {
  const redirectTo = `${window.location.origin}/`;
  return supabase.auth.signUp({
    email, password,
    options: { emailRedirectTo: redirectTo, data: { display_name: displayName } },
  });
}
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signOut() {
  return supabase.auth.signOut();
}
export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}
