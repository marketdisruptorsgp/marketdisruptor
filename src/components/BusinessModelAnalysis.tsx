import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { downloadBusinessModelPDF } from "@/lib/pdfExport";
import {
  Brain, RefreshCw, ArrowRight, Building2, Zap, DollarSign, Shield,
  AlertTriangle, CheckCircle2, Lightbulb, Users, BarChart3, Cpu,
  TrendingUp, Target, Rocket, Clock, ChevronRight, FlipHorizontal,
  Wrench, Eye, Package, Factory, Layers, FileDown,
} from "lucide-react";
import { InsightRating } from "./InsightRating";
import { BundleDeepDive } from "./BundleDeepDive";
import { DataLabel } from "./DataLabel";
import { LeverageScore } from "./LeverageScore";
import { SectionHeader, NextSectionButton, DetailPanel } from "@/components/SectionNav";

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
  businessSummary: {
    trueJobToBeDone: string;
    currentModel: string;
    marketPosition: string;
    hiddenStrengths: string[];
  };
  operationalAudit: {
    customerJourney: string[];
    frictionPoints: FrictionPoint[];
    costStructure: {
      biggestCostDrivers: string[];
      fixedVsVariable: string;
      eliminationCandidates: string[];
    };
    revenueLeaks: string[];
  };
  hiddenAssumptions: HiddenAssumption[];
  technologyLeverage: {
    currentTechLevel: string;
    automationOpportunities: AutomationOpportunity[];
    aiOpportunities: string[];
    platformOpportunity: string;
  };
  revenueReinvention: {
    currentRevenueMix: string;
    untappedStreams: UntappedStream[];
    pricingRedesign: string;
    bundleOpportunities: string[];
  };
  disruptionAnalysis: {
    vulnerabilities: string[];
    disruptorProfile: string;
    defenseMoves: string[];
    attackMoves: string;
  };
  reinventedModel: {
    modelName: string;
    coreShift: string;
    keyChanges: string[];
    newValueProposition: string;
    economicTransformation: string;
    implementationRoadmap: ImplementationPhase[];
    estimatedROI: string;
    biggestRisk: string;
    requiredCapabilities: string[];
  };
}

const IMPACT_COLORS = {
  high: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.3)", text: "hsl(var(--destructive))", label: "High Impact" },
  medium: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.3)", text: "hsl(38 92% 35%)", label: "Medium" },
  low: { bg: "hsl(142 70% 45% / 0.07)", border: "hsl(142 70% 45% / 0.25)", text: "hsl(142 70% 30%)", label: "Low" },
};

const EFFORT_COLORS = {
  high: { bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" },
  medium: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)" },
  low: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)" },
};

