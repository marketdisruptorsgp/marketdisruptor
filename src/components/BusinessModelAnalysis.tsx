import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Brain, RefreshCw, ArrowRight, Building2, Zap, DollarSign, Shield,
  AlertTriangle, CheckCircle2, Lightbulb, Users, BarChart3, Cpu,
  TrendingUp, Target, Rocket, Clock, ChevronRight, FlipHorizontal,
  Wrench, Eye, Package, Factory, Layers,
} from "lucide-react";

interface BusinessModelInput {
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
}

interface BusinessModelAnalysisData {
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

export const BusinessModelAnalysis = ({ initialData }: { initialData?: BusinessModelAnalysisData | null }) => {
  const [input, setInput] = useState<BusinessModelInput>({
    type: "",
    description: "",
    revenueModel: "",
    size: "",
    geography: "",
    painPoints: "",
    notes: "",
  });
  const [data, setData] = useState<BusinessModelAnalysisData | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "operations" | "assumptions" | "tech" | "revenue" | "disruption" | "reinvented">("summary");

  const runAnalysis = async () => {
    if (!input.type.trim() || !input.description.trim()) {
      toast.error("Please enter the business type and a description.");
      return;
    }
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("business-model-analysis", {
        body: { businessModel: input },
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

  const tabs = [
    { id: "summary" as const, label: "Business Reality", icon: Eye, number: "01" },
    { id: "operations" as const, label: "Operations Audit", icon: Wrench, number: "02" },
    { id: "assumptions" as const, label: "Hidden Assumptions", icon: Brain, number: "03" },
    { id: "tech" as const, label: "Tech Leverage", icon: Cpu, number: "04" },
    { id: "revenue" as const, label: "Revenue Reinvention", icon: DollarSign, number: "05" },
    { id: "disruption" as const, label: "Disruption Map", icon: Shield, number: "06" },
    { id: "reinvented" as const, label: "Reinvented Model", icon: Rocket, number: "07" },
  ];

  if (!data) {
    return (
      <div className="space-y-6">
        {/* Intro */}
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
            <Building2 size={36} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Business Model Deconstruction</h3>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Apply first-principles thinking to any business model. Uncover hidden friction, rethink cost structures, identify automation opportunities, and reinvent the model from scratch.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full">
            {[
              { icon: Wrench, label: "Operations Audit" },
              { icon: Cpu, label: "Tech Leverage" },
              { icon: DollarSign, label: "Revenue Reinvention" },
              { icon: Shield, label: "Disruption Map" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="p-3 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
                <Icon size={16} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
                <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Input form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Type *</label>
              <input
                type="text"
                value={input.type}
                onChange={(e) => setInput((p) => ({ ...p, type: e.target.value }))}
                placeholder="e.g. Laundromat, Freight broker, Law firm…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
                list="business-examples"
              />
              <datalist id="business-examples">
                {BUSINESS_EXAMPLES.map((ex) => <option key={ex} value={ex} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Model</label>
              <input
                type="text"
                value={input.revenueModel}
                onChange={(e) => setInput((p) => ({ ...p, revenueModel: e.target.value }))}
                placeholder="e.g. Per-use, monthly contract, hourly…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Description *</label>
            <textarea
              value={input.description}
              onChange={(e) => setInput((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe how the business works today — how customers find you, how transactions happen, what the service/product is, how it's delivered…"
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size / Scale</label>
              <input
                type="text"
                value={input.size}
                onChange={(e) => setInput((p) => ({ ...p, size: e.target.value }))}
                placeholder="e.g. $500k/yr, 10 employees, 2 locations"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Geography</label>
              <input
                type="text"
                value={input.geography}
                onChange={(e) => setInput((p) => ({ ...p, geography: e.target.value }))}
                placeholder="e.g. Suburban US, regional, online…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Known Pain Points</label>
              <input
                type="text"
                value={input.painPoints}
                onChange={(e) => setInput((p) => ({ ...p, painPoints: e.target.value }))}
                placeholder="e.g. High labor costs, low margins…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Context (optional)</label>
            <input
              type="text"
              value={input.notes}
              onChange={(e) => setInput((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Anything else that's relevant — competitive dynamics, owner goals, history…"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading || !input.type.trim() || !input.description.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: "hsl(var(--primary))",
              color: "white",
              opacity: (loading || !input.type.trim() || !input.description.trim()) ? 0.6 : 1,
            }}
          >
            {loading ? (
              <><RefreshCw size={15} className="animate-spin" /> Deconstructing Business Model…</>
            ) : (
              <><Brain size={15} /> Run Business Model Analysis</>
            )}
          </button>
          <p className="text-[11px] text-muted-foreground">Uses Gemini 2.5 Pro · Deep reasoning · ~20–40 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Building2 size={15} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Business Model Deconstruction</h3>
            <p className="text-[11px] text-muted-foreground">{input.type}</p>
          </div>
        </div>
        <button
          onClick={() => { setData(null); setInput({ type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "" }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
        >
          New Analysis
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: isActive ? "white" : "hsl(var(--muted-foreground))",
                border: `1px solid ${isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
              }}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: isActive ? "rgba(255,255,255,0.25)" : "hsl(var(--primary) / 0.1)", color: isActive ? "white" : "hsl(var(--primary))" }}>
                {i + 1}
              </span>
              <Icon size={11} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB: BUSINESS REALITY */}
      {activeTab === "summary" && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <Target size={11} /> True Job To Be Done
            </p>
            <p className="text-sm text-foreground leading-relaxed font-medium">{data.businessSummary.trueJobToBeDone}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <DollarSign size={11} /> How Money Flows Today
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.businessSummary.currentModel}</p>
            </div>
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Users size={11} /> Market Position
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.businessSummary.marketPosition}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Lightbulb size={11} style={{ color: "hsl(38 92% 45%)" }} /> Hidden Strengths (Often Underutilized)
            </p>
            <div className="space-y-2">
              {data.businessSummary.hiddenStrengths.map((s, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(38 92% 50% / 0.07)", border: "1px solid hsl(38 92% 50% / 0.25)" }}>
                  <CheckCircle2 size={11} style={{ color: "hsl(38 92% 40%)", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80 leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab("operations")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Operations Audit <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* TAB: OPERATIONS AUDIT */}
      {activeTab === "operations" && (
        <div className="space-y-5">
          {/* Customer Journey */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Eye size={11} /> Customer Journey — Step by Step
            </p>
            <div className="flex flex-col gap-0">
              {data.operationalAudit.customerJourney.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                    {i < data.operationalAudit.customerJourney.length - 1 && (
                      <div className="w-0.5 h-4 mt-1" style={{ background: "hsl(var(--primary) / 0.25)" }} />
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed pb-3">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Friction Points */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))" }} /> Friction Points Found
            </p>
            <div className="space-y-3">
              {data.operationalAudit.frictionPoints.map((fp, i) => {
                const col = IMPACT_COLORS[fp.impact] || IMPACT_COLORS.medium;
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: col.text }}>{fp.stage}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                        {col.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed mb-1">{fp.friction}</p>
                    <p className="text-[10px] text-muted-foreground italic">Root cause: {fp.rootCause}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Structure */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <BarChart3 size={11} /> Cost Structure Analysis
            </p>
            <div className="p-4 rounded-xl space-y-3" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.operationalAudit.costStructure.fixedVsVariable}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Biggest Cost Drivers</p>
                  <div className="space-y-1.5">
                    {data.operationalAudit.costStructure.biggestCostDrivers.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <ChevronRight size={11} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                        <span className="text-foreground/80">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Elimination Candidates</p>
                  <div className="space-y-1.5">
                    {data.operationalAudit.costStructure.eliminationCandidates.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                        <span className="text-foreground/80">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Leaks */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <DollarSign size={11} style={{ color: "hsl(var(--destructive))" }} /> Revenue Leaks — Money Left on the Table
            </p>
            <div className="space-y-2">
              {data.operationalAudit.revenueLeaks.map((leak, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                  <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80 leading-relaxed">{leak}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab("assumptions")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Hidden Assumptions <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* TAB: HIDDEN ASSUMPTIONS */}
      {activeTab === "assumptions" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every business is built on assumptions. Most are inherited from tradition, industry norms, or past constraints. Here's what's holding this model back.
          </p>
          <div className="space-y-3">
            {data.hiddenAssumptions.map((a, i) => {
              const catColor = CATEGORY_COLORS[a.category] || "hsl(var(--muted-foreground))";
              return (
                <div key={i} className="p-4 rounded-xl"
                  style={{ background: a.isChallengeable ? "hsl(var(--card))" : "hsl(var(--muted))", border: `1px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                      <p className="text-xs font-bold text-foreground">{a.assumption}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${catColor}18`, color: catColor }}>
                        {a.category}
                      </span>
                      {a.isChallengeable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 30%)" }}>
                          ✦ Challengeable
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-8 mb-2">{a.currentAnswer}</p>
                  {a.challengeIdea && (
                    <div className="ml-8 p-2 rounded-lg text-xs" style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))" }}>
                      <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>Challenge idea: </span>
                      <span className="text-foreground/80">{a.challengeIdea}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => setActiveTab("tech")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Tech Leverage <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* TAB: TECH LEVERAGE */}
      {activeTab === "tech" && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Cpu size={11} /> Current Technology Level
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.technologyLeverage.currentTechLevel}</p>
          </div>

          {/* Automation Opportunities */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Zap size={11} style={{ color: "hsl(var(--primary))" }} /> Automation Opportunities
            </p>
            <div className="space-y-3">
              {data.technologyLeverage.automationOpportunities.map((opp, i) => {
                const diff = DIFFICULTY_COLORS[opp.implementationDifficulty] || DIFFICULTY_COLORS.medium;
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-foreground">{opp.process}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0"
                        style={{ background: diff.bg, color: diff.text }}>
                        {opp.implementationDifficulty} difficulty
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: "hsl(var(--primary))" }}>→ {opp.technology}</p>
                    <p className="text-xs text-muted-foreground">{opp.costSaving}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Opportunities */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Brain size={11} style={{ color: "hsl(271 81% 50%)" }} /> AI Opportunities
            </p>
            <div className="space-y-2">
              {data.technologyLeverage.aiOpportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "hsl(271 81% 56% / 0.07)", border: "1px solid hsl(271 81% 56% / 0.2)" }}>
                  <Lightbulb size={11} style={{ color: "hsl(271 81% 45%)", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80 leading-relaxed">{opp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Opportunity */}
          <div className="p-4 rounded-xl" style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <Layers size={11} /> Platform / Marketplace Opportunity
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.technologyLeverage.platformOpportunity}</p>
          </div>

          <button onClick={() => setActiveTab("revenue")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Revenue Reinvention <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* TAB: REVENUE REINVENTION */}
      {activeTab === "revenue" && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <DollarSign size={11} /> Current Revenue Mix
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.revenueReinvention.currentRevenueMix}</p>
          </div>

          {/* Untapped Streams */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <TrendingUp size={11} style={{ color: "hsl(142 70% 40%)" }} /> Untapped Revenue Streams
            </p>
            <div className="space-y-3">
              {data.revenueReinvention.untappedStreams.map((stream, i) => {
                const eff = EFFORT_COLORS[stream.effort] || EFFORT_COLORS.medium;
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-xs font-bold text-foreground">{stream.stream}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0"
                        style={{ background: eff.bg, color: eff.text }}>{stream.effort} effort</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed mb-1">{stream.mechanism}</p>
                    <p className="text-[10px] font-semibold" style={{ color: "hsl(142 70% 30%)" }}>Est. size: {stream.estimatedSize}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Redesign */}
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <FlipHorizontal size={11} /> Bold Pricing Model Redesign
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.revenueReinvention.pricingRedesign}</p>
          </div>

          {/* Bundle Opportunities */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Package size={11} /> Bundle / Adjacency Opportunities
            </p>
            <div className="space-y-2">
              {data.revenueReinvention.bundleOpportunities.map((b, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <ChevronRight size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80 leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveTab("disruption")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Disruption Map <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* TAB: DISRUPTION MAP */}
      {activeTab === "disruption" && (
        <div className="space-y-5">
          {/* Vulnerabilities */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Shield size={11} style={{ color: "hsl(var(--destructive))" }} /> Disruption Vulnerabilities
            </p>
            <div className="space-y-2">
              {data.disruptionAnalysis.vulnerabilities.map((v, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                  <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80 leading-relaxed">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disruptor Profile */}
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
              <AlertTriangle size={11} /> The Startup That Could Kill This Business
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{data.disruptionAnalysis.disruptorProfile}</p>
          </div>

          {/* Defense Moves */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Shield size={11} style={{ color: "hsl(142 70% 40%)" }} /> Defensive Strategic Moves
            </p>
            <div className="space-y-2">
              {data.disruptionAnalysis.defenseMoves.map((m, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "hsl(142 70% 45% / 0.07)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                  <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80 leading-relaxed">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Moves */}
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <Rocket size={11} /> If You Were Disrupting This From Scratch With $1M…
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{data.disruptionAnalysis.attackMoves}</p>
          </div>

          <button onClick={() => setActiveTab("reinvented")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Reinvented Model <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* TAB: REINVENTED MODEL */}
      {activeTab === "reinvented" && (
        <div className="space-y-5">
          {/* Hero */}
          <div className="p-6 rounded-2xl relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)", color: "white" }}>
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Rocket size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Reinvented Business Model</span>
              </div>
              <h2 className="text-2xl font-black mb-1">{data.reinventedModel.modelName}</h2>
              <p className="text-xs leading-relaxed opacity-80 max-w-2xl">{data.reinventedModel.coreShift}</p>
            </div>
          </div>

          {/* Key Changes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Zap size={11} style={{ color: "hsl(var(--primary))" }} /> Fundamental Changes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.reinventedModel.keyChanges.map((c, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                  <CheckCircle2 size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/85 leading-relaxed font-medium">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value Proposition + Economics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: "hsl(142 70% 45% / 0.07)", borderLeft: "4px solid hsl(142 70% 45%)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "hsl(142 70% 30%)" }}>
                <Users size={11} /> New Value Proposition
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.reinventedModel.newValueProposition}</p>
            </div>
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: "hsl(217 91% 60% / 0.07)", borderLeft: "4px solid hsl(217 91% 60%)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "hsl(217 91% 40%)" }}>
                <BarChart3 size={11} /> Economic Transformation
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.reinventedModel.economicTransformation}</p>
            </div>
          </div>

          {/* Implementation Roadmap */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Clock size={11} /> Implementation Roadmap
            </p>
            <div className="space-y-3">
              {data.reinventedModel.implementationRoadmap.map((phase, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "hsl(var(--primary))", color: "white" }}>{phase.phase}</span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {phase.actions.map((a, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs">
                        <ChevronRight size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                        <span className="text-foreground/80">{a}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold" style={{ color: "hsl(142 70% 30%)" }}>✓ Milestone: {phase.milestone}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial + Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <TrendingUp size={11} /> Estimated ROI
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.reinventedModel.estimatedROI}</p>
            </div>
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                <AlertTriangle size={11} /> Biggest Risk
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.reinventedModel.biggestRisk}</p>
            </div>
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Factory size={11} /> Required Capabilities
              </p>
              <div className="space-y-1">
                {data.reinventedModel.requiredCapabilities.map((c, i) => (
                  <p key={i} className="text-xs text-foreground/80">• {c}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
