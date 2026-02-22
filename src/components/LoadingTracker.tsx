import { Brain } from "lucide-react";

interface LoadingTrackerProps {
  step: "scraping" | "analyzing";
  elapsedSeconds: number;
  loadingLog: { text: string; ts: number }[];
}

const SCRAPE_SOURCES = [
  { icon: "🛍️", label: "eBay", detail: "Sold listings, collector pricing, bid history" },
  { icon: "🌿", label: "Etsy", detail: "Vintage revival trends, handmade alternatives" },
  { icon: "💬", label: "Reddit", detail: "Community sentiment, nostalgia signals, complaints" },
  { icon: "📱", label: "TikTok / Google", detail: "Viral trends, search volume signals" },
  { icon: "🏭", label: "Alibaba / Wholesale", detail: "Suppliers, MOQs, manufacturer sources" },
];

const ANALYZE_TASKS = [
  { icon: "🧠", label: "AI Reasoning", detail: "Gemini 2.5 Flash parsing all collected data" },
  { icon: "💰", label: "Pricing Intel", detail: "Real market prices, collector premiums, margins" },
  { icon: "📦", label: "Supply Chain", detail: "Mapping real suppliers, manufacturers, distributors" },
  { icon: "⚡", label: "Flip Ideas", detail: "Generating innovations from community pain points" },
  { icon: "🎯", label: "Action Plans", detail: "Revival scoring + week-one execution steps" },
  { icon: "🖼️", label: "Product Images", detail: "Finding real images from eBay, Amazon, Wikipedia" },
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
    : remaining > 0 ? `~${remaining}s` : "Almost done…";

  return (
    <div className="card-intelligence overflow-hidden">
      {/* Top header bar */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "hsl(var(--primary))", animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
            <p className="font-extrabold text-foreground text-base">
              {isScraping ? "Collecting Market Data…" : "AI Building Your Report…"}
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
              {isScraping ? "SCRAPING" : "ANALYZING"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">{progressPct}%</p>
            <p className="text-[10px] text-muted-foreground">{remainingLabel} left</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))" }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">⏱ {elapsedSeconds}s elapsed</span>
          <span className="text-[10px] text-muted-foreground">Typical range: 45–120 seconds</span>
        </div>
      </div>

      {/* Two column: phases + live log */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        {/* Phase checklist */}
        <div className="p-5 space-y-3" style={{ borderRight: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary))" }}>
            {isScraping ? "Data Sources" : "AI Tasks"}
          </p>
          {(isScraping ? SCRAPE_SOURCES : ANALYZE_TASKS).map((item, i) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                style={{ background: "hsl(var(--primary-muted))" }}>
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
              <div className="ml-auto flex-shrink-0 mt-0.5">
                <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `hsl(var(--primary) / ${i === 0 ? 1 : 0.3})`, borderTopColor: "transparent" }} />
              </div>
            </div>
          ))}

          {/* Phase 2 upcoming */}
          {isScraping && (
            <div className="mt-4 pt-3" style={{ borderTop: "1px dashed hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-muted-foreground">Up Next</p>
              <div className="flex items-center gap-2 opacity-40">
                <Brain size={13} style={{ color: "hsl(271 81% 55%)" }} />
                <span className="text-xs text-muted-foreground">Gemini AI Deep Analysis</span>
              </div>
            </div>
          )}
        </div>

        {/* Live activity log */}
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary))" }}>
            Live Activity
          </p>
          <div className="space-y-1.5 font-mono max-h-48 overflow-y-auto">
            {loadingLog.length === 0 ? (
              <p className="text-xs text-muted-foreground animate-pulse">Initializing…</p>
            ) : (
              [...loadingLog].reverse().map((entry, i) => (
                <div key={entry.ts} className={`flex items-start gap-1.5 transition-opacity ${i === 0 ? "opacity-100" : "opacity-50"}`}>
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
      <div className="px-6 py-3 flex items-center justify-between" style={{ background: "hsl(var(--muted))" }}>
        <p className="text-[11px] text-muted-foreground">
          🔒 Your analysis is private — auto-saves to your workspace when complete
        </p>
        <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
          {isScraping ? "Phase 1 of 2" : "Phase 2 of 2"}
        </p>
      </div>
    </div>
  );
}