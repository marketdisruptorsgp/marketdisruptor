import { useState } from "react";
import { ChevronDown, ChevronUp, Database } from "lucide-react";

export const AboutDataPanel = ({ patentCount, lastUpdated }: { patentCount: number; lastUpdated: string | null }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "2px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/60"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Database size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <span className="text-sm font-bold text-foreground">About This Data</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {open ? "Hide" : "Details"}
          </span>
          {open ? <ChevronUp size={16} className="text-foreground" /> : <ChevronDown size={16} className="text-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t space-y-4 text-xs text-muted-foreground leading-relaxed" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <p className="font-bold text-foreground mb-1 text-sm">Patent Intelligence</p>
            <p>
              Patent data is collected daily from public patent databases and verified filing records.
              Searches focus on filings from the past 7 days, with broader backfill when needed to maintain coverage.
              Categories are dynamically assigned based on each patent's content.
            </p>
            <ul className="list-disc ml-4 mt-1.5 space-y-0.5">
              <li><strong>Priority window:</strong> Last 7 days (broadens to 30 days if needed)</li>
              <li><strong>Minimum coverage:</strong> 10+ filings per refresh cycle</li>
              <li><strong>Refresh rate:</strong> Daily at 07:00 UTC</li>
              <li><strong>Current coverage:</strong> {patentCount} filings tracked</li>
              <li><strong>Categories:</strong> Dynamically inferred from patent content</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-foreground mb-1 text-sm">Search Trend Signals</p>
            <p>
              Search interest data reflects real relative search volume (0–100 scale) over the trailing 12 months.
              Related queries are extracted alongside each keyword.
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground mb-1 text-sm">Market News</p>
            <p>
              Industry news is sourced from public web searches across startup funding, product launches, regulatory filings,
              and technology trends. Articles are refreshed daily and categorized automatically.
            </p>
          </div>

          <div>
            <p className="font-bold text-foreground mb-1 text-sm">Platform Analytics</p>
            <p>
              Usage metrics are computed from real analyses run on this platform — including top flipped ideas,
              notable revival scores, and category popularity. All numbers are aggregated and anonymized.
            </p>
          </div>

          {lastUpdated && (
            <p className="text-[11px] pt-2 font-medium" style={{ borderTop: "1px solid hsl(var(--border))", color: "hsl(var(--primary))" }}>
              Last data refresh: {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
