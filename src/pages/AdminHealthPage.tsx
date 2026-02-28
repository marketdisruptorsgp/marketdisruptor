import React, { useState, useEffect, useCallback } from "react";
import { useAnalyticsAdmin } from "@/hooks/useAnalyticsAdmin";
import { AlertTriangle, Bug, Wifi, Zap, Clock, RefreshCw, Shield, ChevronDown, ChevronUp } from "lucide-react";

interface HealthError {
  id: string;
  event_type: string;
  page_path: string;
  metadata: Record<string, any>;
  timestamp: string;
  device_type: string;
  viewport_width: number;
  session_id: string;
}

interface HealthData {
  errors: HealthError[];
  summary: Record<string, { count: number; critical: number; medium: number; low: number; pages: Record<string, number> }>;
  stuckUsers: { session_id: string; element: string; page: string; count: number }[];
  totalIssues: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  js_error: <Bug className="w-4 h-4" />,
  api_failure: <Wifi className="w-4 h-4" />,
  render_error: <AlertTriangle className="w-4 h-4" />,
  slow_request: <Clock className="w-4 h-4" />,
};

const EVENT_LABELS: Record<string, string> = {
  js_error: "JavaScript Error",
  api_failure: "API Failure",
  render_error: "Render Error",
  slow_request: "Slow Request",
};

function getSuggestedFix(error: HealthError): string {
  const m = error.metadata || {};
  if (error.event_type === "js_error") {
    if (m.message?.includes("Cannot read prop")) return "Null check missing — add optional chaining (?.) before the failing property access.";
    if (m.message?.includes("is not a function")) return "Verify the import exists and the method name is correct.";
    if (m.message?.includes("ChunkLoadError")) return "Code splitting failure — user may need to hard refresh. Consider adding an error boundary with retry.";
    if (m.type === "unhandled_rejection") return "Add .catch() to the promise or wrap in try/catch.";
    return "Review the stack trace and add error handling around the failing code.";
  }
  if (error.event_type === "api_failure") {
    if (m.status === 401 || m.status === 403) return "Authentication issue — check token refresh logic and session handling.";
    if (m.status === 404) return "Endpoint not found — verify the URL and that the backend function is deployed.";
    if (m.status >= 500) return "Server error — check backend function logs for the root cause.";
    if (m.error?.includes("Network")) return "Network connectivity issue — add offline detection and retry logic.";
    return "Check backend logs and ensure the endpoint is healthy.";
  }
  if (error.event_type === "render_error") return "React component crash — wrap in ErrorBoundary and check for undefined data access.";
  if (error.event_type === "slow_request") {
    if ((m.duration_ms || 0) > 15000) return "Critical latency — consider caching, pagination, or optimizing the query.";
    return "Request taking >5s — review backend query performance and consider loading states.";
  }
  return "Investigate in context.";
}

function TimeAgo({ ts }: { ts: string }) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h ago</span>;
  return <span>{Math.floor(hrs / 24)}d ago</span>;
}

