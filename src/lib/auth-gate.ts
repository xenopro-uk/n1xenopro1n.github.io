// Tiny client-side gate (school-style fake login).
// Two valid sets of creds:
//   1. Student demo:  xenopro / xenobestwebsite
//   2. Dev override:  xenoprosites@krisgmail.com / xenoysenpai12290himbest
// The dev set also flags the session as "dev" so the admin panel unlocks.
const KEY = "xenopro:auth";
const DEV_KEY = "xenopro:dev";

export const STUDENT_EMAIL = "xenopro";
export const STUDENT_PASSWORD = "xenobestwebsite";

export const DEV_EMAIL = "xenoprosites@krisgmail.com";
export const DEV_PASSWORD = "xenoysenpai12290himbest";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "ok";
}

export function isDevGate(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEV_KEY) === "ok";
}

export function setAuthed(dev = false) {
  sessionStorage.setItem(KEY, "ok");
  if (dev) sessionStorage.setItem(DEV_KEY, "ok");
}

export function clearAuthed() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(DEV_KEY);
}

/** Validate creds. Returns "dev" | "student" | null. */
export function checkCreds(email: string, password: string): "dev" | "student" | null {
  const e = email.trim().toLowerCase();
  if (e === DEV_EMAIL && password === DEV_PASSWORD) return "dev";
  if (e === STUDENT_EMAIL.toLowerCase() && password === STUDENT_PASSWORD) return "student";
  return null;
}
