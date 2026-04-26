// Tiny client-side gate (intentionally fake — for the "school login" theme).
const KEY = "xenopro:auth";
export const VALID_EMAIL = "xenopro";
export const VALID_PASSWORD = "xenobestwebsite";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "ok";
}

export function setAuthed() {
  sessionStorage.setItem(KEY, "ok");
}

export function clearAuthed() {
  sessionStorage.removeItem(KEY);
}
