import { Sun, Moon } from "lucide-react";
import type { WorkspaceTheme } from "@/hooks/useWorkspaceTheme";

interface WorkspaceThemeToggleProps {
  theme: WorkspaceTheme;
  onToggle: () => void;
}

export function WorkspaceThemeToggle({ theme, onToggle }: WorkspaceThemeToggleProps) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg transition-colors hover:opacity-80"
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--foreground))",
      }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