const DIFFICULTY_COLORS = {
  easy: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)" },
  medium: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)" },
  hard: { bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" },
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

export const BusinessModelAnalysis = ({ initialData, onSaved, renderMode, onAnalysisComplete }: { initialData?: BusinessModelAnalysisData | null; onSaved?: () => void; renderMode?: "report" | "disrupt"; onAnalysisComplete?: (data: BusinessModelAnalysisData, input: BusinessModelInput) => void }) => {
  const { user } = useAuth();
  const [input, setInput] = useState<BusinessModelInput>({
    type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "",
  });
  const [data, setData] = useState<BusinessModelAnalysisData | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "operations" | "assumptions" | "tech" | "revenue" | "disruption" | "reinvented">("summary");
  const [userSuggestions, setUserSuggestions] = useState("");

  const saveToWorkspace = async (analysisData: BusinessModelAnalysisData, businessType: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const { data: result, error } = await supabase.functions.invoke("business-model-analysis", {
        body: { businessModel: input, userSuggestions: userSuggestions || undefined },
      });
      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Analysis failed";
        if (msg.includes("Rate limit") || msg.includes("429")) {
          toast.error("Rate limit hit — please wait a moment and try again.");
        } else if (msg.includes("credits") || msg.includes("402")) {
          toast.error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
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

  const scrollToSteps = () => setTimeout(() => document.querySelector('[data-bma-steps]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

  const allTabs = [
    { id: "summary" as const, label: "Business Reality", icon: Eye },
    { id: "operations" as const, label: "Operations Audit", icon: Wrench },
    { id: "assumptions" as const, label: "Hidden Assumptions", icon: Brain },
    { id: "tech" as const, label: "Tech Leverage", icon: Cpu },
    { id: "revenue" as const, label: "Revenue Reinvention", icon: DollarSign },
    { id: "disruption" as const, label: "Disruption Map", icon: Shield },
    { id: "reinvented" as const, label: "Reinvented Model", icon: Rocket },
  ];

  const REPORT_TAB_IDS = ["summary", "operations", "assumptions", "tech", "revenue"];
  const DISRUPT_TAB_IDS = ["disruption", "reinvented"];

  const tabs = renderMode === "report"
    ? allTabs.filter(t => REPORT_TAB_IDS.includes(t.id))
    : renderMode === "disrupt"
    ? allTabs.filter(t => DISRUPT_TAB_IDS.includes(t.id))
    : allTabs;

  const currentTabIdx = tabs.findIndex(t => t.id === activeTab);
  const nextTab = currentTabIdx < tabs.length - 1 ? tabs[currentTabIdx + 1] : null;

  const goNext = () => {
    if (!nextTab) return;
    setActiveTab(nextTab.id);
    scrollToSteps();
  };

  if (!data && renderMode) return null;

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
            <Building2 size={36} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h3 className="typo-section-title mb-2" style={{ fontSize: "1.25rem" }}>Business Model Deconstruction</h3>
            <p className="typo-card-body text-muted-foreground max-w-lg leading-relaxed">
              First-principles analysis of any business model — friction, costs, automation, and reinvention.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Business Type *</label>
              <input type="text" value={input.type} onChange={(e) => setInput((p) => ({ ...p, type: e.target.value }))}
                placeholder="e.g. Laundromat, Freight broker, Law firm…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}
                list="business-examples-standalone" />
              <datalist id="business-examples-standalone">
                {BUSINESS_EXAMPLES.map((ex) => <option key={ex} value={ex} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Revenue Model</label>
              <input type="text" value={input.revenueModel} onChange={(e) => setInput((p) => ({ ...p, revenueModel: e.target.value }))}
                placeholder="e.g. Per-use, monthly contract, hourly…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Business Description *</label>
            <textarea value={input.description} onChange={(e) => setInput((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe how the business works today…" rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Size / Scale</label>
              <input type="text" value={input.size} onChange={(e) => setInput((p) => ({ ...p, size: e.target.value }))}
                placeholder="e.g. $500k/yr, 10 employees" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Geography</label>
              <input type="text" value={input.geography} onChange={(e) => setInput((p) => ({ ...p, geography: e.target.value }))}
                placeholder="e.g. Suburban US, regional…" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Known Pain Points</label>
              <input type="text" value={input.painPoints} onChange={(e) => setInput((p) => ({ ...p, painPoints: e.target.value }))}
                placeholder="e.g. High labor costs, low margins…" className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="typo-card-eyebrow">Website / URL (optional)</label>
            <input type="url" value={input.notes} onChange={(e) => setInput((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Paste a company website or URL for extra context…"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <button onClick={runAnalysis} disabled={loading || !input.type.trim() || !input.description.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg typo-button-primary transition-colors"
            style={{ background: "hsl(var(--primary))", color: "white", opacity: (loading || !input.type.trim() || !input.description.trim()) ? 0.6 : 1 }}>
            {loading ? <><RefreshCw size={15} className="animate-spin" /> Deconstructing…</> : <><Brain size={15} /> Run Business Model Analysis</>}
          </button>
          <p className="typo-card-meta text-muted-foreground">Uses Gemini 2.5 Pro · ~20–40 seconds</p>
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
      {/* Header — only show when not in renderMode */}
      {!renderMode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                <Building2 size={14} style={{ color: "white" }} />
              </div>
              <div>
                <h3 className="typo-card-title">{input.type}</h3>
                <p className="typo-card-meta text-muted-foreground">{tabs.length} sections · Click any to jump</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadBusinessModelPDF(input.type || "Business Model", data)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "hsl(var(--primary))", color: "white" }}>
                <FileDown size={12} /> PDF
              </button>
              <button onClick={runAnalysis} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />} Re-run
              </button>
            </div>
          </div>
          <DetailPanel title="Steer the AI — add direction, then Re-run" icon={Lightbulb}>
            <textarea value={userSuggestions} onChange={(e) => setUserSuggestions(e.target.value)}
              placeholder="e.g. Focus on automation, explore franchise model…"
              className="w-full rounded-lg px-3 py-2 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
              rows={2} style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} />
          </DetailPanel>
        </div>
      )}

      {/* Step nav */}
      <div data-bma-steps className="flex flex-wrap gap-1.5">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => { setActiveTab(t.id); scrollToSteps(); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg typo-card-meta font-semibold transition-all"
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

      {/* TAB: BUSINESS REALITY */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Business Reality" icon={Eye} />

          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-card-eyebrow mb-1" style={{ color: "hsl(var(--primary))" }}>True Job To Be Done</p>
            <p className="text-sm text-foreground leading-relaxed">{data.businessSummary.trueJobToBeDone}</p>
            <InsightRating sectionId="biz-jtbd" compact />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
              <p className="typo-card-eyebrow text-muted-foreground mb-1">How Money Flows</p>
              <p className="typo-card-body text-foreground/80 leading-relaxed">{data.businessSummary.currentModel}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
              <p className="typo-card-eyebrow text-muted-foreground mb-1">Market Position</p>
              <p className="typo-card-body text-foreground/80 leading-relaxed">{data.businessSummary.marketPosition}</p>
            </div>
          </div>

          <DetailPanel title={`Hidden Strengths (${data.businessSummary.hiddenStrengths.length})`} icon={Lightbulb}>
            <div className="space-y-1.5 mb-2">
              {data.businessSummary.hiddenStrengths.map((s, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <CheckCircle2 size={10} style={{ color: "hsl(38 92% 40%)", flexShrink: 0, marginTop: 2 }} />
                  <span className="text-foreground/80">{s}</span>
                </div>
              ))}
            </div>
          </DetailPanel>

          {nextTab && <NextSectionButton label={nextTab.label} onClick={goNext} />}
        </div>
      )}

      {/* TAB: OPERATIONS AUDIT */}
      {activeTab === "operations" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Operations Audit" icon={Wrench} />

          {/* Customer Journey — compact */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {data.operationalAudit.customerJourney.slice(0, 5).map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="px-2 py-1 rounded typo-card-meta font-semibold" style={{ background: "hsl(var(--muted))" }}>
                  {i + 1}. {step.length > 35 ? step.slice(0, 35) + "…" : step}
                </span>
                {i < Math.min(data.operationalAudit.customerJourney.length, 5) - 1 && <ChevronRight size={10} className="text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Friction — top 2 */}
          {data.operationalAudit.frictionPoints.slice(0, 2).map((fp, i) => {
            const col = IMPACT_COLORS[fp.impact] || IMPACT_COLORS.medium;
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="typo-card-meta font-bold" style={{ color: col.text }}>{fp.stage}</p>
                  <span className="px-2 py-0.5 rounded-full typo-status-label" style={{ color: col.text }}>{col.label}</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{fp.friction}</p>
              </div>
            );
          })}

          {data.operationalAudit.frictionPoints.length > 2 && (
            <DetailPanel title={`${data.operationalAudit.frictionPoints.length - 2} more friction points`} icon={AlertTriangle}>
              <div className="space-y-2 mb-2">
                {data.operationalAudit.frictionPoints.slice(2).map((fp, i) => {
                  const col = IMPACT_COLORS[fp.impact] || IMPACT_COLORS.medium;
                  return (
                    <div key={i} className="p-3 rounded-lg" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                      <p className="typo-card-meta font-bold" style={{ color: col.text }}>{fp.stage}</p>
                      <p className="text-xs text-foreground/80">{fp.friction}</p>
                      <DataLabel label={fp.dataLabel} />
                    </div>
                  );
                })}
              </div>
            </DetailPanel>
          )}

          <DetailPanel title="Cost Structure & Revenue Leaks" icon={BarChart3}>
            <div className="space-y-3 mb-2">
              <p className="text-xs text-foreground/80">{data.operationalAudit.costStructure.fixedVsVariable}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="typo-card-eyebrow text-muted-foreground">Biggest Cost Drivers</p>
                  {data.operationalAudit.costStructure.biggestCostDrivers.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <ChevronRight size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="typo-card-eyebrow text-muted-foreground">Revenue Leaks</p>
                  {data.operationalAudit.revenueLeaks.slice(0, 3).map((leak, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{leak}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DetailPanel>

          {nextTab && <NextSectionButton label={nextTab.label} onClick={goNext} />}
        </div>
      )}

      {/* TAB: HIDDEN ASSUMPTIONS */}
      {activeTab === "assumptions" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Hidden Assumptions" icon={Brain} />

          {data.hiddenAssumptions.slice(0, 3).map((a, i) => {
            const catColor = CATEGORY_COLORS[a.category] || "hsl(var(--muted-foreground))";
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: `1px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}` }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center typo-status-label font-bold flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                    {a.assumption}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded-full typo-status-label" style={{ background: `${catColor}18`, color: catColor }}>{a.category}</span>
                    <LeverageScore score={a.leverageScore} />
                  </div>
                </div>
                <p className="typo-card-body text-muted-foreground leading-relaxed ml-7">{a.currentAnswer}</p>
                {a.challengeIdea && (
                  <div className="ml-7 mt-1 p-2 rounded typo-card-body" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                    <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>Challenge: </span>
                    <span className="text-foreground/80">{a.challengeIdea}</span>
                  </div>
                )}
              </div>
            );
          })}

          {data.hiddenAssumptions.length > 3 && (
            <DetailPanel title={`${data.hiddenAssumptions.length - 3} more assumptions`} icon={Brain}>
              <div className="space-y-2 mb-2">
                {data.hiddenAssumptions.slice(3).map((a, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <p className="typo-card-body font-bold text-foreground mb-0.5">{a.assumption}</p>
                    <p className="typo-card-body text-muted-foreground">{a.currentAnswer}</p>
                    {a.challengeIdea && <p className="typo-card-body mt-1" style={{ color: "hsl(var(--primary))" }}>→ {a.challengeIdea}</p>}
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}

          {nextTab && <NextSectionButton label={nextTab.label} onClick={goNext} />}
        </div>
      )}

      {/* TAB: TECH LEVERAGE */}
      {activeTab === "tech" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Tech Leverage" icon={Cpu} />

          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
            <p className="typo-card-eyebrow text-muted-foreground mb-1">Current Tech Level</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.technologyLeverage.currentTechLevel}</p>
          </div>

          {/* Top 2 automation opps */}
          {data.technologyLeverage.automationOpportunities.slice(0, 2).map((opp, i) => {
            const diff = DIFFICULTY_COLORS[opp.implementationDifficulty] || DIFFICULTY_COLORS.medium;
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-foreground">{opp.process}</p>
                  <span className="px-2 py-0.5 rounded-full typo-status-label flex-shrink-0" style={{ background: diff.bg, color: diff.text }}>{opp.implementationDifficulty}</span>
                </div>
                <p className="typo-card-meta font-semibold" style={{ color: "hsl(var(--primary))" }}>→ {opp.technology}</p>
                <p className="text-xs text-muted-foreground">{opp.costSaving}</p>
              </div>
            );
          })}

          <DetailPanel title={`AI Opportunities & Platform Potential (${data.technologyLeverage.aiOpportunities.length + (data.technologyLeverage.automationOpportunities.length > 2 ? data.technologyLeverage.automationOpportunities.length - 2 : 0)})`} icon={Brain}>
            <div className="space-y-2 mb-2">
              {data.technologyLeverage.automationOpportunities.slice(2).map((opp, i) => (
                <div key={`auto-${i}`} className="p-2 rounded-lg text-xs" style={{ background: "hsl(var(--muted))" }}>
                  <p className="font-bold text-foreground">{opp.process}</p>
                  <p className="text-muted-foreground">→ {opp.technology} · {opp.costSaving}</p>
                </div>
              ))}
              {data.technologyLeverage.aiOpportunities.map((opp, i) => (
                <div key={`ai-${i}`} className="flex items-start gap-2 text-xs">
                  <Lightbulb size={10} style={{ color: "hsl(271 81% 45%)", flexShrink: 0, marginTop: 2 }} />
                  <span className="text-foreground/80">{opp}</span>
                </div>
              ))}
              <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="typo-card-meta font-bold mb-1" style={{ color: "hsl(var(--primary))" }}>Platform Opportunity</p>
                <p className="text-xs text-foreground/80">{data.technologyLeverage.platformOpportunity}</p>
              </div>
            </div>
          </DetailPanel>

          {nextTab && <NextSectionButton label={nextTab.label} onClick={goNext} />}
        </div>
      )}

      {/* TAB: REVENUE REINVENTION */}
      {activeTab === "revenue" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Revenue Reinvention" icon={DollarSign} />

          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
            <p className="typo-card-eyebrow text-muted-foreground mb-1">Current Revenue Mix</p>
            <p className="text-xs text-foreground/80">{data.revenueReinvention.currentRevenueMix}</p>
          </div>

          {/* Top 2 untapped streams */}
          {data.revenueReinvention.untappedStreams.slice(0, 2).map((stream, i) => {
            const eff = EFFORT_COLORS[stream.effort] || EFFORT_COLORS.medium;
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-foreground">{stream.stream}</p>
                  <span className="px-2 py-0.5 rounded-full typo-status-label" style={{ background: eff.bg, color: eff.text }}>{stream.effort} effort</span>
                </div>
                <p className="text-xs text-foreground/80">{stream.mechanism}</p>
                <p className="typo-card-meta font-semibold" style={{ color: "hsl(142 70% 30%)" }}>Est: {stream.estimatedSize}</p>
              </div>
            );
          })}

          <DetailPanel title={`Pricing Redesign & Bundles (${data.revenueReinvention.bundleOpportunities.length + (data.revenueReinvention.untappedStreams.length > 2 ? data.revenueReinvention.untappedStreams.length - 2 : 0) + 1})`} icon={FlipHorizontal}>
            <div className="space-y-3 mb-2">
              {data.revenueReinvention.untappedStreams.slice(2).map((stream, i) => (
                <div key={i} className="p-2 rounded-lg text-xs" style={{ background: "hsl(var(--muted))" }}>
                  <p className="font-bold text-foreground">{stream.stream}</p>
                  <p className="text-muted-foreground">{stream.mechanism} · Est: {stream.estimatedSize}</p>
                </div>
              ))}
              <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="typo-card-meta font-bold mb-1" style={{ color: "hsl(var(--primary))" }}>Bold Pricing Redesign</p>
                <p className="text-xs text-foreground/80">{data.revenueReinvention.pricingRedesign}</p>
              </div>
              {data.revenueReinvention.bundleOpportunities.map((b, i) => (
                <BundleDeepDive key={i} opportunity={b} businessContext={{ type: input.type, description: input.description }} index={i} />
              ))}
            </div>
          </DetailPanel>

          {nextTab && <NextSectionButton label={nextTab.label} onClick={goNext} />}
        </div>
      )}

      {/* TAB: DISRUPTION MAP */}
      {activeTab === "disruption" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Disruption Map" icon={Shield} />

          {/* Disruptor profile — key insight */}
          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-card-eyebrow mb-1" style={{ color: "hsl(var(--destructive))" }}>The Startup That Could Kill This Business</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{data.disruptionAnalysis.disruptorProfile}</p>
            <InsightRating sectionId="biz-disruptor" compact />
          </div>

          <DetailPanel title={`Vulnerabilities (${data.disruptionAnalysis.vulnerabilities.length}) & Defense Moves (${data.disruptionAnalysis.defenseMoves.length})`} icon={AlertTriangle}>
            <div className="space-y-2 mb-2">
              {data.disruptionAnalysis.vulnerabilities.map((v, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                  <span className="text-foreground/80">{v}</span>
                </div>
              ))}
              <div className="pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <p className="typo-card-eyebrow text-muted-foreground mb-1">Defense Moves</p>
                {data.disruptionAnalysis.defenseMoves.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs mb-1">
                    <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-foreground/80">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </DetailPanel>

          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-card-eyebrow mb-1" style={{ color: "hsl(var(--primary))" }}>If You Were Disrupting With $1M…</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{data.disruptionAnalysis.attackMoves}</p>
            <InsightRating sectionId="biz-attack" compact />
          </div>

          {nextTab && <NextSectionButton label={nextTab.label} onClick={goNext} />}
        </div>
      )}

      {/* TAB: REINVENTED MODEL */}
      {activeTab === "reinvented" && (
        <div className="space-y-4">
          <SectionHeader current={currentTabIdx + 1} total={tabs.length} label="Reinvented Model" icon={Rocket} />

          {/* Hero */}
          <div className="p-5 rounded-lg relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)", color: "white" }}>
            <div className="relative">
              <p className="typo-card-eyebrow opacity-80 mb-2">Reinvented Business Model</p>
              <h2 className="text-xl font-black mb-1">{data.reinventedModel.modelName}</h2>
              <p className="text-xs leading-relaxed opacity-80">{data.reinventedModel.coreShift}</p>
              <InsightRating sectionId="biz-reinvented" compact />
            </div>
          </div>

          {/* Key Changes — top 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.reinventedModel.keyChanges.slice(0, 3).map((c, i) => (
              <div key={i} className="flex gap-2 items-start p-2 rounded-lg text-xs"
                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <CheckCircle2 size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                <span className="text-foreground/85">{c}</span>
              </div>
            ))}
          </div>

          {/* Value + Economics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="typo-card-eyebrow mb-1" style={{ color: "hsl(142 70% 30%)" }}>New Value Proposition</p>
              <p className="text-xs text-foreground/80">{data.reinventedModel.newValueProposition}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="typo-card-eyebrow mb-1" style={{ color: "hsl(217 91% 40%)" }}>Economic Transformation</p>
              <p className="text-xs text-foreground/80">{data.reinventedModel.economicTransformation}</p>
            </div>
          </div>

          <DetailPanel title={`Implementation Roadmap (${data.reinventedModel.implementationRoadmap.length} phases) & Risk`} icon={Clock}>
            <div className="space-y-3 mb-2">
              {data.reinventedModel.implementationRoadmap.map((phase, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <span className="px-2 py-0.5 rounded-full typo-card-meta font-bold" style={{ background: "hsl(var(--primary))", color: "white" }}>{phase.phase}</span>
                  <div className="space-y-1 mt-2">
                    {phase.actions.map((a, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs">
                        <ChevronRight size={10} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 2 }} />
                        <span className="text-foreground/80">{a}</span>
                      </div>
                    ))}
                  </div>
                  <p className="typo-card-meta font-semibold mt-1 flex items-center gap-1" style={{ color: "hsl(142 70% 30%)" }}><CheckCircle2 size={10} /> {phase.milestone}</p>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <p className="typo-card-eyebrow text-muted-foreground">ROI</p>
                  <p className="text-xs text-foreground/80">{data.reinventedModel.estimatedROI}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                  <p className="typo-card-eyebrow" style={{ color: "hsl(var(--destructive))" }}>Biggest Risk</p>
                  <p className="text-xs text-foreground/80">{data.reinventedModel.biggestRisk}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <p className="typo-card-eyebrow text-muted-foreground">Capabilities</p>
                  {data.reinventedModel.requiredCapabilities.slice(0, 3).map((c, i) => (
                    <p key={i} className="text-xs text-foreground/80">• {c}</p>
                  ))}
                </div>
              </div>
            </div>
          </DetailPanel>

          <div className="text-center py-3">
            <span className="typo-button-secondary px-4 py-2 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
              <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)" }} /> All sections explored
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
