import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/hooks/useAuth";
import { StepNavigator } from "@/components/StepNavigator";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import {
  Target, Brain, Swords, Presentation, Save, RefreshCw, FileDown,
  ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, MessageSquare,
  TrendingUp, TrendingDown, Minus, DollarSign, Package, Store, Truck,
  Factory, Rocket, Globe, Users, ThumbsDown, ThumbsUp, Wrench, Heart,
  ShieldAlert, CheckCircle2, Lightbulb, AlertTriangle, Zap, Database,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";

function TrendBadge({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600"><TrendingUp size={9} /> Rising</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500"><TrendingDown size={9} /> Falling</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-yellow-600"><Minus size={9} /> Stable</span>;
}

export default function ReportPage() {
  const analysis = useAnalysis();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const sectionTabsRef = useRef<HTMLDivElement>(null);

  const { products, selectedProduct, analysisParams, analysisId } = analysis;

  // Redirect to dashboard if no data
  if (analysis.step !== "done" || products.length === 0 || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const isCustomMode = analysisParams?.category === "Custom";
  const modeAccent = isCustomMode ? "hsl(217 91% 38%)" : "hsl(var(--primary))";
  const totalSources = products.reduce((a, p) => a + (p.sources?.length || 0), 0);
  const totalIdeas = products.reduce((acc, p) => acc + (p.flippedIdeas?.length || 0), 0);
  const avgScore = (products.reduce((acc, p) => acc + p.revivalScore, 0) / products.length).toFixed(1);

  const DETAIL_TABS = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "community", label: "Community Intel", icon: MessageSquare },
    { id: "pricing", label: "Pricing Intel", icon: DollarSign },
    { id: "supply", label: "Supply Chain", icon: Package },
    { id: "action", label: "Action Plan", icon: Rocket },
    { id: "ideas", label: "Flipped Ideas", icon: Zap },
  ];

  const currentIdx = DETAIL_TABS.findIndex(t => t.id === analysis.detailTab);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleManualSave = async () => {
    setIsSaving(true);
    await analysis.handleManualSave();
    setIsSaving(false);
  };

  const baseUrl = `/analysis/${analysisId}`;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <StepNavigator
          steps={[
            { step: 2, label: "Intelligence Report", icon: Target, color: modeAccent },
            { step: 3, label: "Disrupt", icon: Brain, color: "hsl(271 81% 55%)" },
            { step: 4, label: "Stress Test", icon: Swords, color: "hsl(350 80% 55%)" },
            { step: 5, label: "Pitch Deck", icon: Presentation, color: "hsl(var(--primary))" },
          ]}
          activeStep={2}
          visitedSteps={new Set([2])}
          onStepChange={(s) => {
            if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/stress-test`);
            else if (s === 5) navigate(`${baseUrl}/pitch`);
          }}
        />

        {analysis.loadedFromSaved && (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "hsl(var(--primary))" }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        )}

        {/* Header */}
        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          <div className="px-5 py-4 flex items-center gap-4" style={{ background: "hsl(var(--muted))" }}>
            <span className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-sm font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>2</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground">Intelligence Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {products.length} product{products.length > 1 ? "s" : ""} · {totalSources} sources · {totalIdeas} ideas · {avgScore}/10 avg
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => selectedProduct && downloadFullAnalysisPDF(selectedProduct)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
              >
                <FileDown size={12} /> PDF
              </button>
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Product Selector */}
        {products.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  analysis.setSelectedProduct(product);
                  analysis.setDetailTab("overview");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{
                  background: selectedProduct?.id === product.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: selectedProduct?.id === product.id ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  border: `1px solid ${selectedProduct?.id === product.id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                }}
              >
                <RevivalScoreBadge score={product.revivalScore} size="sm" />
                {product.name}
              </button>
            ))}
          </div>
        )}

        {/* Product Card */}
        <ProductCard product={selectedProduct} isSelected={true} onClick={() => {}} />

        {/* Detail Tab Nav */}
        <div ref={sectionTabsRef} className="flex flex-wrap gap-1.5">
          {DETAIL_TABS.map((tab) => {
            const isActive = analysis.detailTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  analysis.setDetailTab(tab.id);
                  analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, tab.id]));
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors relative"
                style={{
                  background: isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  border: `1px solid ${isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                }}
              >
                {!isActive && !analysis.visitedDetailTabs.has(tab.id) && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" />
                )}
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Overview */}
        {analysis.detailTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {selectedProduct.keyInsight && (
                  <div className="insight-callout">
                    <p className="section-label text-[10px] mb-1">Key Insight</p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{selectedProduct.keyInsight}</p>
                  </div>
                )}
                {selectedProduct.description && (
                  <div className="section-panel">
                    <p className="section-label text-[10px] mb-2">Description</p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.description}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {selectedProduct.marketSizeEstimate && (
                  <div className="insight-callout--success insight-callout">
                    <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(142 70% 28%)" }}>
                      TAM: {selectedProduct.marketSizeEstimate}
                    </p>
                  </div>
                )}
                <div className="section-panel">
                  <p className="section-label text-[10px] mb-2.5">Live Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sources?.map((src) => (
                      <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.12)" }}>
                        <ExternalLink size={10} /> {src.label?.slice(0, 40)}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="section-panel">
                  <p className="section-label text-[10px] mb-3">Confidence Scores</p>
                  <div className="grid grid-cols-1 gap-3">
                    <ScoreBar label="Adoption Likelihood" score={selectedProduct.confidenceScores?.adoptionLikelihood ?? 7} />
                    <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores?.feasibility ?? 7} />
                    <ScoreBar label="Emotional Resonance" score={selectedProduct.confidenceScores?.emotionalResonance ?? 8} />
                  </div>
                </div>
              </div>
            </div>
            {selectedProduct.trendAnalysis && (
              <div className="insight-callout">
                <p className="section-label text-[10px] mb-2 flex items-center gap-1"><TrendingUp size={11} /> Trend Analysis</p>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.trendAnalysis}</p>
              </div>
            )}
            <div className="section-panel">
              <p className="section-label text-[10px] mb-3">Assumptions Map</p>
              <AssumptionsMap product={selectedProduct} />
            </div>
          </div>
        )}

        {/* Simplified: show placeholder for other tabs — full content remains in the original but extracted */}
        {analysis.detailTab !== "overview" && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            {analysis.detailTab === "community" && "Community intel tab — content loads here."}
            {analysis.detailTab === "pricing" && "Pricing intelligence tab."}
            {analysis.detailTab === "supply" && "Supply chain tab."}
            {analysis.detailTab === "action" && "Action plan tab."}
            {analysis.detailTab === "ideas" && "Flipped ideas tab."}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: "2px solid hsl(var(--border))" }}>
          {currentIdx > 0 ? (
            <button
              onClick={() => {
                const prevTab = DETAIL_TABS[currentIdx - 1].id;
                analysis.setDetailTab(prevTab);
                analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, prevTab]));
                setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "2px solid hsl(var(--border))" }}
            >
              <ChevronLeft size={16} /> {DETAIL_TABS[currentIdx - 1].label}
            </button>
          ) : <div />}
          {currentIdx < DETAIL_TABS.length - 1 ? (
            <button
              onClick={() => {
                const nextTab = DETAIL_TABS[currentIdx + 1].id;
                analysis.setDetailTab(nextTab);
                analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, nextTab]));
                setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Next: {DETAIL_TABS[currentIdx + 1].label} <ChevronRight size={16} />
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-2 rounded" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 35%)" }}>
              All sections explored
            </span>
          )}
        </div>


        {/* SGP Capital CTA */}
        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Rocket size={18} className="text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground mb-1">Ready to Bring This to Life?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SGP Capital helps entrepreneurs and investors turn market intelligence into real businesses.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
              <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ background: "hsl(var(--primary))" }}>
                <Globe size={14} /> Visit SGP Capital
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
