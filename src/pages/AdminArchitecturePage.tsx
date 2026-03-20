import { useState } from "react";
import { useAnalyticsAdmin } from "@/hooks/useAnalyticsAdmin";
import { Shield, Layers, ChevronDown, ChevronRight } from "lucide-react";

const TOKEN_KEY = "md_ax_admin_token";

const ARCHITECTURE_TEXT = `
System Layer Architecture
─────────────────────────
UI Layer → Application Logic → AI Processing → Data Layer

UI: StartPage, WorkspacePage, NewAnalysisPage, ReportPage, etc.
Logic: AnalysisContext, AuthProvider, SubscriptionProvider
AI: Edge Functions (structural-decomposition, analyze-products, strategic-synthesis, etc.)
Data: Supabase (saved_analyses, profiles, user_usage, market_intel, etc.)
`;

export default function AdminArchitecturePage() {
  const { isAdmin, tokenInput, setTokenInput, handleLogin } = useAnalyticsAdmin(TOKEN_KEY);
  const [expanded, setExpanded] = useState(true);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Shield size={20} className="text-primary" />
            <h1 className="text-lg font-bold">Architecture Map</h1>
          </div>
          <input
            type="password"
            placeholder="Admin token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-foreground">System Architecture</h1>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {expanded ? "Collapse" : "Expand"}
        </button>
        {expanded && (
          <pre className="bg-card border border-border rounded-xl p-4 text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap">
            {ARCHITECTURE_TEXT}
          </pre>
        )}
      </div>
    </div>
  );
}
