import React from "react";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Brain, ChevronDown, Atom, ArrowRight, Route } from "lucide-react";
import { type StrategicHypothesis } from "@/lib/strategicOS";
import type { Product } from "@/data/mockProducts";

interface StructureTabProps {
  selectedProduct: Product;
  analysis: any; // AnalysisContext
  governedData: Record<string, unknown> | null;
  synopsisData: any;
  rawHypotheses: StrategicHypothesis[] | null;
  hasDisruptData: boolean;
  hasSynopsis: boolean;
  hasHypotheses: boolean;
  ranking: any;
  products: Product[];
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}

function StructureSection({
  title,
  icon: Icon,
  defaultOpen,
  children,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl text-left transition-all cursor-pointer"
        style={{
          background: open ? "hsl(var(--card))" : "hsl(var(--card))",
          border: `1.5px solid ${open ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--foreground))" }}>
            <Icon size={15} style={{ color: "hsl(var(--background))" }} />
          </div>
          <span className="text-base font-bold text-foreground">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              {badge}
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-foreground/40 transition-transform flex-shrink-0" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── First Principles Display ── */
function FirstPrinciplesSection({ governedData }: { governedData: Record<string, unknown> | null }) {
  const fp = governedData?.first_principles as {
    minimum_viable_system?: string;
    causal_model?: { inputs?: string[]; mechanism?: string; outputs?: string[] };
    fundamental_constraints?: string[];
    resource_limits?: string[];
    behavioral_realities?: string[];
    dependency_structure?: string[];
    viability_assumptions?: Array<{ assumption: string; evidence_status: string; leverage_if_wrong: number }>;
  } | undefined;

  if (!fp) {
    return (
      <div className="text-center py-8 space-y-2">
        <Atom size={28} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
        <p className="text-sm font-bold text-foreground">No first principles data yet</p>
        <p className="text-xs text-muted-foreground">Run the analysis to decompose this system into fundamental truths.</p>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    verified: { bg: "hsl(142 70% 40% / 0.12)", text: "hsl(142 70% 40%)", label: "Verified" },
    modeled: { bg: "hsl(38 92% 50% / 0.12)", text: "hsl(38 92% 50%)", label: "Modeled" },
    speculative: { bg: "hsl(0 70% 50% / 0.12)", text: "hsl(0 70% 50%)", label: "Speculative" },
  };

  return (
    <div className="space-y-5">
      {/* ── 1. Fundamental Constraints (what holds the system back) ── */}
      {fp.fundamental_constraints && fp.fundamental_constraints.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Fundamental Constraints</p>
          <ul className="space-y-1">
            {fp.fundamental_constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(0 70% 50%)" }} />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resource Limits */}
      {fp.resource_limits && fp.resource_limits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Resource Limits</p>
          <ul className="space-y-1">
            {fp.resource_limits.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(38 92% 50%)" }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Behavioral Realities */}
      {fp.behavioral_realities && fp.behavioral_realities.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Behavioral Realities</p>
          <ul className="space-y-1">
            {fp.behavioral_realities.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(271 81% 50%)" }} />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dependency Structure */}
      {fp.dependency_structure && fp.dependency_structure.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Dependency Structure</p>
          <ul className="space-y-1">
            {fp.dependency_structure.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(217 91% 55%)" }} />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 2. Causal Model (system structure — moved to end) ── */}
      {fp.minimum_viable_system && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Minimum Viable System</p>
          <p className="text-sm leading-relaxed text-foreground">{fp.minimum_viable_system}</p>
        </div>
      )}

      {fp.causal_model && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Causal Model</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
            {/* Inputs */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Inputs</p>
              <div className="flex flex-wrap gap-1.5">
                {(fp.causal_model.inputs || []).map((inp, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                    {inp}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground hidden sm:block flex-shrink-0" />
            {/* Mechanism */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Mechanism</p>
              <p className="text-xs leading-relaxed text-foreground font-medium">{fp.causal_model.mechanism}</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground hidden sm:block flex-shrink-0" />
            {/* Outputs */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Outputs</p>
              <div className="flex flex-wrap gap-1.5">
                {(fp.causal_model.outputs || []).map((out, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                    {out}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Unified Assumptions & Leverage Section ── */
function UnifiedAssumptionsSection({
  governedData,
  hiddenAssumptions,
}: {
  governedData: Record<string, unknown> | null;
  hiddenAssumptions: any[];
}) {
  const fp = governedData?.first_principles as {
    viability_assumptions?: Array<{ assumption: string; evidence_status: string; leverage_if_wrong: number }>;
  } | undefined;

  const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    verified: { bg: "hsl(142 70% 40% / 0.12)", text: "hsl(142 70% 40%)", label: "Verified" },
    modeled: { bg: "hsl(38 92% 50% / 0.12)", text: "hsl(38 92% 50%)", label: "Modeled" },
    speculative: { bg: "hsl(0 70% 50% / 0.12)", text: "hsl(0 70% 50%)", label: "Speculative" },
  };

  const REASON_COLORS: Record<string, string> = {
    tradition: "hsl(38 92% 45%)",
    manufacturing: "hsl(220 10% 45%)",
    cost: "hsl(142 70% 35%)",
    physics: "hsl(0 70% 50%)",
    habit: "hsl(271 81% 50%)",
  };

  // Merge viability assumptions + hidden assumptions into a single list
  type UnifiedAssumption = {
    assumption: string;
    source: "viability" | "hidden";
    evidence_status?: string;
    leverage: number;
    isChallengeable?: boolean;
    challengeIdea?: string;
    currentAnswer?: string;
    reason?: string;
    impactScenario?: string;
    competitiveBlindSpot?: string;
    urgencySignal?: string;
    urgencyReason?: string;
  };

  const unified: UnifiedAssumption[] = [];

  // Add viability assumptions
  if (fp?.viability_assumptions) {
    for (const va of fp.viability_assumptions) {
      unified.push({
        assumption: va.assumption,
        source: "viability",
        evidence_status: va.evidence_status,
        leverage: va.leverage_if_wrong,
      });
    }
  }

  // Add hidden assumptions (deduplicate by text similarity)
  for (const ha of hiddenAssumptions) {
    const isDuplicate = unified.some(
      (u) => u.assumption.toLowerCase().trim() === ha.assumption?.toLowerCase().trim()
    );
    if (!isDuplicate) {
      unified.push({
        assumption: ha.assumption,
        source: "hidden",
        leverage: ha.leverageScore || 0,
        isChallengeable: ha.isChallengeable,
        challengeIdea: ha.challengeIdea,
        currentAnswer: ha.currentAnswer,
        reason: ha.reason,
        impactScenario: ha.impactScenario,
        competitiveBlindSpot: ha.competitiveBlindSpot,
        urgencySignal: ha.urgencySignal,
        urgencyReason: ha.urgencyReason,
      });
    }
  }

  // Sort by leverage score descending
  unified.sort((a, b) => b.leverage - a.leverage);

  if (unified.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <Brain size={28} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
        <p className="text-sm font-bold text-foreground">No assumptions identified yet</p>
        <p className="text-xs text-muted-foreground">Run the analysis to uncover hidden assumptions and their leverage potential.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {unified.map((item, i) => {
        const leverageColor = item.leverage >= 8 ? "hsl(0 70% 50%)" : item.leverage >= 5 ? "hsl(38 92% 50%)" : "hsl(220 10% 55%)";
        const reasonColor = item.reason ? REASON_COLORS[item.reason] || "hsl(220 10% 55%)" : undefined;
        const status = item.evidence_status ? STATUS_COLORS[item.evidence_status] || STATUS_COLORS.speculative : undefined;
        const hasInsight = item.impactScenario || item.competitiveBlindSpot;

        return (
          <div
            key={i}
            className="rounded-lg overflow-hidden"
            style={{
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              borderLeft: reasonColor ? `3px solid ${reasonColor}` : undefined,
            }}
          >
            <div className="p-3">
              <p className="text-sm text-foreground leading-relaxed font-medium">{item.assumption}</p>

              {item.currentAnswer && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.currentAnswer}</p>
              )}

              {/* Tags row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Leverage score */}
                <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full" style={{ background: leverageColor + "18", color: leverageColor }}>
                  Leverage: {item.leverage}/10
                </span>
                {/* Evidence status */}
                {status && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: status.bg, color: status.text }}>
                    {status.label}
                  </span>
                )}
                {/* Reason category */}
                {item.reason && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: (reasonColor || "hsl(220 10% 55%)") + "18", color: reasonColor }}>
                    {item.reason.charAt(0).toUpperCase() + item.reason.slice(1)}
                  </span>
                )}
                {item.isChallengeable && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(271 81% 55% / 0.12)", color: "hsl(271 81% 55%)" }}>
                    Challengeable
                  </span>
                )}
                {item.urgencySignal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                    background: item.urgencySignal === "eroding" ? "hsl(0 70% 50% / 0.12)" : item.urgencySignal === "emerging" ? "hsl(142 70% 40% / 0.12)" : "hsl(220 10% 55% / 0.12)",
                    color: item.urgencySignal === "eroding" ? "hsl(0 70% 50%)" : item.urgencySignal === "emerging" ? "hsl(142 70% 40%)" : "hsl(220 10% 55%)",
                  }}>
                    {item.urgencySignal.charAt(0).toUpperCase() + item.urgencySignal.slice(1)}
                  </span>
                )}
              </div>

              {/* Challenge approach */}
              {item.challengeIdea && (
                <div className="mt-2 p-2 rounded-md text-xs leading-relaxed" style={{ background: "hsl(271 81% 55% / 0.06)", border: "1px solid hsl(271 81% 55% / 0.15)" }}>
                  <span className="font-bold" style={{ color: "hsl(271 81% 55%)" }}>Challenge approach: </span>
                  <span className="text-foreground">{item.challengeIdea}</span>
                </div>
              )}

              {/* Strategic Insight annotations (folded deep insights) */}
              {hasInsight && (
                <div className="mt-2 space-y-1">
                  {item.impactScenario && (
                    <div className="p-2 rounded-md text-xs leading-relaxed" style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
                      <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>Impact scenario: </span>
                      <span className="text-foreground">{item.impactScenario}</span>
                    </div>
                  )}
                  {item.competitiveBlindSpot && (
                    <div className="p-2 rounded-md text-xs leading-relaxed" style={{ background: "hsl(38 92% 50% / 0.06)", border: "1px solid hsl(38 92% 50% / 0.15)" }}>
                      <span className="font-bold" style={{ color: "hsl(38 92% 45%)" }}>Competitive blind spot: </span>
                      <span className="text-foreground">{item.competitiveBlindSpot}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StructureTab({
  selectedProduct,
  analysis,
  governedData,
  synopsisData,
  rawHypotheses,
  hasDisruptData,
  hasSynopsis,
  hasHypotheses,
  ranking,
  products,
  runTrigger,
  onLoadingChange,
}: StructureTabProps) {
  const assumptions = (analysis.disruptData as any)?.hiddenAssumptions || [];

  return (
    <div className="space-y-3">
      {/* ── First Principles Methodology Banner ── */}
      <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Brain size={18} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>First Principles Decomposition</h3>
          </div>
        </div>
        <p className="text-sm font-bold leading-relaxed pl-[48px]" style={{ color: "white" }}>
          Strip away convention, analogy, and industry norms. Every assumption is decomposed to its root cause — tradition, cost, physics, manufacturing limits, or habit.
        </p>
      </div>

      {/* ── Evaluation Path (from reasoning synopsis) ── */}
      {(() => {
        const ep = (synopsisData as any)?.evaluation_path;
        if (!ep) return null;
        const dims: string[] = ep.dimensions_examined || [];
        const logic: string = ep.evaluation_logic || "";
        const excluded: string = ep.eliminated_dimensions || "";
        return (
          <div className="rounded-xl px-5 py-4 space-y-3" style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                <Route size={15} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Evaluation Path</p>
            </div>
            {dims.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {dims.map((d, i) => (
                  <React.Fragment key={i}>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                      {d}
                    </span>
                    {i < dims.length - 1 && <ArrowRight size={10} className="text-muted-foreground/40 flex-shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            )}
            {logic && <p className="text-sm text-foreground leading-relaxed">{logic}</p>}
            {excluded && (
              <div className="pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Excluded Dimensions</p>
                <p className="text-sm text-foreground leading-relaxed">{excluded}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Fundamental Constraints & System Structure */}
      <StructureSection
        title="Fundamental Constraints"
        icon={Atom}
        defaultOpen={true}
        badge={hasDisruptData ? "Decomposed" : undefined}
      >
        <FirstPrinciplesSection governedData={governedData} />
      </StructureSection>

      {/* Unified Assumptions & Leverage */}
      <StructureSection
        title="Assumptions & Leverage"
        icon={Brain}
        defaultOpen={hasDisruptData}
        badge={(() => {
          const hiddenCount = assumptions.length;
          const viabilityCount = ((governedData?.first_principles as any)?.viability_assumptions || []).length;
          const total = hiddenCount + viabilityCount;
          return total > 0 ? `${total} identified` : undefined;
        })()}
      >
        <UnifiedAssumptionsSection
          governedData={governedData}
          hiddenAssumptions={assumptions}
        />
      </StructureSection>

      {/* Analysis Engine (still needed for running/re-running the core analysis) */}
      <div className="hidden">
        <FirstPrinciplesAnalysis
          product={selectedProduct}
          onSaved={() => analysis.setSavedRefreshTrigger((n: number) => n + 1)}
          flippedIdeas={selectedProduct.flippedIdeas}
          onRegenerateIdeas={(ctx: string | undefined) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
          generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
          externalData={analysis.disruptData}
          runTrigger={runTrigger}
          onLoadingChange={onLoadingChange}
          onAnalysisStarted={() => { analysis.setGovernedData(null); }}
          onDataLoaded={(d: unknown) => {
            analysis.setDisruptData(d);
            analysis.saveStepData("disrupt", d);
            analysis.markStepOutdated("redesign");
            analysis.markStepOutdated("stressTest");
            analysis.markStepOutdated("pitch");
          }}
          onPatentSave={(patentData: unknown) => {
            const updated = products.map((p: Product) =>
              p.id === selectedProduct.id ? { ...p, patentData } : p
            );
            analysis.setProducts(updated);
            analysis.setSelectedProduct({ ...selectedProduct, patentData });
            if (analysis.analysisParams) analysis.saveAnalysis(updated, analysis.analysisParams);
          }}
          userScores={analysis.userScores}
          onScoreChange={(ideaId: string, scoreKey: string, value: number) => {
            analysis.setUserScore(ideaId, scoreKey, value);
            analysis.saveStepData("userScores", {
              ...analysis.userScores,
              [ideaId]: { ...(analysis.userScores[ideaId] || {}), [scoreKey]: value },
            });
          }}
        />
      </div>

    </div>
  );
}
