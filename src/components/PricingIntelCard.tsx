import { DollarSign, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface PricingIntelProps {
  pricingIntel: {
    currentMarketPrice?: string;
    originalRetailPrice?: string;
    msrpOriginal?: string;
    priceDirection?: string;
    priceRange?: string;
    marginEstimate?: string;
    margins?: string;
    collectorPremium?: string;
    ebayAvgSold?: string;
    etsyAvgSold?: string;
    resaleAvgSold?: string;
    vintageAvgSold?: string;
    pricingNotes?: string;
    [key: string]: any;
  };
}

/* ── helpers ── */

function parsePrice(raw?: string): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function parseRange(raw?: string): { low: number; high: number } | null {
  if (!raw) return null;
  const nums = raw.replace(/,/g, "").match(/[\d.]+/g);
  if (!nums || nums.length < 2) return null;
  const sorted = nums.map(Number).sort((a, b) => a - b);
  return { low: sorted[0], high: sorted[sorted.length - 1] };
}

function directionMeta(dir?: string) {
  const d = (dir || "").toLowerCase();
  if (d.includes("up") || d.includes("ris") || d.includes("increas"))
    return { label: "Rising", icon: TrendingUp, color: "hsl(142 70% 35%)", bg: "hsl(142 70% 95%)" };
  if (d.includes("down") || d.includes("fall") || d.includes("declin") || d.includes("decreas"))
    return { label: "Falling", icon: TrendingDown, color: "hsl(0 72% 51%)", bg: "hsl(0 72% 95%)" };
  return { label: "Stable", icon: Minus, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" };
}

/* ── range bar ── */

function RangeBar({ low, high, market }: { low: number; high: number; market: number | null }) {
  const span = high - low || 1;
  const markerPct = market ? Math.min(Math.max(((market - low) / span) * 100, 2), 98) : 50;

  return (
    <div className="relative mt-3 mb-1">
      {/* bar track */}
      <div className="h-2.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 relative overflow-visible">
        {/* filled region */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
          style={{ width: `${markerPct}%` }}
        />
        {/* marker */}
        {market && (
          <div
            className="absolute -top-1 w-4.5 h-4.5 rounded-full border-2 border-primary bg-background shadow-md"
            style={{ left: `${markerPct}%`, transform: "translateX(-50%)", width: 18, height: 18, top: -4 }}
          />
        )}
      </div>
      {/* labels under bar */}
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground">${low.toLocaleString()}</span>
        <span className="text-[11px] font-semibold text-muted-foreground">${high.toLocaleString()}</span>
      </div>
    </div>
  );
}

/* ── stat pill ── */

function StatPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-muted/60 border border-border">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-bold" style={{ color: accent || "hsl(var(--foreground))" }}>{value}</span>
    </div>
  );
}

/* ── main component ── */

export function PricingIntelCard({ pricingIntel: pi }: PricingIntelProps) {
  const range = parseRange(pi.priceRange);
  const market = parsePrice(pi.currentMarketPrice);
  const dir = directionMeta(pi.priceDirection);
  const DirIcon = dir.icon;

  const stats = [
    { label: "Market Price", value: pi.currentMarketPrice },
    { label: "Original MSRP", value: pi.originalRetailPrice || pi.msrpOriginal },
    { label: "Margin", value: pi.marginEstimate || pi.margins },
    { label: "Collector Premium", value: pi.collectorPremium },
    { label: "Resale Avg", value: pi.resaleAvgSold || pi.ebayAvgSold },
    { label: "Vintage Avg", value: pi.vintageAvgSold || pi.etsyAvgSold },
  ].filter(s => s.value);

  return (
    <div className="space-y-4">
      {/* ── Price Direction + Range Bar ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Price Range</p>
            <p className="text-lg font-bold text-foreground">{pi.priceRange || "—"}</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ color: dir.color, background: dir.bg }}
          >
            <DirIcon size={13} />
            {dir.label}
          </div>
        </div>
        {range && <RangeBar low={range.low} high={range.high} market={market} />}
        {market && (
          <p className="text-xs text-muted-foreground mt-1">
            Market price <span className="font-semibold text-foreground">${market.toLocaleString()}</span> within range
          </p>
        )}
      </div>

      {/* ── Stat Pills ── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stats.map(s => (
            <StatPill key={s.label} label={s.label} value={s.value!} />
          ))}
        </div>
      )}

      {/* ── Pricing Notes ── */}
      {pi.pricingNotes && (
        <p className="text-sm text-foreground leading-relaxed">{pi.pricingNotes}</p>
      )}
    </div>
  );
}
