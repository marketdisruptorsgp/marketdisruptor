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
      className="flex items-center gap-2 px-3 min-h-[40px] rounded-lg transition-all hover:scale-105 active:scale-95"
      style={{
        background: isDark ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--foreground))",
      }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-xs font-semibold hidden sm:inline">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
