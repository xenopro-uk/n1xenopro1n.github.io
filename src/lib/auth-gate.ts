// School-style entry gate. Three valid sets of creds:
//   1. Student demo:  xenopro / xenobestwebsite
//   2. Dev override:  xenoprosites@krisgmail.com / xenoysenpai12290himbest
//   3. Guest:         no creds — auto-granted "guest" mode after the gate is unlocked once
const KEY = "xenopro:auth";
const DEV_KEY = "xenopro:dev";
const GUEST_KEY = "xenopro:guest";

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

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GUEST_KEY) === "ok";
}

export function setAuthed(dev = false, guest = false) {
  sessionStorage.setItem(KEY, "ok");
  if (dev) sessionStorage.setItem(DEV_KEY, "ok");
  if (guest) sessionStorage.setItem(GUEST_KEY, "ok");
  else sessionStorage.removeItem(GUEST_KEY);
}

export function clearAuthed() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(DEV_KEY);
  sessionStorage.removeItem(GUEST_KEY);
}

/** Validate creds. Returns "dev" | "student" | null. */
export function checkCreds(email: string, password: string): "dev" | "student" | null {
  const e = email.trim().toLowerCase();
  if (e === DEV_EMAIL && password === DEV_PASSWORD) return "dev";
  if (e === STUDENT_EMAIL.toLowerCase() && password === STUDENT_PASSWORD) return "student";
  return null;
}
