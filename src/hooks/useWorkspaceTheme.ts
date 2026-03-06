import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "workspace-theme";

export type WorkspaceTheme = "dark" | "light";

export function useWorkspaceTheme() {
  const [theme, setThemeState] = useState<WorkspaceTheme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as WorkspaceTheme) || "dark";
    } catch {
      return "dark";
    }
  });

  const setTheme = useCallback((t: WorkspaceTheme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
