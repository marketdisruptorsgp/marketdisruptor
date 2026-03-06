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

  // Sync data-command-deck attribute on document.documentElement
  // This ensures CSS variables apply regardless of component tree structure
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-command-deck", "");
    } else {
      root.removeAttribute("data-command-deck");
    }
    // Cleanup: remove attribute when hook unmounts (e.g. leaving analysis pages)
    return () => {
      root.removeAttribute("data-command-deck");
    };
  }, [theme]);

  const setTheme = useCallback((t: WorkspaceTheme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  }, []);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
