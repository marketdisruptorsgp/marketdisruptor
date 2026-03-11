/**
 * DealMetricsStrip — Compact financial metrics bar
 *
 * Pulls key numbers from biExtraction (revenue_engine, operating_model)
 * and displays them as a tight horizontal strip for instant scanning.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";

interface DealMetricsStripProps {
  biExtraction: Record<string, unknown> | null | undefined;
  governedData: Record<string, unknown> | null | undefined;
}

interface ExtractedMetric {
  label: string;
  value: string;
  source: "document" | "modeled";
}

/** Extract dollar amounts, percentages, and key financial figures from evidence text */
function extractFinancialMetrics(bi: Record<string, unknown>, governed: Record<string, unknown> | null | undefined): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];
  const seen = new Set<string>();

  const addMetric = (label: string, value: string, source: "document" | "modeled" = "document") => {
    if (seen.has(label)) return;
    seen.add(label);
    metrics.push({ label, value, source });
  };

  // Revenue engine evidence
  const revenueEngine = bi.revenue_engine as Record<string, unknown> | undefined;
  if (revenueEngine?.evidence) {
    const evidence = revenueEngine.evidence as string[];
    for (const e of evidence) {
      // SDE
      const sdeMatch = e.match(/(?:SDE|Seller's Discretionary Earnings?).*?\$[\d,]+(?:\.\d+)?/i);
      if (sdeMatch) {
        // Try to find the most recent SDE
        const allSDE = e.match(/\$[\d,]+(?:\.\d+)?/g);
        if (allSDE && allSDE.length > 0) {
          addMetric("SDE", allSDE[allSDE.length - 1]);
        }
      }

      // Gross margin
      const marginMatch = e.match(/(?:gross\s+(?:profit\s+)?margin)s?\s+(?:.*?)(\d+[\-–]\d+%|\d+\.?\d*%)/i);
      if (marginMatch) {
        addMetric("Gross Margin", marginMatch[1]);
      }

      // Revenue from fixtures
      const fixtureMatch = e.match(/\$[\d,]+(?:\.\d+)?\s*(?:to|–|-)\s*\$[\d,]+(?:\.\d+)?.*?(?:annually|per\s+year)/i);
      if (fixtureMatch) {
        const amounts = fixtureMatch[0].match(/\$[\d,]+(?:\.\d+)?/g);
        if (amounts && amounts.length >= 2) {
          addMetric("Fixture Revenue", `${amounts[0]}–${amounts[1]}/yr`);
        }
      }

      // Lease / rent
      const leaseMatch = e.match(/\$[\d,]+(?:\.\d+)?\/month.*?(?:lease|rent)/i) || e.match(/(?:lease|rent).*?\$[\d,]+(?:\.\d+)?\/month/i);
      if (leaseMatch) {
        const amount = leaseMatch[0].match(/\$[\d,]+(?:\.\d+)?/);
        if (amount) {
          addMetric("Facility Lease", `${amount[0]}/mo`);
        }
      }

      // GC vs direct split
      const splitMatch = e.match(/(\d+[\-–]\d+%)\s+(?:of\s+)?(?:revenue\s+)?from\s+(?:commercial\s+)?general\s+contractors/i);
      if (splitMatch) {
        addMetric("GC Revenue", splitMatch[1]);
      }
    }
  }

  // Operating model — employee count
  const operatingModel = bi.operating_model as Record<string, unknown> | undefined;
  if (operatingModel?.key_resources) {
    const resources = operatingModel.key_resources as string[];
    for (const r of resources) {
      const empMatch = r.match(/(\d+)\s+employees?\s+total/i);
      if (empMatch) {
        addMetric("Team", `${empMatch[1]} employees`);
      }
      const facilityMatch = r.match(/([\d,]+)\s*(?:sq\.?\s*ft|square\s*feet?)/i);
      if (facilityMatch) {
        addMetric("Facility", `${facilityMatch[1]} sq ft`);
      }
    }
  }

  // Also check governed data for financial fields
  if (governed) {
    const askingPrice = governed.askingPrice || governed.asking_price;
    if (typeof askingPrice === "string" || typeof askingPrice === "number") {
      addMetric("Asking Price", String(askingPrice));
    }
    const revenue = governed.revenue || governed.totalRevenue;
    if (typeof revenue === "string" || typeof revenue === "number") {
      addMetric("Revenue", String(revenue));
    }
  }

  return metrics.slice(0, 6);
}

export const DealMetricsStrip = memo(function DealMetricsStrip({
  biExtraction,
  governedData,
}: DealMetricsStripProps) {
  const metrics = useMemo(() => {
    if (!biExtraction) return [];
    return extractFinancialMetrics(biExtraction, governedData);
  }, [biExtraction, governedData]);

  if (metrics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl px-4 py-3 flex items-center gap-1 overflow-x-auto"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-center gap-1.5 mr-3 flex-shrink-0">
        <DollarSign size={12} className="text-muted-foreground" />
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Deal Metrics
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {i > 0 && (
              <div className="w-px h-4 bg-border flex-shrink-0" />
            )}
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {m.label}
              </p>
              <p className="text-sm font-black text-foreground whitespace-nowrap">
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
