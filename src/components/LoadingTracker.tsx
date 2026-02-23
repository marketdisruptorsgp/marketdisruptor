interface LoadingTrackerProps {
  step: "scraping" | "analyzing";
  elapsedSeconds: number;
  loadingLog: { text: string; ts: number }[];
}

const SCRAPE_SOURCES = [
  { label: "eBay", detail: "Sold listings, collector pricing" },
  { label: "Etsy", detail: "Vintage revival trends" },
  { label: "Reddit", detail: "Community sentiment" },
  { label: "TikTok / Google", detail: "Viral trend signals" },
  { label: "Alibaba", detail: "Suppliers, MOQs" },
];

const ANALYZE_TASKS = [
  { label: "AI Reasoning", detail: "Parsing all collected data" },
  { label: "Pricing Intel", detail: "Market prices, margins" },
  { label: "Supply Chain", detail: "Suppliers, distributors" },
  { label: "Flip Ideas", detail: "Innovations from pain points" },
  { label: "Action Plans", detail: "Scoring + execution steps" },
  { label: "Product Images", detail: "Real images from sources" },
];

export function LoadingTracker({ step, elapsedSeconds, loadingLog }: LoadingTrackerProps) {
  const isScraping = step === "scraping";
  const SCRAPE_EST = 35;
  const ANALYZE_EST = 55;
  const totalEst = SCRAPE_EST + ANALYZE_EST;
  const effectiveElapsed = isScraping
    ? Math.min(elapsedSeconds, SCRAPE_EST)
    : Math.min(SCRAPE_EST + elapsedSeconds, totalEst);
  const progressPct = Math.min(97, Math.round((effectiveElapsed / totalEst) * 100));
  const remaining = Math.max(0, totalEst - effectiveElapsed);
  const remainingLabel = remaining > 60
    ? `~${Math.ceil(remaining / 60)}m ${remaining % 60}s`
    : remaining > 0 ? `~${remaining}s` : "Finishing…";

  return (
    <div className="card-intelligence overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm">
              {isScraping ? "Collecting Market Data" : "Building Report"}
            </p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              {isScraping ? "PHASE 1" : "PHASE 2"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{progressPct}%</p>
            <p className="text-[10px] text-muted-foreground">{remainingLabel}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-sm overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div className="h-full rounded-sm transition-all duration-1000"
            style={{ width: `${progressPct}%`, background: "hsl(var(--primary))" }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">{elapsedSeconds}s elapsed</span>
          <span className="text-[10px] text-muted-foreground">Est. 45–120s</span>
        </div>
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="p-4 space-y-2" style={{ borderRight: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {isScraping ? "Sources" : "Tasks"}
          </p>
          {(isScraping ? SCRAPE_SOURCES : ANALYZE_TASKS).map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/30 border-t-transparent animate-spin flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Live log */}
        <div className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Activity
          </p>
          <div className="space-y-1 font-mono max-h-48 overflow-y-auto">
            {loadingLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">Initializing…</p>
            ) : (
              [...loadingLog].reverse().map((entry, i) => (
                <div key={entry.ts} className={`flex items-start gap-1.5 ${i === 0 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                    {Math.floor((Date.now() - entry.ts) / 1000) < 2 ? "now" : `${Math.floor((Date.now() - entry.ts) / 1000)}s`}
                  </span>
                  <span className="text-[11px] text-foreground leading-relaxed">{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: "hsl(var(--muted))" }}>
        <p className="text-[11px] text-muted-foreground">
          Auto-saves when complete
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">
          {isScraping ? "1 / 2" : "2 / 2"}
        </p>
      </div>
    </div>
  );
}
