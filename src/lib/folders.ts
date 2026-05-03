// Folder support for the home screen — stored in localStorage per user.
import { useCallback, useEffect, useState } from "react";

export interface Folder { id: string; name: string; appIds: string[]; x: number; y: number }
const KEY = "xenopro:folders";

function read(): Folder[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(f: Folder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(f));
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>(() => read());
  useEffect(() => { write(folders); }, [folders]);

  const createFolder = useCallback((appIds: string[], x: number, y: number) => {
    const id = `folder-${Date.now()}`;
    setFolders((p) => [...p, { id, name: "New Folder", appIds, x, y }]);
    return id;
  }, []);
  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
  }, []);
  const moveFolder = useCallback((id: string, x: number, y: number) => {
    setFolders((p) => p.map((f) => (f.id === id ? { ...f, x, y } : f)));
  }, []);
  const removeFromFolder = useCallback((folderId: string, appId: string) => {
    setFolders((p) => p
      .map((f) => (f.id === folderId ? { ...f, appIds: f.appIds.filter((a) => a !== appId) } : f))
      .filter((f) => f.appIds.length > 0));
  }, []);
  const addToFolder = useCallback((folderId: string, appId: string) => {
    setFolders((p) => p.map((f) =>
      f.id === folderId && !f.appIds.includes(appId) ? { ...f, appIds: [...f.appIds, appId] } : f));
  }, []);
  const deleteFolder = useCallback((id: string) => {
    setFolders((p) => p.filter((f) => f.id !== id));
  }, []);

  return { folders, createFolder, renameFolder, moveFolder, removeFromFolder, addToFolder, deleteFolder };
}
