/**
 * Overview Page — Operator Briefing
 *
 * Five sections:
 *   1. Your Situation — restate the problem
 *   2. Key Insights — 3 cards: what + why it matters
 *   3. Business Reality — strengths / weaknesses / risks
 *   4. Top Opportunities — actionable opportunities
 *   5. Recommended Focus — single strategic takeaway
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import {
  aggregateOpportunities,
  type AggregatedOpportunity,
  type CommandDeckMetricsInput,
} from "@/lib/commandDeckMetrics";
import {
  extractBusinessReality,
  extractKeyInsights,
  extractRecommendedFocus,
  type BusinessReality,
  type KeyInsight,
} from "@/lib/swotExtractor";
import { humanizeLabel } from "@/lib/humanize";
import { motion } from "framer-motion";
import {
  ArrowRight, TrendingUp, AlertTriangle, ShieldAlert,
  Lightbulb, Eye, Target, Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const autoAnalysis = useAutoAnalysis();
  const { narrative, deepenedOpportunities, intelligence, completedSteps, hasRun, isComputing } = autoAnalysis;

  const { selectedProduct, adaptiveContext, analysisId: ctxAnalysisId } = analysis;

  const urlAnalysisId = useMemo(() => {
    const m = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return m?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;

  // Evidence + opportunity aggregation
  const allEvidence = useMemo(() => extractAllEvidence({
    products: analysis.products, selectedProduct,
    disruptData: analysis.disruptData, redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData, intelligence,
    analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
    geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
  }), [analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, analysis.activeMode,
    analysis.geoData, analysis.regulatoryData]);

  const metricsInput: CommandDeckMetricsInput = useMemo(() => ({
    products: analysis.products, selectedProduct,
    disruptData: analysis.disruptData, redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData, intelligence, completedSteps,
    evidence: allEvidence,
  }), [analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, completedSteps, allEvidence]);

  const topOpps = useMemo(() => aggregateOpportunities(metricsInput), [metricsInput]);
  const businessReality = useMemo(() => extractBusinessReality(narrative), [narrative]);
  const keyInsights = useMemo(() => extractKeyInsights(narrative), [narrative]);
  const recommendedFocus = useMemo(() => extractRecommendedFocus(narrative), [narrative]);

  const problemStatement = adaptiveContext?.problemStatement || selectedProduct?.description || "";
  const entityName = adaptiveContext?.entity?.name || selectedProduct?.name || "Analysis";
  const hasData = !!narrative || topOpps.length > 0;
  const loading = isComputing && !hasData;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {entityName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Operator Briefing</p>
      </motion.div>

      {/* ═══ 1. KEY INSIGHTS ═══ */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb size={15} className="text-primary" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Key Insights
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : keyInsights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {keyInsights.map((ki, i) => (
                <InsightCard key={i} insight={ki} index={i} />
              ))}
            </div>
          ) : (
            <Card className="border-border/60">
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground italic">Run the analysis to surface key insights.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* ═══ 3. BUSINESS REALITY ═══ */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Target size={15} className="text-primary" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Business Reality
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RealityColumn
                icon={TrendingUp}
                label="Strengths"
                items={businessReality.strengths}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
              />
              <RealityColumn
                icon={AlertTriangle}
                label="Weaknesses"
                items={businessReality.weaknesses}
                color="text-amber-500"
                bg="bg-amber-500/10"
              />
              <RealityColumn
                icon={ShieldAlert}
                label="Risks"
                items={businessReality.risks}
                color="text-red-500"
                bg="bg-red-500/10"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ 4. TOP OPPORTUNITIES ═══ */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb size={15} className="text-primary" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Top Opportunities
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : topOpps.length > 0 ? (
            <div className="space-y-3">
              {topOpps.slice(0, 3).map((opp, i) => (
                <OpportunityCard key={opp.id} opp={opp} index={i} />
              ))}
            </div>
          ) : (
            <Card className="border-border/60">
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground italic">Complete the analysis to surface opportunities.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* ═══ 5. RECOMMENDED FOCUS ═══ */}
      {(loading || recommendedFocus) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Compass size={15} className="text-primary" />
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  Recommended Focus
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90">{recommendedFocus}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }} className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={() => navigate(`/analysis/${analysisId}/command-deck`)}
          className="gap-2"
        >
          Explore Full Analysis
          <ArrowRight size={16} />
        </Button>
      </motion.div>
    </div>
  );
}

/* ── Insight Card ── */
function InsightCard({ insight, index }: { insight: KeyInsight; index: number }) {
  return (
    <Card className="border-border/60 h-full">
      <CardContent className="pt-5 space-y-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Insight
          </span>
          <p className="text-sm font-semibold text-foreground leading-snug mt-1">
            {insight.insight}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Why it matters
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {insight.whyItMatters}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Reality Column ── */
function RealityColumn({
  icon: Icon, label, items, color, bg,
}: {
  icon: React.ElementType; label: string; items: string[]; color: string; bg: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${bg}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} className={color} />
        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${color}`}>{label}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-foreground/80 leading-snug flex gap-1.5">
              <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">Pending analysis</p>
      )}
    </div>
  );
}

/* ── Opportunity Card ── */
function OpportunityCard({ opp, index }: { opp: AggregatedOpportunity; index: number }) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-5 pb-4 space-y-2">
        <div className="flex gap-3 items-start">
          <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {humanizeLabel(opp.label)}
            </p>
            {opp.source && (
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Why it exists
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">{opp.source}</p>
              </div>
            )}
            {opp.firstMove && (
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  What to do
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">{humanizeLabel(opp.firstMove)}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
