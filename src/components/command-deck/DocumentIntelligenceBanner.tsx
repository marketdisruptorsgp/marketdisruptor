/**
 * Document Intelligence Banner
 * 
 * Subtle indicator showing whether CIM/document data is loaded
 * and key extraction stats (constraints, leverage points, financials).
 * Designed to be non-intrusive — collapses to a single line.
 */

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Database } from "lucide-react";

interface DocumentIntelligenceBannerProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
  adaptiveContextLoaded: boolean;
}

interface ExtractionStat {
  label: string;
  count: number;
  icon?: "constraint" | "leverage" | "financial" | "workflow";
}

function extractStats(bi: Record<string, any> | null): ExtractionStat[] {
  if (!bi) return [];
  const stats: ExtractionStat[] = [];

  const constraints = Array.isArray(bi.constraints) ? bi.constraints.length : 0;
  if (constraints > 0) stats.push({ label: "Constraints", count: constraints, icon: "constraint" });

  const leveragePoints = bi.signals_for_visualization?.candidate_leverage_points;
  const lpCount = Array.isArray(leveragePoints) ? leveragePoints.length : 0;
  if (lpCount > 0) stats.push({ label: "Leverage Points", count: lpCount, icon: "leverage" });

  const workflows = bi.operating_model?.workflow_stages;
  const wfCount = Array.isArray(workflows) ? workflows.length : 0;
  if (wfCount > 0) stats.push({ label: "Workflow Stages", count: wfCount, icon: "workflow" });

  const revSources = bi.revenue_engine?.revenue_sources;
  const revCount = Array.isArray(revSources) ? revSources.length : 0;
  if (revCount > 0) stats.push({ label: "Revenue Sources", count: revCount, icon: "financial" });

  const costDrivers = bi.revenue_engine?.cost_drivers;
  const cdCount = Array.isArray(costDrivers) ? costDrivers.length : 0;
  if (cdCount > 0) stats.push({ label: "Cost Drivers", count: cdCount, icon: "financial" });

  return stats;
}

export function DocumentIntelligenceBanner({
  biExtraction,
  governedData,
  adaptiveContextLoaded,
}: DocumentIntelligenceBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const hasBI = !!biExtraction;
  const hasGoverned = !!governedData;
  const companyName = biExtraction?.business_overview?.company_name;
  const stats = extractStats(biExtraction);
  const totalSignals = stats.reduce((sum, s) => sum + s.count, 0);

  // Don't show if there's nothing to report
  if (!hasBI && !hasGoverned) return null;

  const isHealthy = hasBI && adaptiveContextLoaded;
  const isPartial = hasBI && !adaptiveContextLoaded;

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        background: isHealthy
          ? "hsl(var(--success) / 0.06)"
          : isPartial
          ? "hsl(var(--warning, 45 93% 47%) / 0.08)"
          : "hsl(var(--muted) / 0.5)",
        border: `1px solid ${
          isHealthy
            ? "hsl(var(--success) / 0.2)"
            : isPartial
            ? "hsl(var(--warning, 45 93% 47%) / 0.2)"
            : "hsl(var(--border))"
        }`,
      }}
    >
      {/* Summary line */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-left group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isHealthy ? (
            <CheckCircle2 size={13} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : isPartial ? (
            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          ) : (
            <Database size={13} className="text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-[11px] font-bold text-foreground truncate">
            {companyName ? `${companyName} — Document Intelligence` : "Document Intelligence"}
          </span>
          {totalSignals > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground flex-shrink-0">
              {totalSignals} signals extracted
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!expanded && stats.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {stats.slice(0, 3).map((s) => (
                <span
                  key={s.label}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-foreground/[0.04] text-muted-foreground"
                >
                  {s.count} {s.label}
                </span>
              ))}
            </div>
          )}
          {expanded ? (
            <ChevronUp size={12} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-border/50">
          {/* Source status */}
          <div className="flex flex-wrap gap-3 pt-2">
            <StatusPill
              label="CIM/Document Data"
              loaded={hasBI}
              detail={hasBI ? `${companyName || "Loaded"}` : "Not uploaded"}
            />
            <StatusPill
              label="Governed Reasoning"
              loaded={hasGoverned}
              detail={hasGoverned ? "Active" : "Not computed"}
            />
            <StatusPill
              label="Pipeline Context"
              loaded={adaptiveContextLoaded}
              detail={adaptiveContextLoaded ? "Threaded" : "Missing — steps may use generic data"}
            />
          </div>

          {/* Signal breakdown */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-foreground/[0.03] border border-border/50"
                >
                  <FileText size={11} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-foreground">{s.count}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warning if context not threaded */}
          {hasBI && !adaptiveContextLoaded && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              ⚠ Document data exists but pipeline context is not loaded. Some analysis steps may show generic results.
              Try refreshing the analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ label, loaded, detail }: { label: string; loaded: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: loaded ? "hsl(var(--success))" : "hsl(var(--muted-foreground) / 0.3)" }}
      />
      <span className="text-[10px] text-muted-foreground">
        <span className="font-bold text-foreground">{label}:</span> {detail}
      </span>
    </div>
  );
}
