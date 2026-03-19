/**
 * MorphologicalExplorerPanel — Optional design space exploration
 * 
 * Sits below Flipped Ideas in the Disrupt step.
 * User clicks "Explore Design Space" to run the morphological engine
 * against the current evidence + constraints. Results appear as
 * explorable opportunity vectors that can be selected, rejected,
 * and steered — flowing into downstream redesign/stress test.
 *
 * Two tabs:
 *   1. Opportunity Vectors — clustered zone view (original behaviour)
 *   2. Zwicky Box — full morphological chart showing current values,
 *      qualified alternatives, and blocked combinations with reasons
 */

import { useState, useCallback, useMemo } from "react";
import { Grid3X3, Sparkles, ChevronDown, ChevronUp, AlertTriangle, ArrowRight, Lightbulb, X, Table2, Lock, CheckCircle } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  runMorphologicalSearch,
  extractBaseline,
  identifyActiveDimensions,
  getDimensionsByStatus,
  type MorphologicalSearchResult,
  type OpportunityVector,
  type OpportunityZone,
  type BusinessBaseline,
  type ZwickyBoxRow,
  type BlockedVector,
} from "@/lib/opportunityDesignEngine";
import { extractAllEvidence, flattenEvidence } from "@/lib/evidenceEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";

interface MorphologicalExplorerPanelProps {
  /** User's steering context from the FlippedIdeasPanel */
  steeringContext?: string;
  /** Callback when user selects vectors to include in redesign */
  onVectorsSelected?: (vectors: OpportunityVector[]) => void;
}

// ── Gate badge colours ────────────────────────────────────────────────────────
const GATE_COLOURS: Record<string, string> = {
  evidence: "hsl(38 92% 50%)",
  constraint_linkage: "hsl(229 89% 63%)",
  feasibility: "hsl(0 72% 50%)",
  redundancy: "hsl(var(--muted-foreground))",
};

const GATE_LABELS: Record<string, string> = {
  evidence: "Insufficient evidence",
  constraint_linkage: "No constraint link",
  feasibility: "Feasibility conflict",
  redundancy: "Redundant",
};

// ── Zwicky Box sub-component ──────────────────────────────────────────────────

