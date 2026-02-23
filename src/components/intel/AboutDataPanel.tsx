import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

export const AboutDataPanel = ({ patentCount, lastUpdated }: { patentCount: number; lastUpdated: string | null }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">About This Data</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-4 text-xs text-muted-foreground leading-relaxed">
          <div>
            <p className="font-semibold text-foreground mb-1">Patent Intelligence</p>
            <p>
              Patent data is collected daily from public patent databases and verified filing records.
              We run broad searches across recent filings — no fixed category list. Categories are dynamically
              assigned based on each patent's content.
            </p>
            <ul className="list-disc ml-4 mt-1.5 space-y-0.5">
              <li><strong>Timeframe:</strong> Recent filings, typically from the past few weeks to months</li>
              <li><strong>Search scope:</strong> Broad searches across consumer products, technology, health, sustainability, and commerce</li>
              <li><strong>Refresh rate:</strong> Daily at 07:00 UTC</li>
              <li><strong>Coverage:</strong> {patentCount} filings currently tracked</li>
              <li><strong>Status:</strong> Active and expired patents are labeled separately when data is available</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Search Trend Signals</p>
            <p>
              Search interest data reflects real relative search volume (0–100 scale) over the trailing 12 months.
              Related queries are extracted alongside each keyword.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Market News</p>
            <p>
              Industry news is sourced from public web searches across startup funding, product launches, regulatory filings, 
              and technology trends. Articles are refreshed daily and categorized automatically.
            </p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-1">Platform Analytics</p>
            <p>
              Usage metrics are computed from real analyses run on this platform — including top flipped ideas, 
              notable revival scores, and category popularity. All numbers are aggregated and anonymized.
            </p>
          </div>

          {lastUpdated && (
            <p className="text-[10px] pt-1 border-t border-border">
              Last data refresh: {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
