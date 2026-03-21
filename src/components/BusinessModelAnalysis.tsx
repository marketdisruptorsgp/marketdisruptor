import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import {
  Brain, RefreshCw, Building2, Zap, DollarSign, Shield,
  AlertTriangle, CheckCircle2, Lightbulb, Users, BarChart3, Cpu,
  TrendingUp, Target, Rocket, Clock, FlipHorizontal,
  Wrench, Eye, Factory, FileDown, Calculator, Calendar,
  Search, TrendingDown, FileQuestion,
} from "lucide-react";
import { InsightRating } from "./InsightRating";
import { BundleDeepDive } from "./BundleDeepDive";
import { LeverageScore } from "./LeverageScore";
import { AnalysisVisualLayer } from "./AnalysisVisualLayer";
import { DealEconomicsPanel } from "./DealEconomicsPanel";
import { OwnershipPlaybook, type OwnershipPlaybookData } from "./OwnershipPlaybook";
import { getLensType } from "@/lib/etaLens";

// ── Standardized analysis components ──
import {
  StepCanvas,
  InsightCard,
  FrameworkPanel,
  SignalCard,
  OpportunityCard,
  VisualGrid,
  ExpandableDetail,
  MetricCard,
  EvidenceCard,
  AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";

export interface BusinessModelInput {
  type: string;
  description: string;
  revenueModel?: string;
  size?: string;
  geography?: string;
  painPoints?: string;
  notes?: string;
}

interface FrictionPoint {
  stage: string;
  friction: string;
  impact: "high" | "medium" | "low";
  rootCause: string;
  dataLabel?: string;
}

interface AutomationOpportunity {
  process: string;
  technology: string;
  costSaving: string;
  implementationDifficulty: "easy" | "medium" | "hard";
}

interface UntappedStream {
  stream: string;
  mechanism: string;
  estimatedSize: string;
  effort: "low" | "medium" | "high";
}

interface ImplementationPhase {
  phase: string;
  actions: string[];
  milestone: string;
}

interface HiddenAssumption {
  assumption: string;
  currentAnswer: string;
  category: string;
  isChallengeable: boolean;
  challengeIdea: string;
  leverageScore?: number;
  dataLabel?: string;
}

export interface BusinessModelAnalysisData {
  businessSummary?: {
    trueJobToBeDone?: string;
    currentModel?: string;
    marketPosition?: string;
    hiddenStrengths?: string[];
  };
  operationalAudit?: {
    customerJourney?: string[];
    frictionPoints?: FrictionPoint[];
    costStructure?: {
      fixedVsVariable?: string;
      biggestCostDrivers?: string[];
    };
    revenueLeaks?: string[];
  };
  hiddenAssumptions?: HiddenAssumption[];
  technologyLeverage?: {
    currentTechLevel?: string;
    automationOpportunities?: AutomationOpportunity[];
    aiOpportunities?: string[];
    platformOpportunity?: string;
  };
  revenueReinvention?: {
    currentRevenueMix?: string;
    untappedStreams?: UntappedStream[];
    pricingRedesign?: string;
    bundleOpportunities?: any[];
  };
  disruptionAnalysis?: {
    disruptorProfile?: string;
    vulnerabilities?: string[];
    defenseMoves?: string[];
    attackMoves?: string;
  };
  reinventedModel?: {
    modelName?: string;
    coreShift?: string;
    keyChanges?: string[];
    newValueProposition?: string;
    economicTransformation?: string;
    implementationRoadmap?: ImplementationPhase[];
    estimatedROI?: string;
    biggestRisk?: string;
    requiredCapabilities?: string[];
  };
  visualSpecs?: any[];
  actionPlans?: any[];
}

const IMPACT_MAP: Record<string, "threat" | "weakness" | "neutral"> = {
  high: "threat",
  medium: "weakness",
  low: "neutral",
};

const DIFFICULTY_MAP: Record<string, "strength" | "opportunity" | "neutral" | "threat" | "weakness"> = {
  easy: "strength",
  medium: "opportunity",
  hard: "neutral",
};

const CATEGORY_COLORS: Record<string, string> = {
  pricing: "hsl(142 70% 30%)",
  staffing: "hsl(217 91% 45%)",
  location: "hsl(38 92% 35%)",
  technology: "hsl(271 81% 45%)",
  customer: "hsl(330 80% 40%)",
  competition: "hsl(var(--destructive))",
  timing: "hsl(25 90% 40%)",
};

const BUSINESS_EXAMPLES = [
  "Laundromat", "Car wash", "Dry cleaner", "Storage facility", "Food truck",
  "Restaurant", "Gym / Fitness studio", "Cleaning service", "Landscaping company",
  "Distributor / Wholesaler", "Staffing agency", "Freight broker", "Import/Export business",
  "Accounting firm", "Law firm", "Real estate agency", "Insurance brokerage",
  "HVAC company", "Plumbing company", "Auto repair shop", "Vending machine operator",
];

export const BusinessModelAnalysis = ({ initialData, onSaved, renderMode, onAnalysisComplete, activeLens }: { initialData?: BusinessModelAnalysisData | null; onSaved?: () => void; renderMode?: "report" | "disrupt"; onAnalysisComplete?: (data: BusinessModelAnalysisData, input: BusinessModelInput) => void; activeLens?: any }) => {
  const { user } = useAuth();
  const isETA = getLensType(activeLens) === "eta";
  const [input, setInput] = useState<BusinessModelInput>({
    type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "",
  });
  const [data, setData] = useState<BusinessModelAnalysisData | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [userSuggestions, setUserSuggestions] = useState("");

  // Sync initialData when parent updates
  useEffect(() => {
    if (initialData && !data) setData(initialData);
  }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToWorkspace = async (analysisData: BusinessModelAnalysisData, businessType: string) => {
    try {
      const { error } = await (supabase.from("saved_analyses") as any).insert({
        user_id: user?.id,
        title: `${businessType} — Business Model`,
        category: "Business Model",
        era: "Present",
        audience: "",
        batch_size: 1,
        products: [],
        product_count: 0,
        avg_revival_score: null,
        analysis_type: "business_model",
        analysis_data: JSON.parse(JSON.stringify(analysisData)),
      });
      if (error) {
        console.error("Business model save error:", error);
        toast.error("Failed to save business model analysis");
        return;
      }
      onSaved?.();
      toast.success("Business model analysis saved to workspace!");
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const runAnalysis = async () => {
    if (!input.type.trim() || !input.description.trim()) {
      toast.error("Please enter the business type and a description.");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await invokeWithTimeout("business-model-analysis", {
        body: { businessModel: input, userSuggestions: userSuggestions || undefined },
      }, 180_000);
      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Analysis failed";
        if (msg.includes("Rate limit") || msg.includes("429")) {
          toast.error("Rate limit hit — please wait a moment and try again.");
        } else if (msg.includes("credits") || msg.includes("402")) {
          toast.error("Analysis credits exhausted — add credits in Settings → Workspace → Usage.");
        } else {
          toast.error("Business model analysis failed: " + msg);
        }
        return;
      }
      setData(result.analysis);
      setActiveTab("summary");
      toast.success("Business model analysis complete!");
      onAnalysisComplete?.(result.analysis, input);
      await saveToWorkspace(result.analysis, input.type);
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  } as React.CSSProperties;

  // Determine which tabs are relevant for renderMode
  const baseTabs = [
    { id: "summary" as const, label: "Business Reality", icon: Eye },
    { id: "operations" as const, label: "Operations Audit", icon: Wrench },
    { id: "assumptions" as const, label: "Hidden Assumptions", icon: Brain },
    { id: "tech" as const, label: "Tech Leverage", icon: Cpu },
    { id: "revenue" as const, label: "Revenue Reinvention", icon: DollarSign },
    { id: "disruption" as const, label: "Disruption Map", icon: Shield },
    { id: "reinvented" as const, label: "Reinvented Model", icon: Rocket },
  ];

  const etaTabs = isETA ? [
    { id: "dealEconomics" as const, label: "Deal Economics", icon: Calculator },
    { id: "addbackScrutiny" as const, label: "Addback Scrutiny", icon: Search },
    { id: "stagnation" as const, label: "Stagnation Dx", icon: TrendingDown },
    { id: "ownerDependency" as const, label: "Owner Risk", icon: AlertTriangle },
    { id: "playbook" as const, label: "100-Day Playbook", icon: Calendar },
  ] : [];

  const allTabs = [...baseTabs.slice(0, 5), ...etaTabs, ...baseTabs.slice(5)];
  const REPORT_TAB_IDS = ["summary", "operations", "assumptions", "tech", "revenue", ...(isETA ? ["dealEconomics", "addbackScrutiny", "stagnation", "ownerDependency", "playbook"] : [])];
  const DISRUPT_TAB_IDS = ["disruption", "reinvented"];

  const tabs = renderMode === "report"
    ? allTabs.filter(t => REPORT_TAB_IDS.includes(t.id))
    : renderMode === "disrupt"
    ? allTabs.filter(t => DISRUPT_TAB_IDS.includes(t.id))
    : allTabs;

  if (!data && renderMode) return null;

  // ── Input form (standalone mode, no renderMode) ──
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
            <Building2 size={36} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Business Model Deconstruction</h3>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              First-principles analysis of any business model — friction, costs, automation, and reinvention.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Business Type *</label>
              <input type="text" value={input.type} onChange={(e) => setInput((p) => ({ ...p, type: e.target.value }))}
                placeholder="e.g. Laundromat, Freight broker, Law firm…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}
                list="business-examples-standalone" />
              <datalist id="business-examples-standalone">
                {BUSINESS_EXAMPLES.map((ex) => <option key={ex} value={ex} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Model</label>
              <input type="text" value={input.revenueModel} onChange={(e) => setInput((p) => ({ ...p, revenueModel: e.target.value }))}
                placeholder="e.g. Per-use, monthly contract, hourly…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Business Description *</label>
            <textarea value={input.description} onChange={(e) => setInput((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe how the business works today…" rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Size / Scale</label>
              <input type="text" value={input.size} onChange={(e) => setInput((p) => ({ ...p, size: e.target.value }))}
                placeholder="e.g. $500k/yr, 10 employees" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Geography</label>
              <input type="text" value={input.geography} onChange={(e) => setInput((p) => ({ ...p, geography: e.target.value }))}
                placeholder="e.g. Suburban US, regional…" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Known Pain Points</label>
              <input type="text" value={input.painPoints} onChange={(e) => setInput((p) => ({ ...p, painPoints: e.target.value }))}
                placeholder="e.g. High labor costs, low margins…" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Website / URL (optional)</label>
            <input type="url" value={input.notes} onChange={(e) => setInput((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Paste a company website or URL for extra context…"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <button onClick={runAnalysis} disabled={loading || !input.type.trim() || !input.description.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-colors"
            style={{ background: "hsl(var(--primary))", color: "white", opacity: (loading || !input.type.trim() || !input.description.trim()) ? 0.6 : 1 }}>
            {loading ? <><RefreshCw size={15} className="animate-spin" /> Deconstructing…</> : <><Brain size={15} /> Run Business Model Analysis</>}
          </button>
          <p className="text-[10px] font-bold text-muted-foreground">Uses Gemini 2.5 Pro · ~20–40 seconds</p>
        </div>
      </div>
    );
  }

  const initialTab = renderMode === "disrupt" ? "disruption" : renderMode === "report" ? "summary" : activeTab;
  if (initialTab !== activeTab && renderMode && (renderMode === "disrupt" ? !["disruption", "reinvented"].includes(activeTab) : !REPORT_TAB_IDS.includes(activeTab))) {
    setActiveTab(initialTab as typeof activeTab);
  }

  return (
    <div className="space-y-4">
      {/* ── Tab Navigation — only render when NOT in renderMode (parent handles tabs) ── */}
      {!renderMode && (
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isActive ? "hsl(var(--primary))" : "transparent",
                  color: isActive ? "white" : "hsl(var(--foreground) / 0.7)",
                  border: isActive ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                }}>
                <Icon size={12} />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ TAB: BUSINESS REALITY ═══ */}
      {activeTab === "summary" && (
        <StepCanvas>
          {!data.businessSummary ? (
            <p className="text-sm text-muted-foreground italic">Business summary data unavailable.</p>
          ) : (
            <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} step="businessModel">
              <InsightCard
                icon={Target}
                headline={data.businessSummary?.trueJobToBeDone || "Not available"}
                badge="Job To Be Done"
                badgeColor="hsl(var(--primary))"
                accentColor="hsl(var(--primary))"
                action={<InsightRating sectionId="biz-jtbd" compact />}
              >
                <VisualGrid columns={2}>
                  <MetricCard label="Revenue Model" value={data.businessSummary?.currentModel || "N/A"} />
                  <MetricCard label="Market Position" value={data.businessSummary?.marketPosition || "N/A"} />
                </VisualGrid>
              </InsightCard>

              {(data.businessSummary.hiddenStrengths || []).length > 0 && (
                <FrameworkPanel title="Hidden Strengths" icon={Lightbulb} subtitle={`${(data.businessSummary.hiddenStrengths || []).length} identified`}>
                  <VisualGrid columns={2}>
                    {(data.businessSummary.hiddenStrengths || []).slice(0, 4).map((s, i) => (
                      <SignalCard key={i} label={s} type="strength" />
                    ))}
                  </VisualGrid>
                  {(data.businessSummary.hiddenStrengths || []).length > 4 && (
                    <ExpandableDetail label={`${(data.businessSummary.hiddenStrengths || []).length - 4} more strengths`}>
                      <div className="space-y-1.5">
                        {(data.businessSummary.hiddenStrengths || []).slice(4).map((s, i) => (
                          <SignalCard key={i} label={s} type="strength" />
                        ))}
                      </div>
                    </ExpandableDetail>
                  )}
                </FrameworkPanel>
              )}
            </AnalysisVisualLayer>
          )}
        </StepCanvas>
      )}

      {/* ═══ TAB: OPERATIONS AUDIT ═══ */}
      {activeTab === "operations" && (
        <StepCanvas>
          {!data.operationalAudit ? (
            <p className="text-sm text-muted-foreground italic">Operations audit data unavailable.</p>
          ) : (
            <>
              {/* Customer Journey — visual flow */}
              {(data.operationalAudit?.customerJourney || []).length > 0 && (
                <FrameworkPanel title="Customer Journey" icon={Factory} subtitle={`${(data.operationalAudit?.customerJourney || []).length} steps`}>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {(data.operationalAudit?.customerJourney || []).slice(0, 5).map((step, i, arr) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--muted))" }}>
                          {i + 1}. {step}
                        </span>
                        {i < Math.min(arr.length, 5) - 1 && <span className="text-muted-foreground text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </FrameworkPanel>
              )}

              {/* Friction Points — visual-first with signal cards */}
              <AnalysisPanel title="Friction Points" icon={AlertTriangle} eyebrow="Operations">
                <VisualGrid columns={2}>
                  {(data.operationalAudit?.frictionPoints || []).slice(0, 3).map((fp, i) => (
                    <SignalCard
                      key={i}
                      label={fp.stage}
                      type={IMPACT_MAP[fp.impact] || "neutral"}
                      explanation={fp.friction}
                      detail={fp.rootCause ? <p className="text-xs">{fp.rootCause}</p> : undefined}
                    />
                  ))}
                </VisualGrid>
                {(data.operationalAudit?.frictionPoints || []).length > 3 && (
                  <ExpandableDetail label={`${(data.operationalAudit?.frictionPoints || []).length - 3} more friction points`}>
                    <VisualGrid columns={2}>
                      {(data.operationalAudit?.frictionPoints || []).slice(3).map((fp, i) => (
                        <SignalCard key={i} label={fp.stage} type={IMPACT_MAP[fp.impact] || "neutral"} explanation={fp.friction} />
                      ))}
                    </VisualGrid>
                  </ExpandableDetail>
                )}
              </AnalysisPanel>

              {/* Cost Structure — expandable framework */}
              <ExpandableDetail label="Cost Structure & Revenue Leaks" icon={BarChart3}>
                <VisualGrid columns={2}>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Biggest Cost Drivers</p>
                    {(data.operationalAudit?.costStructure?.biggestCostDrivers || []).map((c, i) => (
                      <SignalCard key={i} label={c} type="threat" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Leaks</p>
                    {(data.operationalAudit?.revenueLeaks || []).slice(0, 3).map((leak, i) => (
                      <SignalCard key={i} label={leak} type="weakness" />
                    ))}
                  </div>
                </VisualGrid>
              </ExpandableDetail>
            </>
          )}
        </StepCanvas>
      )}

      {/* ═══ TAB: HIDDEN ASSUMPTIONS ═══ */}
      {activeTab === "assumptions" && (
        <StepCanvas>
          <AnalysisPanel title="Hidden Assumptions" icon={Brain} eyebrow="Structural Analysis" subtitle={`${(data.hiddenAssumptions || []).length} identified`}>
            <VisualGrid columns={1}>
              {(data.hiddenAssumptions || []).slice(0, 3).map((a, i) => (
                <InsightCard
                  key={i}
                  headline={a.assumption}
                  subtext={a.currentAnswer}
                  accentColor={a.isChallengeable ? "hsl(var(--primary))" : undefined}
                  badge={a.category}
                  badgeColor={CATEGORY_COLORS[a.category] || "hsl(var(--muted-foreground))"}
                  action={<LeverageScore score={a.leverageScore} />}
                  detail={a.challengeIdea ? (
                    <div className="space-y-2">
                      <p className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>Challenge Idea</p>
                      <p className="text-sm text-foreground/80">{a.challengeIdea}</p>
                    </div>
                  ) : undefined}
                />
              ))}
            </VisualGrid>
            {(data.hiddenAssumptions || []).length > 3 && (
              <ExpandableDetail label={`${(data.hiddenAssumptions || []).length - 3} more assumptions`} icon={Brain}>
                <VisualGrid columns={1}>
                  {(data.hiddenAssumptions || []).slice(3).map((a, i) => (
                    <InsightCard
                      key={i}
                      headline={a.assumption}
                      subtext={a.currentAnswer}
                      badge={a.category}
                      badgeColor={CATEGORY_COLORS[a.category]}
                      action={<LeverageScore score={a.leverageScore} />}
                      detail={a.challengeIdea ? <p>{a.challengeIdea}</p> : undefined}
                    />
                  ))}
                </VisualGrid>
              </ExpandableDetail>
            )}
          </AnalysisPanel>
        </StepCanvas>
      )}

      {/* ═══ TAB: TECH LEVERAGE ═══ */}
      {activeTab === "tech" && (
        <StepCanvas>
          {!data.technologyLeverage ? (
            <p className="text-sm text-muted-foreground italic">Technology leverage data unavailable.</p>
          ) : (
            <>
              <MetricCard label="Current Tech Level" value={data.technologyLeverage?.currentTechLevel || "N/A"} />

              <AnalysisPanel title="Automation Opportunities" icon={Cpu} eyebrow="Technology">
                <VisualGrid columns={2}>
                  {(data.technologyLeverage?.automationOpportunities || []).slice(0, 3).map((opp, i) => (
                    <OpportunityCard
                      key={i}
                      title={opp.process}
                      impact={`${opp.technology} · ${opp.costSaving}`}
                      category={opp.implementationDifficulty}
                    />
                  ))}
                </VisualGrid>
                {(data.technologyLeverage?.automationOpportunities || []).length > 3 && (
                  <ExpandableDetail label={`${(data.technologyLeverage?.automationOpportunities || []).length - 3} more opportunities`}>
                    <VisualGrid columns={2}>
                      {(data.technologyLeverage?.automationOpportunities || []).slice(3).map((opp, i) => (
                        <OpportunityCard key={i} title={opp.process} impact={`${opp.technology} · ${opp.costSaving}`} category={opp.implementationDifficulty} />
                      ))}
                    </VisualGrid>
                  </ExpandableDetail>
                )}
              </AnalysisPanel>

              {(data.technologyLeverage?.aiOpportunities || []).length > 0 && (
                <ExpandableDetail label={`AI & Platform Opportunities (${(data.technologyLeverage?.aiOpportunities || []).length})`} icon={Lightbulb}>
                  <VisualGrid columns={1}>
                    {(data.technologyLeverage?.aiOpportunities || []).map((opp, i) => (
                      <SignalCard key={i} label={opp} type="opportunity" />
                    ))}
                  </VisualGrid>
                  {data.technologyLeverage?.platformOpportunity && (
                    <InsightCard
                      headline="Platform Opportunity"
                      subtext={data.technologyLeverage.platformOpportunity}
                      accentColor="hsl(var(--primary))"
                      className="mt-3"
                    />
                  )}
                </ExpandableDetail>
              )}
            </>
          )}
        </StepCanvas>
      )}

      {/* ═══ TAB: REVENUE REINVENTION ═══ */}
      {activeTab === "revenue" && (
        <StepCanvas>
          {!data.revenueReinvention ? (
            <p className="text-sm text-muted-foreground italic">Revenue reinvention data unavailable.</p>
          ) : (
            <>
              <MetricCard label="Current Revenue Mix" value={data.revenueReinvention?.currentRevenueMix || "N/A"} />

              <AnalysisPanel title="Untapped Revenue Streams" icon={DollarSign} eyebrow="Revenue">
                <VisualGrid columns={2}>
                  {(data.revenueReinvention?.untappedStreams || []).slice(0, 3).map((stream, i) => (
                    <OpportunityCard
                      key={i}
                      title={stream.stream}
                      impact={stream.mechanism}
                      category={`${stream.effort} effort`}
                      detail={<p className="text-sm font-bold" style={{ color: "hsl(142 70% 30%)" }}>Est: {stream.estimatedSize}</p>}
                    />
                  ))}
                </VisualGrid>
                {(data.revenueReinvention?.untappedStreams || []).length > 3 && (
                  <ExpandableDetail label={`${(data.revenueReinvention?.untappedStreams || []).length - 3} more streams`}>
                    <VisualGrid columns={2}>
                      {(data.revenueReinvention?.untappedStreams || []).slice(3).map((stream, i) => (
                        <OpportunityCard key={i} title={stream.stream} impact={stream.mechanism} category={`${stream.effort} effort`} />
                      ))}
                    </VisualGrid>
                  </ExpandableDetail>
                )}
              </AnalysisPanel>

              <ExpandableDetail label="Pricing Redesign & Bundles" icon={FlipHorizontal}>
                {data.revenueReinvention?.pricingRedesign && (
                  <InsightCard headline="Bold Pricing Redesign" subtext={data.revenueReinvention.pricingRedesign} accentColor="hsl(var(--primary))" />
                )}
                {(data.revenueReinvention?.bundleOpportunities || []).map((b, i) => (
                  <BundleDeepDive key={i} opportunity={b} businessContext={{ type: input.type, description: input.description }} index={i} />
                ))}
              </ExpandableDetail>
            </>
          )}
        </StepCanvas>
      )}

      {/* ═══ TAB: DISRUPTION MAP ═══ */}
      {activeTab === "disruption" && (
        <StepCanvas>
          {!data.disruptionAnalysis ? (
            <p className="text-sm text-muted-foreground italic">Disruption analysis data unavailable.</p>
          ) : (
            <>
              <InsightCard
                icon={Shield}
                headline={data.disruptionAnalysis?.disruptorProfile || "Not available"}
                badge="Kill Shot"
                badgeColor="hsl(var(--destructive))"
                accentColor="hsl(var(--destructive))"
                action={<InsightRating sectionId="biz-disruptor" compact />}
                detail={
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vulnerabilities</p>
                    <VisualGrid columns={2}>
                      {(data.disruptionAnalysis?.vulnerabilities || []).map((v, i) => (
                        <SignalCard key={i} label={v} type="threat" />
                      ))}
                    </VisualGrid>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-3">Defense Moves</p>
                    <VisualGrid columns={2}>
                      {(data.disruptionAnalysis?.defenseMoves || []).map((m, i) => (
                        <SignalCard key={i} label={m} type="strength" />
                      ))}
                    </VisualGrid>
                  </div>
                }
              />

              <InsightCard
                icon={Target}
                headline={data.disruptionAnalysis?.attackMoves || "Not available"}
                badge="$1M Attack"
                badgeColor="hsl(38 92% 42%)"
                accentColor="hsl(38 92% 42%)"
                action={<InsightRating sectionId="biz-attack" compact />}
              />
            </>
          )}
        </StepCanvas>
      )}

      {/* ═══ TAB: REINVENTED MODEL ═══ */}
      {activeTab === "reinvented" && (
        <StepCanvas>
          {!data.reinventedModel ? (
            <p className="text-sm text-muted-foreground italic">Reinvented model data unavailable.</p>
          ) : (
            <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} suppressText={false} step="businessModel">
              <AnalysisPanel
                title={data.reinventedModel?.modelName || "Reinvented Model"}
                subtitle={data.reinventedModel?.coreShift || ""}
                icon={Rocket}
                eyebrow="Reinvented Business Model"
                eyebrowColor="hsl(var(--primary))"
                accentColor="hsl(var(--primary))"
                action={<InsightRating sectionId="biz-reinvented" compact />}
              >
                {/* Key Changes */}
                <VisualGrid columns={2}>
                  {(data.reinventedModel?.keyChanges || []).slice(0, 4).map((c, i) => (
                    <SignalCard key={i} label={c} type="strength" />
                  ))}
                </VisualGrid>
              </AnalysisPanel>

              {/* Value & Economics — MetricCards */}
              <VisualGrid columns={2}>
                <MetricCard label="New Value Proposition" value={data.reinventedModel?.newValueProposition || "N/A"} accentColor="hsl(142 70% 30%)" />
                <MetricCard label="Economic Transformation" value={data.reinventedModel?.economicTransformation || "N/A"} accentColor="hsl(217 91% 45%)" />
              </VisualGrid>

              {/* Implementation & Risk — expandable */}
              <ExpandableDetail label={`Implementation Roadmap (${(data.reinventedModel?.implementationRoadmap || []).length} phases)`} icon={Clock}>
                {(data.reinventedModel?.implementationRoadmap || []).map((phase, i) => (
                  <InsightCard
                    key={i}
                    headline={phase.phase}
                    badge={phase.milestone}
                    badgeColor="hsl(142 70% 35%)"
                    detail={
                      <ul className="space-y-1">
                        {phase.actions.map((a, j) => (
                          <li key={j} className="text-sm text-foreground/80 flex items-start gap-2">
                            <span className="text-primary mt-0.5">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    }
                    className="mb-2"
                  />
                ))}
              </ExpandableDetail>

              <VisualGrid columns={3}>
                <MetricCard label="ROI" value={data.reinventedModel?.estimatedROI || "—"} accentColor="hsl(142 70% 30%)" />
                <MetricCard label="Biggest Risk" value={data.reinventedModel?.biggestRisk || "—"} accentColor="hsl(var(--destructive))" />
                <MetricCard label="Capabilities" value={`${(data.reinventedModel?.requiredCapabilities || []).length} needed`} />
              </VisualGrid>
            </AnalysisVisualLayer>
          )}
        </StepCanvas>
      )}

      {/* ═══ TAB: DEAL ECONOMICS (ETA only) ═══ */}
      {activeTab === "dealEconomics" && isETA && (
        <StepCanvas>
          <DealEconomicsPanel analysisData={data} />
        </StepCanvas>
      )}

      {/* ═══ TAB: ADDBACK SCRUTINY (ETA only) ═══ */}
      {activeTab === "addbackScrutiny" && isETA && (
        <StepCanvas>
          {(() => {
            const addbacks = (data as any)?.addbackScrutiny;
            if (!addbacks) return (
              <div className="p-6 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <FileQuestion size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Addback data not available. Re-run with ETA Lens to generate.</p>
              </div>
            );
            return (
              <>
                <VisualGrid columns={3}>
                  <MetricCard label="Total Claimed Addbacks" value={addbacks.totalClaimedAddbacks || "—"} />
                  <MetricCard label="Adjusted SDE" value={addbacks.adjustedSDE || "—"} accentColor="hsl(38 92% 35%)" subtext="After removing questionable items" />
                  <MetricCard label="Adjusted Multiple" value={addbacks.adjustedMultiple || "—"} subtext={`Inflation est: ${addbacks.brokerInflationEstimate || "—"}`} />
                </VisualGrid>

                <AnalysisPanel title="Claimed Addbacks" icon={Search}>
                  <VisualGrid columns={1}>
                    {addbacks.claimedAddbacks?.map((ab: any, i: number) => (
                      <InsightCard
                        key={i}
                        headline={ab.item}
                        subtext={ab.reasoning}
                        badge={ab.confidence}
                        badgeColor={ab.confidence === "legitimate" ? "hsl(142 70% 30%)" : ab.confidence === "suspicious" ? "hsl(var(--destructive))" : "hsl(38 92% 35%)"}
                        action={ab.amount ? <span className="text-xs font-bold tabular-nums">{ab.amount}</span> : undefined}
                        detail={ab.verificationStep ? <p className="text-sm"><span className="font-bold text-primary">Verify:</span> {ab.verificationStep}</p> : undefined}
                      />
                    ))}
                  </VisualGrid>
                </AnalysisPanel>

                {addbacks.redFlags?.length > 0 && (
                  <FrameworkPanel title="Red Flags" icon={AlertTriangle} accentColor="hsl(var(--destructive))">
                    <VisualGrid columns={1}>
                      {addbacks.redFlags.map((rf: string, i: number) => (
                        <SignalCard key={i} label={rf} type="threat" />
                      ))}
                    </VisualGrid>
                  </FrameworkPanel>
                )}
              </>
            );
          })()}
        </StepCanvas>
      )}

      {/* ═══ TAB: STAGNATION DIAGNOSTIC (ETA only) ═══ */}
      {activeTab === "stagnation" && isETA && (
        <StepCanvas>
          {(() => {
            const diag = (data as any)?.stagnationDiagnostic;
            if (!diag) return (
              <div className="p-6 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <FileQuestion size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Stagnation data not available. Re-run with ETA Lens to generate.</p>
              </div>
            );
            const trajectoryColors: Record<string, string> = {
              growing: "hsl(142 70% 30%)", flat: "hsl(38 92% 35%)", declining: "hsl(var(--destructive))", accelerating_decline: "hsl(var(--destructive))",
            };
            const turnColor = (diag.turnaroundPotential || 0) >= 7 ? "hsl(142 70% 30%)" : (diag.turnaroundPotential || 0) >= 4 ? "hsl(38 92% 35%)" : "hsl(var(--destructive))";
            return (
              <>
                <VisualGrid columns={4}>
                  <MetricCard label="Trajectory" value={diag.overallTrajectory || "N/A"} accentColor={trajectoryColors[diag.overallTrajectory] || "hsl(38 92% 35%)"} />
                  <MetricCard label="Turnaround Potential" value={`${diag.turnaroundPotential}/10`} accentColor={turnColor} />
                  <MetricCard label="Time to Turnaround" value={diag.timeToTurnaround || "—"} />
                  <MetricCard label="Capital Required" value={diag.capitalRequired || "—"} />
                </VisualGrid>

                <InsightCard
                  icon={AlertTriangle}
                  headline={diag.whySellingAssessment || "Assessment unavailable"}
                  badge="Why Selling?"
                  badgeColor="hsl(var(--destructive))"
                  accentColor="hsl(var(--destructive))"
                />

                <AnalysisPanel title="Root Causes" icon={TrendingDown}>
                  <VisualGrid columns={1}>
                    {diag.rootCauses?.map((rc: any, i: number) => (
                      <InsightCard
                        key={i}
                        headline={rc.cause}
                        subtext={rc.evidence}
                        badge={rc.category}
                        badgeColor={rc.reversibility?.includes("difficult") || rc.reversibility === "structural" ? "hsl(var(--destructive))" : "hsl(38 92% 35%)"}
                        action={<span className="text-xs font-bold tabular-nums" style={{ color: turnColor }}>Rev: {rc.reversibilityScore}/10</span>}
                        detail={rc.newOwnerAction ? <p className="text-sm"><span className="font-bold text-primary">Action:</span> {rc.newOwnerAction}</p> : undefined}
                      />
                    ))}
                  </VisualGrid>
                </AnalysisPanel>
              </>
            );
          })()}
        </StepCanvas>
      )}

      {/* ═══ TAB: OWNER DEPENDENCY (ETA only) ═══ */}
      {activeTab === "ownerDependency" && isETA && (data as any)?.ownerDependencyAssessment && (
        <StepCanvas>
          {(() => {
            const oda = (data as any).ownerDependencyAssessment;
            const riskColor = oda.transitionRiskScore >= 7 ? "hsl(var(--destructive))" : oda.transitionRiskScore >= 4 ? "hsl(38 92% 35%)" : "hsl(142 70% 30%)";
            return (
              <>
                <MetricCard
                  label="Transition Risk Score"
                  value={`${oda.transitionRiskScore}/10`}
                  accentColor={riskColor}
                  subtext={oda.transitionRiskScore >= 7 ? "High risk — extensive transition planning required" : oda.transitionRiskScore >= 4 ? "Moderate risk — structured transition needed" : "Low risk — business runs independently"}
                />

                <AnalysisPanel title="Owner Dependencies" icon={Users}>
                  <VisualGrid columns={1}>
                    {oda.ownerDependencies?.map((dep: any, i: number) => {
                      const sevColors: Record<string, string> = { critical: "hsl(var(--destructive))", high: "hsl(var(--destructive))", medium: "hsl(38 92% 35%)", low: "hsl(142 70% 30%)" };
                      return (
                        <InsightCard
                          key={i}
                          headline={dep.area}
                          subtext={dep.description}
                          badge={dep.severity}
                          badgeColor={sevColors[dep.severity] || "hsl(var(--muted-foreground))"}
                          detail={dep.mitigation ? <p className="text-sm"><span className="font-bold text-primary">Mitigation:</span> {dep.mitigation}</p> : undefined}
                        />
                      );
                    })}
                  </VisualGrid>
                </AnalysisPanel>

                {oda.keyPersonRisks?.length > 0 && (
                  <ExpandableDetail label={`Key Person Risks (${oda.keyPersonRisks.length})`} icon={AlertTriangle}>
                    <VisualGrid columns={1}>
                      {oda.keyPersonRisks.map((r: string, i: number) => (
                        <SignalCard key={i} label={r} type="threat" />
                      ))}
                    </VisualGrid>
                  </ExpandableDetail>
                )}
              </>
            );
          })()}
        </StepCanvas>
      )}

      {/* ═══ TAB: OWNERSHIP PLAYBOOK (ETA only) ═══ */}
      {activeTab === "playbook" && isETA && (data as any)?.ownershipPlaybook && (
        <StepCanvas>
          <OwnershipPlaybook data={{
            transitionRiskScore: (data as any)?.ownerDependencyAssessment?.transitionRiskScore ?? 5,
            ownerDependencies: (data as any)?.ownerDependencyAssessment?.ownerDependencies ?? [],
            phases: (data as any).ownershipPlaybook.phases ?? [],
            quickWins: (data as any).ownershipPlaybook.quickWins ?? [],
            dueDiligenceQuestions: (data as any).ownershipPlaybook.dueDiligenceQuestions ?? [],
          }} />
        </StepCanvas>
      )}
    </div>
  );
};
