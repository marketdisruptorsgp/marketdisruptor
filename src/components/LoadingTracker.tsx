interface LoadingTrackerProps {
  step: "scraping" | "analyzing";
  elapsedSeconds: number;
  loadingLog: { text: string; ts: number }[];
}

const SCRAPE_SOURCES = [
  { label: "Market Data", detail: "Pricing, sold listings, trends" },
  { label: "Community Intel", detail: "Sentiment & discussions" },
  { label: "Trend Signals", detail: "Viral & search interest" },
  { label: "Supply Chain", detail: "Suppliers, MOQs, distributors" },
  { label: "Complaint Mining", detail: "Pain points & feature gaps" },
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
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm">
              {isScraping ? "Collecting Market Data" : "Building Report"}
            </p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {isScraping ? "PHASE 1" : "PHASE 2"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{progressPct}%</p>
            <p className="text-[10px] text-muted-foreground">{remainingLabel}</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
          <div className="h-full rounded-full transition-all duration-1000 bg-primary"
            style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">{elapsedSeconds}s elapsed</span>
          <span className="text-[10px] text-muted-foreground">Est. 45–120s</span>
        </div>
      </div>

      {/* Two column on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-border">
        <div className="p-4 sm:p-5 space-y-2 sm:space-y-2.5 border-b sm:border-b-0 sm:border-r border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {isScraping ? "Sources" : "Tasks"}
          </p>
          {(isScraping ? SCRAPE_SOURCES : ANALYZE_TASKS).map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/30 border-t-transparent animate-spin flex-shrink-0" />
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Activity
          </p>
          <div className="space-y-1 font-mono max-h-36 sm:max-h-48 overflow-y-auto">
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
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between bg-muted">
        <p className="text-xs text-muted-foreground">Auto-saves when complete</p>
        <p className="text-xs font-medium text-muted-foreground">{isScraping ? "1 / 2" : "2 / 2"}</p>
      </div>
    </div>
  );
}