function ErrorRow({ error }: { error: HealthError }) {
  const [expanded, setExpanded] = useState(false);
  const severity = error.metadata?.severity || "medium";

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className={`p-1.5 rounded ${SEVERITY_COLORS[severity]}`}>
          {EVENT_ICONS[error.event_type] || <Bug className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {error.metadata?.message || error.metadata?.url || error.event_type}
          </div>
          <div className="text-xs text-white/50 flex gap-2">
            <span>{error.page_path}</span>
            <span>·</span>
            <span>{error.device_type}</span>
            <span>·</span>
            <TimeAgo ts={error.timestamp} />
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_COLORS[severity]}`}>
          {severity}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {error.metadata?.status && <Detail label="Status" value={String(error.metadata.status)} />}
            {error.metadata?.duration_ms && <Detail label="Duration" value={`${error.metadata.duration_ms}ms`} />}
            {error.metadata?.source && <Detail label="Source" value={error.metadata.source} />}
            {error.metadata?.line && <Detail label="Line" value={`${error.metadata.line}:${error.metadata.col || 0}`} />}
            <Detail label="Session" value={error.session_id?.slice(0, 12)} />
            <Detail label="Viewport" value={`${error.viewport_width}px`} />
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded p-2 mt-2">
            <div className="text-green-400 text-xs font-medium mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Suggested Fix
            </div>
            <div className="text-green-300/80 text-xs">{getSuggestedFix(error)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/40 text-xs">{label}: </span>
      <span className="text-white/70 text-xs font-mono">{value}</span>
    </div>
  );
}

export default function AdminHealthPage() {
  const { authenticated, login, logout, fetchData, loading, error, days, setDays } = useAnalyticsAdmin();
  const [tokenInput, setTokenInput] = useState("");
  const [data, setData] = useState<HealthData | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const result = await fetchData("health");
    if (result) setData(result);
  }, [fetchData]);

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated, load, days]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full max-w-sm">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> System Health Access
          </h3>
          <input
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm mb-3 placeholder:text-white/30"
            placeholder="Enter admin token"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tokenInput && login(tokenInput)}
          />
          <button
            onClick={() => tokenInput && login(tokenInput)}
            className="w-full bg-red-600 hover:bg-red-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Access Health Dashboard
          </button>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const totalCritical = Object.values(summary).reduce((s, v) => s + v.critical, 0);
  const totalMedium = Object.values(summary).reduce((s, v) => s + v.medium, 0);
  const filteredErrors = filter === "all" ? (data?.errors || []) : (data?.errors || []).filter((e) => e.event_type === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-red-400" />
          <h1 className="text-lg font-semibold">System Health</h1>
          <a href="/admin/analytics" className="text-xs text-white/40 hover:text-white/60 ml-2">
            ← Analytics
          </a>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white"
          >
            <option value={1}>24h</option>
            <option value={7}>7d</option>
            <option value={14}>14d</option>
            <option value={30}>30d</option>
          </select>
          <button onClick={load} className="p-1.5 hover:bg-white/10 rounded" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={logout} className="text-xs text-white/40 hover:text-white/60">Logout</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard label="Total Issues" value={data?.totalIssues || 0} color={data?.totalIssues ? "red" : "green"} />
          <StatusCard label="Critical" value={totalCritical} color={totalCritical ? "red" : "green"} />
          <StatusCard label="Medium" value={totalMedium} color={totalMedium ? "amber" : "green"} />
          <StatusCard label="Stuck Users" value={data?.stuckUsers?.length || 0} color={(data?.stuckUsers?.length || 0) > 0 ? "amber" : "green"} />
        </div>

        {/* Issue Type Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(EVENT_LABELS).map(([type, label]) => {
            const s = summary[type];
            return (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? "all" : type)}
                className={`bg-white/5 border rounded-lg p-3 text-left transition-colors ${
                  filter === type ? "border-white/40 bg-white/10" : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {EVENT_ICONS[type]}
                  <span className="text-xs text-white/60">{label}</span>
                </div>
                <div className="text-xl font-bold">{s?.count || 0}</div>
                {s?.critical ? <span className="text-xs text-red-400">{s.critical} critical</span> : null}
              </button>
            );
          })}
        </div>

        {/* Stuck Users */}
        {(data?.stuckUsers?.length || 0) > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <h3 className="text-amber-400 font-medium text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Stuck Users (Rage Click Patterns)
            </h3>
            <div className="space-y-2">
              {data!.stuckUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-white/40 font-mono">{u.session_id.slice(0, 10)}…</span>
                  <span className="text-white/70">{u.page}</span>
                  <span className="text-amber-400 font-medium">{u.count}× rage clicks</span>
                  <span className="text-white/40 truncate max-w-[200px]">{u.element}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/80">
              {filter === "all" ? "All Issues" : EVENT_LABELS[filter] || filter} ({filteredErrors.length})
            </h2>
            {filter !== "all" && (
              <button onClick={() => setFilter("all")} className="text-xs text-white/40 hover:text-white/60">
                Show All
              </button>
            )}
          </div>

          {filteredErrors.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">All Systems Healthy</p>
              <p className="text-green-400/60 text-sm">No issues detected in the last {days} days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredErrors.map((err) => (
                <ErrorRow key={err.id} error={err} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    red: "border-red-500/30 text-red-400",
    amber: "border-amber-500/30 text-amber-400",
    green: "border-green-500/30 text-green-400",
  };
  return (
    <div className={`bg-white/5 border rounded-lg p-3 ${colors[color] || colors.green}`}>
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