function ZwickyBoxView({ rows }: { rows: ZwickyBoxRow[] }) {
  const [expandedBlocked, setExpandedBlocked] = useState<Set<string>>(new Set());

  if (rows.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        No active dimensions to display.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Each row is a business dimension. Green cells are qualified alternative configurations;
        red cells are blocked combinations with "What needs to change?" reasoning.
      </p>

      {rows.map(row => {
        const totalAlts = row.qualifiedAlternatives.length + row.blockedAlternatives.length;
        return (
          <div
            key={row.dimensionId}
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid hsl(var(--border))" }}
          >
            {/* Row header */}
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ background: "hsl(var(--muted) / 0.5)" }}
            >
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                style={{
                  background: row.status === "hot"
                    ? "hsl(0 72% 50% / 0.1)"
                    : "hsl(229 89% 63% / 0.1)",
                  color: row.status === "hot"
                    ? "hsl(0 72% 50%)"
                    : "hsl(229 89% 63%)",
                }}
              >
                {row.status}
              </span>
              <span className="text-xs font-semibold text-foreground flex-1">{row.dimensionName}</span>
              <span className="text-[10px] text-muted-foreground">
                {row.evidenceCount} evidence · {totalAlts} alternative{totalAlts !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Cells */}
            <div className="px-3 py-2 flex flex-wrap gap-1.5">
              {/* Current/baseline value */}
              <div
                className="rounded px-2 py-1 text-[10px] font-semibold"
                style={{
                  background: "hsl(var(--primary) / 0.12)",
                  border: "1.5px solid hsl(var(--primary) / 0.4)",
                  color: "hsl(var(--primary))",
                }}
                title="Current baseline value"
              >
                ★ {row.currentValue.length > 40 ? row.currentValue.slice(0, 38) + "…" : row.currentValue}
              </div>

              {/* Qualified alternatives */}
              {row.qualifiedAlternatives.map((alt, i) => (
                <div
                  key={`q-${i}`}
                  className="rounded px-2 py-1 text-[10px] flex items-center gap-1"
                  style={{
                    background: "hsl(152 60% 44% / 0.08)",
                    border: "1px solid hsl(152 60% 44% / 0.3)",
                    color: "hsl(152 60% 44%)",
                  }}
                  title="Qualified alternative"
                >
                  <CheckCircle size={9} />
                  {alt.length > 40 ? alt.slice(0, 38) + "…" : alt}
                </div>
              ))}

              {/* Blocked alternatives */}
              {row.blockedAlternatives.map((bv, i) => {
                const altValue = bv.vector.changedDimensions.find(s => s.dimension === row.dimensionName)?.to ?? "";
                const key = `b-${i}-${altValue}`;
                const isExpanded = expandedBlocked.has(key);
                return (
                  <div key={key} className="relative">
                    <button
                      onClick={() => setExpandedBlocked(prev => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key); else next.add(key);
                        return next;
                      })}
                      className="rounded px-2 py-1 text-[10px] flex items-center gap-1 transition-opacity hover:opacity-80"
                      style={{
                        background: "hsl(0 72% 50% / 0.07)",
                        border: "1px solid hsl(0 72% 50% / 0.3)",
                        color: "hsl(0 72% 50%)",
                      }}
                      title={`Blocked: ${bv.blockReason}`}
                    >
                      <Lock size={9} />
                      {altValue.length > 35 ? altValue.slice(0, 33) + "…" : altValue}
                      {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                    </button>

                    {isExpanded && (
                      <div
                        className="absolute z-10 left-0 mt-1 w-64 rounded-lg p-2.5 shadow-lg space-y-1.5"
                        style={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          top: "100%",
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className="text-[9px] font-bold px-1 py-0.5 rounded uppercase"
                            style={{
                              background: `${GATE_COLOURS[bv.blockedByGate] ?? "hsl(var(--muted))"}22`,
                              color: GATE_COLOURS[bv.blockedByGate] ?? "hsl(var(--muted-foreground))",
                            }}
                          >
                            {GATE_LABELS[bv.blockedByGate] ?? bv.blockedByGate}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          <strong>Why blocked:</strong> {bv.blockReason}
                        </p>
                        <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--primary))" }}>
                          <strong>What needs to change:</strong> {bv.whatNeedsToChange}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {totalAlts === 0 && (
                <span className="text-[10px] text-muted-foreground italic">
                  No alternatives explored yet.
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MorphologicalExplorerPanel({
  steeringContext,
  onVectorsSelected,
}: MorphologicalExplorerPanelProps) {
  const analysis = useAnalysis();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MorphologicalSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [selectedVectorIds, setSelectedVectorIds] = useState<Set<string>>(new Set());
  const [dismissedVectorIds, setDismissedVectorIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"vectors" | "zwicky">("vectors");

  const runExploration = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      // Extract evidence from the current analysis state
      const products = analysis.products || [];
      const selectedProduct = analysis.selectedProduct;
      const disruptData = analysis.disruptData as Record<string, unknown> | null;
      const governedData = analysis.governedData as Record<string, unknown> | null;

      // Build evidence from product data
      const evidenceMap = extractAllEvidence({
        products,
        selectedProduct,
        disruptData,
        redesignData: null,
        stressTestData: null,
        pitchDeckData: null,
        governedData,
        businessAnalysisData: null,
        intelligence: null,
      });
      const flatEv = flattenEvidence(evidenceMap);

      if (flatEv.length < 5) {
        setError("Not enough evidence to explore the design space. Run the full analysis first.");
        setIsRunning(false);
        return;
      }

      // Extract constraints and leverage points from disrupt/governed data
      const constraints: StrategicInsight[] = [];
      const leveragePoints: StrategicInsight[] = [];

      // Pull from governed constraint map
      if (governedData?.constraint_map) {
        const cm = governedData.constraint_map as Record<string, unknown>;
        const frictionTiers = (cm.friction_tiers as any[]) || [];
        frictionTiers.forEach((tier: any, i: number) => {
          if (tier.constraint || tier.label) {
            constraints.push({
              id: `gov-c-${i}`,
              label: tier.constraint || tier.label || `Constraint ${i + 1}`,
              description: tier.description || tier.rationale || "",
              impact: tier.severity === "critical" ? 9 : tier.severity === "high" ? 7 : 5,
              confidence: tier.confidence ?? 0.7,
              confidenceScore: tier.confidence ?? 0.7,
              evidenceIds: [],
              type: "constraint" as any,
            } as any);
          }
        });
      }

      // Pull leverage from governed data
      if (governedData?.leverage_map) {
        const lm = governedData.leverage_map as Record<string, unknown>;
        const levers = (lm.leverage_points as any[]) || (lm.levers as any[]) || [];
        levers.forEach((lev: any, i: number) => {
          leveragePoints.push({
            id: `gov-l-${i}`,
            label: lev.label || lev.name || `Leverage ${i + 1}`,
            description: lev.description || lev.mechanism || "",
            impact: lev.score ?? lev.leverage_score ?? 7,
            confidence: 0.8,
            confidenceScore: 0.8,
            evidenceIds: [],
            type: "leverage" as any,
          } as any);
        });
      }

      // Run the morphological search (deterministic, no AI cost, <100ms)
      const searchResult = runMorphologicalSearch(
        flatEv,
        constraints,
        leveragePoints,
        [], // No AI alternatives — deterministic only
      );

      setResult(searchResult);

      // Persist to analysis_data for downstream use
      await analysis.saveStepData("morphologicalExploration", {
        zones: searchResult.zones,
        vectorCount: searchResult.vectors.length,
        blockedCount: searchResult.blockedVectors.length,
        zwickyRowCount: searchResult.zwickyBox.length,
        hotDimensions: searchResult.hotCount,
        warmDimensions: searchResult.warmCount,
        steeringContext: steeringContext || null,
        generatedAt: new Date().toISOString(),
      });

      // Auto-expand all zones
      setExpandedZones(new Set(searchResult.zones.map(z => z.id)));
    } catch (err: any) {
      console.error("[Morphological] Exploration failed:", err);
      setError(err.message || "Design space exploration failed");
    } finally {
      setIsRunning(false);
    }
  }, [analysis, steeringContext]);

  const toggleZone = useCallback((zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }, []);

  const toggleVectorSelection = useCallback((vectorId: string) => {
    setSelectedVectorIds(prev => {
      const next = new Set(prev);
      if (next.has(vectorId)) next.delete(vectorId);
      else next.add(vectorId);
      return next;
    });
  }, []);

  const dismissVector = useCallback((vectorId: string) => {
    setDismissedVectorIds(prev => new Set([...prev, vectorId]));
    setSelectedVectorIds(prev => {
      const next = new Set(prev);
      next.delete(vectorId);
      return next;
    });
  }, []);

  // Send selected vectors downstream
  const handleSendToRedesign = useCallback(() => {
    if (!result) return;
    const selected = result.vectors.filter(v => selectedVectorIds.has(v.id));
    onVectorsSelected?.(selected);
    // Mark downstream steps as outdated so redesign picks up new input
    analysis.markStepOutdated("redesign");
    analysis.markStepOutdated("stressTest");
    analysis.markStepOutdated("pitchDeck");
  }, [result, selectedVectorIds, onVectorsSelected, analysis]);

  // Filter visible vectors
  const visibleZones = useMemo(() => {
    if (!result) return [];
    return result.zones.map(zone => ({
      ...zone,
      vectors: zone.vectors.filter(v => !dismissedVectorIds.has(v.id)),
    })).filter(zone => zone.vectors.length > 0);
  }, [result, dismissedVectorIds]);

  // ── Not yet run: Show the launch button ──
  if (!result && !isRunning) {
    return (
      <div
        className="rounded-xl p-4 mt-4"
        style={{
          background: "hsl(var(--muted) / 0.5)",
          border: "1px dashed hsl(var(--border))",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <Grid3X3 size={16} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Morphological Design Space</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Systematically explore alternative business configurations by shifting 1–2 dimensions at a time.
              These are structural possibilities — some may be unviable, but they can spark unexpected directions.
            </p>
            <button
              onClick={runExploration}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Grid3X3 size={12} />
              Explore Design Space
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Running ──
  if (isRunning) {
    return (
      <div
        className="rounded-xl p-5 mt-4 text-center"
        style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
      >
        <div className="animate-spin inline-block mb-2">
          <Grid3X3 size={20} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <p className="text-sm font-bold text-foreground">Exploring design space…</p>
        <p className="text-xs text-muted-foreground mt-1">Mapping dimensions, generating vectors, qualifying opportunities</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div
        className="rounded-xl p-4 mt-4 flex items-center gap-2"
        style={{ background: "hsl(var(--destructive) / 0.1)", border: "1px solid hsl(var(--destructive) / 0.3)" }}
      >
        <AlertTriangle size={14} style={{ color: "hsl(var(--destructive))" }} />
        <p className="text-xs text-foreground">{error}</p>
      </div>
    );
  }

  // ── Results ──
  const totalVectors = result?.vectors.length || 0;
  const visibleVectorCount = visibleZones.reduce((s, z) => s + z.vectors.length, 0);

  return (
    <div className="mt-4 space-y-3">
      {/* Header */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.15)" }}
      >
        <div className="flex items-center gap-2">
          <Grid3X3 size={14} style={{ color: "hsl(var(--primary))" }} />
          <div>
            <p className="text-xs font-bold text-foreground">
              Design Space: {visibleVectorCount} opportunity vectors across {visibleZones.length} zones
            </p>
            <p className="text-[10px] text-muted-foreground">
              {result?.hotCount || 0} constraint-linked dimensions · {result?.warmCount || 0} adjacency dimensions
              {dismissedVectorIds.size > 0 && ` · ${dismissedVectorIds.size} dismissed`}
              {result?.blockedVectors?.length ? ` · ${result.blockedVectors.length} blocked` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runExploration}
            className="text-[10px] px-2 py-1 rounded font-semibold transition-colors hover:opacity-80"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            Re-explore
          </button>
          {selectedVectorIds.size > 0 && (
            <button
              onClick={handleSendToRedesign}
              className="flex items-center gap-1 text-[10px] px-3 py-1 rounded font-bold transition-colors hover:opacity-90"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              Send {selectedVectorIds.size} to Redesign <ArrowRight size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "hsl(var(--muted) / 0.5)" }}>
        <button
          onClick={() => setActiveTab("vectors")}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-all"
          style={{
            background: activeTab === "vectors" ? "hsl(var(--card))" : "transparent",
            color: activeTab === "vectors" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            boxShadow: activeTab === "vectors" ? "0 1px 2px hsl(0 0% 0% / 0.1)" : "none",
          }}
        >
          <Grid3X3 size={11} />
          Opportunity Vectors
        </button>
        <button
          onClick={() => setActiveTab("zwicky")}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-all"
          style={{
            background: activeTab === "zwicky" ? "hsl(var(--card))" : "transparent",
            color: activeTab === "zwicky" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            boxShadow: activeTab === "zwicky" ? "0 1px 2px hsl(0 0% 0% / 0.1)" : "none",
          }}
        >
          <Table2 size={11} />
          Zwicky Box
          {(result?.blockedVectors?.length ?? 0) > 0 && (
            <span
              className="text-[9px] font-bold px-1 py-0.5 rounded"
              style={{ background: "hsl(0 72% 50% / 0.1)", color: "hsl(0 72% 50%)" }}
            >
              {result!.blockedVectors.length} blocked
            </span>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(var(--accent) / 0.3)" }}>
        <Lightbulb size={12} className="shrink-0 mt-0.5" style={{ color: "hsl(var(--accent-foreground))" }} />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {activeTab === "vectors"
            ? "These are structural possibilities, not validated ideas. Select promising vectors to feed into the Redesign step, or dismiss ones that don't fit your direction."
            : "The Zwicky box shows all explored configurations per dimension. Green = qualified alternative; Red = blocked combination with reasoning."}
        </p>
      </div>

      {/* Tab content */}
      {activeTab === "zwicky" ? (
        <ZwickyBoxView rows={result?.zwickyBox ?? []} />
      ) : (
        <>
          {/* Zones */}
          {visibleZones.map(zone => (
            <div
              key={zone.id}
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid hsl(var(--border))" }}
            >
              <button
                onClick={() => toggleZone(zone.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
                style={{ background: "hsl(var(--card))" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{zone.theme}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {zone.vectors.length} vectors
                  </span>
                </div>
                {expandedZones.has(zone.id) ? (
                  <ChevronUp size={12} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={12} className="text-muted-foreground" />
                )}
              </button>

              {expandedZones.has(zone.id) && (
                <div className="px-3 pb-3 space-y-2">
                  {zone.vectors.map(vector => {
                    const isSelected = selectedVectorIds.has(vector.id);
                    return (
                      <div
                        key={vector.id}
                        className="rounded-lg px-3 py-2.5 transition-all cursor-pointer"
                        style={{
                          background: isSelected ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.5)",
                          border: isSelected
                            ? "1.5px solid hsl(var(--primary) / 0.4)"
                            : "1px solid hsl(var(--border) / 0.5)",
                        }}
                        onClick={() => toggleVectorSelection(vector.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Dimension shifts */}
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {vector.changedDimensions.map((shift, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "hsl(var(--secondary))",
                                    color: "hsl(var(--secondary-foreground))",
                                  }}
                                >
                                  <span className="line-through opacity-60">{truncate(shift.from, 20)}</span>
                                  <ArrowRight size={8} />
                                  <span className="font-semibold">{truncate(shift.to, 25)}</span>
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {vector.rationale}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background: vector.explorationMode === "constraint"
                                    ? "hsl(var(--destructive) / 0.1)"
                                    : "hsl(var(--primary) / 0.1)",
                                  color: vector.explorationMode === "constraint"
                                    ? "hsl(var(--destructive))"
                                    : "hsl(var(--primary))",
                                }}
                              >
                                {vector.explorationMode === "constraint" ? "Constraint-driven" : "Adjacency"}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {vector.explorationType.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isSelected && (
                              <span className="text-[9px] font-bold" style={{ color: "hsl(var(--primary))" }}>
                                ✓ Selected
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissVector(vector.id); }}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Dismiss this vector"
                            >
                              <X size={11} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {visibleZones.length === 0 && totalVectors > 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              All vectors dismissed. Click "Re-explore" to generate new ones.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
