import React, { useMemo, forwardRef } from "react";
import { useCompetitiveResearch } from "@/hooks/useCompetitiveResearch";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Brain, ChevronDown, Atom, ArrowRight, Route, Network, LayoutDashboard, Loader2, BarChart3, Flame, Gauge, GitBranch, Target, Crosshair } from "lucide-react";
import { type StrategicHypothesis } from "@/lib/strategicOS";
import type { Product } from "@/data/mockProducts";
import { type LensType } from "@/lib/multiLensEngine";
import { buildSystemIntelligence, invalidateIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { SystemLeverageMapView } from "@/components/SystemLeverageMap";
import { StrategicCommandDeck } from "@/components/StrategicCommandDeck";
import { OpportunityMatrix } from "@/components/OpportunityMatrix";
import { FrictionHeatmap } from "@/components/FrictionHeatmap";
import { ETAExecutionPanel } from "@/components/ETAExecutionPanel";
import { ETAAcquisitionScorecard } from "@/components/ETAAcquisitionScorecard";
import { CausalConstraintMap } from "@/components/CausalConstraintMap";
import { CausalConstraintSankey } from "@/components/CausalConstraintSankey";
import { CompetitiveLandscape } from "@/components/CompetitiveLandscape";

export type StructureViewMode = "assumptions" | "deconstruct" | "all";

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
  /** Which sub-tab to render. Defaults to "all" (legacy behavior). */
  viewMode?: StructureViewMode;
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
function ConstraintList({ items, dotColor }: { items: string[]; dotColor: string }) {
  return (
    <ul className="space-y-1">
      {items.map((c, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor }} />
          {c}
        </li>
      ))}
    </ul>
  );
}

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
        <p className="text-sm font-bold text-foreground">No structural data yet</p>
        <p className="text-xs text-muted-foreground">Run the analysis to decompose this system into fundamental truths.</p>
      </div>
    );
  }

  // Collapsible constraint groups — progressive disclosure
  const groups: { label: string; items: string[]; dotColor: string; defaultOpen: boolean }[] = [
    { label: "Fundamental Constraints", items: fp.fundamental_constraints || [], dotColor: "hsl(0 70% 50%)", defaultOpen: true },
    { label: "Resource Limits", items: fp.resource_limits || [], dotColor: "hsl(38 92% 50%)", defaultOpen: false },
    { label: "Behavioral Realities", items: fp.behavioral_realities || [], dotColor: "hsl(271 81% 50%)", defaultOpen: false },
    { label: "Dependency Structure", items: fp.dependency_structure || [], dotColor: "hsl(217 91% 55%)", defaultOpen: false },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-3">
      {/* Constraint groups — collapsed by default except first */}
      {groups.map((group) => (
        <CollapsibleConstraintGroup
          key={group.label}
          label={`${group.label} (${group.items.length})`}
          items={group.items}
          dotColor={group.dotColor}
          defaultOpen={group.defaultOpen}
        />
      ))}

      {/* Causal Model — always visible as a visual framework */}
      {fp.causal_model && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Causal Model</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
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
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Mechanism</p>
              <p className="text-xs leading-relaxed text-foreground font-medium">{fp.causal_model.mechanism}</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground hidden sm:block flex-shrink-0" />
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

      {/* Minimum Viable System — expandable */}
      {fp.minimum_viable_system && (
        <Collapsible>
          <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors" style={{ border: "1px solid hsl(var(--border))" }}>
            <span className="text-xs font-bold text-foreground">Minimum Viable System</span>
            <ChevronDown size={12} className="text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="text-sm leading-relaxed text-foreground px-3 py-2">{fp.minimum_viable_system}</p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

/* Collapsible constraint group helper */
function CollapsibleConstraintGroup({ label, items, dotColor, defaultOpen }: { label: string; items: string[]; dotColor: string; defaultOpen: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors" style={{ border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <span className="text-xs font-bold text-foreground">{label}</span>
        </div>
        <ChevronDown size={12} className="text-muted-foreground transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 py-2">
          <ConstraintList items={items} dotColor={dotColor} />
        </div>
      </CollapsibleContent>
    </Collapsible>
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
        const hasDeepInsight = item.challengeIdea || item.impactScenario || item.competitiveBlindSpot;

        return (
          <AssumptionCard
            key={i}
            item={item}
            leverageColor={leverageColor}
            reasonColor={reasonColor}
            status={status}
            hasDeepInsight={!!hasDeepInsight}
          />
        );
      })}
    </div>
  );
}

/* ── Assumption Card with progressive disclosure ── */
function AssumptionCard({ item, leverageColor, reasonColor, status, hasDeepInsight }: {
  item: any;
  leverageColor: string;
  reasonColor?: string;
  status?: { bg: string; text: string; label: string };
  hasDeepInsight: boolean;
}) {
  const [showDetail, setShowDetail] = React.useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        borderLeft: reasonColor ? `3px solid ${reasonColor}` : undefined,
      }}
    >
      <div className="p-3">
        <p className="text-sm text-foreground leading-relaxed font-medium">{item.assumption}</p>

        {/* Tags row — always visible */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full" style={{ background: leverageColor + "18", color: leverageColor }}>
            Leverage: {item.leverage >= 8 ? "High" : item.leverage >= 5 ? "Moderate" : "Low"}
          </span>
          {status && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: status.bg, color: status.text }}>
              {status.label}
            </span>
          )}
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

        {/* Progressive disclosure toggle for deep insights */}
        {hasDeepInsight && (
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown size={11} className="transition-transform" style={{ transform: showDetail ? "rotate(180deg)" : "none" }} />
            {showDetail ? "Hide insights" : "View insights"}
          </button>
        )}

        {/* Collapsed detail content */}
        {showDetail && (
          <div className="mt-2 space-y-1.5">
            {item.currentAnswer && (
              <p className="text-xs text-muted-foreground leading-relaxed">{item.currentAnswer}</p>
            )}
            {item.challengeIdea && (
              <div className="p-2 rounded-md text-xs leading-relaxed" style={{ background: "hsl(271 81% 55% / 0.06)", border: "1px solid hsl(271 81% 55% / 0.15)" }}>
                <span className="font-bold" style={{ color: "hsl(271 81% 55%)" }}>Challenge approach: </span>
                <span className="text-foreground">{item.challengeIdea}</span>
              </div>
            )}
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
}

export const StructureTab = forwardRef<HTMLDivElement, StructureTabProps>(function StructureTab({
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
  viewMode = "all",
}, ref) {
  const assumptions = (analysis.disruptData as any)?.hiddenAssumptions || [];
  const showAssumptions = viewMode === "all" || viewMode === "assumptions";
  const showDeconstruct = viewMode === "all" || viewMode === "deconstruct";

  // Competitive intelligence from CIM-extracted competitor names
  const biExtractionData = (analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null;
  const competitiveResearch = useCompetitiveResearch({
    biExtraction: biExtractionData,
    governedData,
    analysisId: selectedProduct.id || "unknown",
    autoTrigger: true,
  });

  return (
    <div ref={ref} className="space-y-3">
      {/* ── First Principles Methodology Banner (Assumptions view) ── */}
      {showAssumptions && (
        <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Brain size={18} style={{ color: "white" }} />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>
                {viewMode === "assumptions" ? "Assumptions & Constraints" : "Structural Decomposition"}
              </h3>
            </div>
          </div>
          <p className="text-sm font-bold leading-relaxed pl-[48px]" style={{ color: "white" }}>
            {viewMode === "assumptions"
              ? "Hidden assumptions and structural constraints ranked by strategic leverage potential."
              : "Structural constraints, leverage points, and root forces governing this market — stripped of convention and ranked by disruption potential."}
          </p>
        </div>
      )}

      {/* ── Evaluation Path (Assumptions view) ── */}
      {showAssumptions && (() => {
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
                    {i < dims.length - 1 && <ArrowRight size={16} className="text-foreground flex-shrink-0" strokeWidth={2.5} />}
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

      {/* ── System Intelligence Layer ── */}
      {(() => {
        const disruptData = analysis.disruptData as Record<string, unknown> | null;
        const businessData = analysis.businessAnalysisData as Record<string, unknown> | null;
        const flipIdeas = (disruptData?.flippedIdeas || selectedProduct?.flippedIdeas || []) as unknown[];
        const activeModes = (analysis.adaptiveContext?.activeModes || [analysis.mainTab === "service" ? "service" : analysis.mainTab === "business" ? "business" : "product"]) as LensType[];

        // Loading fallback
        if (!governedData) {
          return (
            <div className="rounded-xl p-8 flex flex-col items-center gap-3 animate-fade-in" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
              <p className="text-sm font-semibold text-muted-foreground">Building System Intelligence…</p>
              <p className="text-xs text-muted-foreground/60">Analyzing structural constraints and leverage points</p>
            </div>
          );
        }

        const intelligenceInput: SystemIntelligenceInput = {
          analysisId: selectedProduct.id || "unknown",
          governedData,
          disruptData,
          businessAnalysisData: businessData,
          intelData: null,
          flipIdeas,
          activeLenses: activeModes.length > 1 ? activeModes : ["product", "service", "business"],
        };

        const systemIntelligence = buildSystemIntelligence(intelligenceInput);

        if (!systemIntelligence.leverageMap) return null;

        const { artifactScored, heuristicScored } = systemIntelligence.provenanceReport;
        const provenanceBadge = artifactScored > 0
          ? `${Math.round((artifactScored / (artifactScored + heuristicScored)) * 100)}% artifact-scored`
          : undefined;

        return (
          <>
            {/* ── Deconstruct view: LeverageMap + FrictionHeatmap ── */}
            {showDeconstruct && (
              <>
                {/* Strategic Command Deck — visible in deconstruct */}
                <StructureSection
                  title="Strategic Command Deck"
                  icon={LayoutDashboard}
                  defaultOpen={true}
                  badge={systemIntelligence.convergenceZones.length > 0
                    ? `${systemIntelligence.convergenceZones.length} convergence zone${systemIntelligence.convergenceZones.length !== 1 ? "s" : ""}`
                    : undefined}
                >
                  <StrategicCommandDeck
                    commandDeck={systemIntelligence.commandDeck}
                    convergenceCount={systemIntelligence.convergenceZones.length}
                    expandedFriction={systemIntelligence.expandedFriction}
                    provenanceRegistry={systemIntelligence.provenanceRegistry}
                    convergenceZoneDetails={systemIntelligence.convergenceZoneDetails}
                  />
                </StructureSection>

                {/* Causal Constraint Flow Map */}
                <StructureSection
                  title="Causal Constraint Flow"
                  icon={GitBranch}
                  defaultOpen={true}
                >
                  <CausalConstraintSankey commandDeck={systemIntelligence.commandDeck} />
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Detailed Node View</p>
                    <CausalConstraintMap commandDeck={systemIntelligence.commandDeck} />
                  </div>
                </StructureSection>


                {systemIntelligence.leverageMap && intelligenceInput.activeLenses.length >= 2 && (
                  <StructureSection
                    title="Cross-Lens Friction Heatmap"
                    icon={Flame}
                    defaultOpen={false}
                  >
                    <FrictionHeatmap
                      allNodes={systemIntelligence.leverageMap.nodes}
                      activeLenses={intelligenceInput.activeLenses}
                    />
                  </StructureSection>
                )}

                {/* System Leverage Map */}
                <StructureSection
                  title="System Leverage Map"
                  icon={Network}
                  defaultOpen={true}
                  badge={systemIntelligence.leverageMap.convergenceZones.length > 0
                    ? `${systemIntelligence.leverageMap.convergenceZones.length} convergence${provenanceBadge ? ` · ${provenanceBadge}` : ""}`
                    : provenanceBadge}
                >
                  <SystemLeverageMapView
                    map={systemIntelligence.leverageMap}
                    availableLenses={intelligenceInput.activeLenses}
                  />
                </StructureSection>

                {/* ETA Execution Assessment */}
                <StructureSection
                  title="Execution Assessment"
                  icon={Gauge}
                  defaultOpen={true}
                >
                  <ETAExecutionPanel
                    commandDeck={systemIntelligence.commandDeck}
                    expandedFriction={systemIntelligence.expandedFriction}
                    governedData={governedData}
                  />
                </StructureSection>

                {/* ETA Acquisition Scorecard */}
                <StructureSection
                  title="Acquisition Scorecard"
                  icon={Target}
                  defaultOpen={true}
                >
                  <ETAAcquisitionScorecard
                    governedData={governedData}
                    biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
                  />
                </StructureSection>

                {/* Competitive Landscape (auto-researched from CIM competitors) */}
                {(competitiveResearch.hasCompetitors || competitiveResearch.isLoading || competitiveResearch.data) && (
                  <StructureSection
                    title="Competitive Landscape"
                    icon={Crosshair}
                    defaultOpen={true}
                    badge={competitiveResearch.data ? `${competitiveResearch.data.competitorProfiles.length} profiled` : undefined}
                  >
                    <CompetitiveLandscape
                      data={competitiveResearch.data}
                      isLoading={competitiveResearch.isLoading}
                      error={competitiveResearch.error}
                      hasCompetitors={competitiveResearch.hasCompetitors}
                      competitorNames={competitiveResearch.competitorNames}
                      onResearch={competitiveResearch.runResearch}
                      benchmarks={competitiveResearch.benchmarks}
                      benchmarksLoading={competitiveResearch.benchmarksLoading}
                      onOverride={competitiveResearch.updateCompetitorOverride}
                    />
                  </StructureSection>
                )}
              </>
            )}

            {/* ── Assumptions view: Opportunity Matrix (constraint-driven) ── */}
            {showAssumptions && systemIntelligence.scoredOpportunities.length > 0 && systemIntelligence.scoringSummary && (
              <StructureSection
                title="Opportunity Matrix"
                icon={BarChart3}
                defaultOpen={true}
                badge={`${systemIntelligence.scoringSummary.breakthroughs} breakthrough${systemIntelligence.scoringSummary.breakthroughs !== 1 ? "s" : ""}`}
              >
                <OpportunityMatrix
                  opportunities={systemIntelligence.scoredOpportunities}
                  summary={systemIntelligence.scoringSummary}
                  governanceReport={systemIntelligence.governanceReport || undefined}
                  expandedFriction={systemIntelligence.expandedFriction || undefined}
                />
              </StructureSection>
            )}
          </>
        );
      })()}

      {/* Fundamental Constraints & System Structure (Assumptions view) */}
      {showAssumptions && (
        <StructureSection
          title="Fundamental Constraints"
          icon={Atom}
          defaultOpen={true}
          badge={hasDisruptData ? "Decomposed" : undefined}
        >
          <FirstPrinciplesSection governedData={governedData} />
        </StructureSection>
      )}

      {/* Unified Assumptions & Leverage (Assumptions view) */}
      {showAssumptions && (
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
      )}

      {/* Analysis Engine (hidden — runs the core analysis) */}
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
          onAnalysisStarted={() => { analysis.setGovernedData(null); invalidateIntelligence(selectedProduct.id || "unknown"); }}
          onDataLoaded={(d: unknown) => {
            analysis.setDisruptData(d);
            analysis.saveStepData("disrupt", d);
            analysis.markStepOutdated("redesign");
            analysis.markStepOutdated("stressTest");
            analysis.markStepOutdated("pitchDeck");
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
});
