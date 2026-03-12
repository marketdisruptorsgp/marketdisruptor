/**
 * Overview Page — Founder Briefing
 *
 * Read in 90 seconds. Every field has hard character limits.
 * Sections:
 *   1. Single Insight (most surprising finding)
 *   2. Assumption Banner (everyone assumes / evidence suggests / so what)
 *   3. Business Reality (working / blocking / opening / risk — 2 sentences each)
 *   4. Critical Question (max 20 words)
 *   5. Opportunities (exactly 3 with badges)
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import {
  aggregateOpportunities,
  type CommandDeckMetricsInput,
} from "@/lib/commandDeckMetrics";
import {
  extractSingleInsight,
  extractAssumptionBanner,
  extractCriticalQuestion,
  extractSwotProse,
  extractOpportunitiesWithBadges,
  type SingleInsight,
  type AssumptionBanner,
  type SwotProse,
  type OpportunityWithBadges,
} from "@/lib/swotExtractor";
import { motion } from "framer-motion";
import {
  ArrowRight, Zap, TrendingUp, AlertTriangle,
  ShieldAlert, Target, HelpCircle, Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const autoAnalysis = useAutoAnalysis();
  const { narrative, deepenedOpportunities, intelligence, completedSteps, hasRun, isComputing } = autoAnalysis;

  const { selectedProduct, adaptiveContext, analysisId: ctxAnalysisId, decompositionData } = analysis;

  // Extract early binding constraint hypothesis from Phase 1 decomposition
  const earlyConstraint = useMemo(() => {
    if (!decompositionData) return null;
    const d = decompositionData as Record<string, unknown>;
    const hypothesis = d._bindingConstraintHypothesis as Record<string, unknown> | undefined;
    if (!hypothesis?.constraint || hypothesis.constraint === "Unknown structural blocker") return null;
    return {
      constraint: String(hypothesis.constraint),
      reasoning: String(hypothesis.reasoning || ""),
      leverageScore: Number(hypothesis.leverageScore || 0),
      bestTransformation: String(hypothesis.bestTransformation || "elimination"),
      bottleneck: hypothesis.bottleneck as { resource: string; impact: string; severity: string } | null,
      highestFriction: hypothesis.highestFriction as { stage: string; detail: string; costShare: string } | null,
    };
  }, [decompositionData]);

  const urlAnalysisId = useMemo(() => {
    const m = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return m?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;

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
  const deepOpps = deepenedOpportunities || [];
  const entityName = adaptiveContext?.entity?.name || selectedProduct?.name || "This business";

  // New spec extractors
  const singleInsight = useMemo(() => extractSingleInsight(narrative, deepOpps), [narrative, deepOpps]);
  const assumptionBanner = useMemo(() => extractAssumptionBanner(narrative, deepOpps, entityName), [narrative, deepOpps, entityName]);
  const swotProse = useMemo(() => extractSwotProse(narrative, deepOpps), [narrative, deepOpps]);
  const criticalQuestion = useMemo(() => extractCriticalQuestion(narrative, deepOpps), [narrative, deepOpps]);
  const opportunities = useMemo(() => extractOpportunitiesWithBadges(topOpps, deepOpps), [topOpps, deepOpps]);

  const hasData = !!narrative || topOpps.length > 0;
  const loading = isComputing && !hasData;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {entityName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Strategic Briefing</p>
      </motion.div>

      {/* ═══ 1. SINGLE INSIGHT ═══ */}
      {(loading || singleInsight) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : singleInsight ? (
            <InsightHero insight={singleInsight} />
          ) : null}
        </motion.div>
      )}

      {/* ═══ 2. ASSUMPTION BANNER ═══ */}
      {(loading || assumptionBanner) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : assumptionBanner ? (
            <AssumptionBannerCard banner={assumptionBanner} />
          ) : null}
        </motion.div>
      )}

      {/* ═══ 3. BUSINESS REALITY ═══ */}
      {(loading || Object.values(swotProse).some(Boolean)) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.18 }}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {swotProse.working && (
                <RealityCard
                  icon={TrendingUp}
                  label="What's Working"
                  text={swotProse.working}
                  colorClass="text-emerald-500"
                  bgClass="bg-emerald-500/5"
                  borderClass="border-emerald-500/15"
                />
              )}
              {swotProse.blocking && (
                <RealityCard
                  icon={AlertTriangle}
                  label="What's Blocking Growth"
                  text={swotProse.blocking}
                  colorClass="text-amber-500"
                  bgClass="bg-amber-500/5"
                  borderClass="border-amber-500/15"
                />
              )}
              {swotProse.opening && (
                <RealityCard
                  icon={Target}
                  label="The Opening"
                  text={swotProse.opening}
                  colorClass="text-primary"
                  bgClass="bg-primary/5"
                  borderClass="border-primary/15"
                />
              )}
              {swotProse.risk && (
                <RealityCard
                  icon={ShieldAlert}
                  label="The Risk"
                  text={swotProse.risk}
                  colorClass="text-destructive"
                  bgClass="bg-destructive/5"
                  borderClass="border-destructive/15"
                />
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ 4. CRITICAL QUESTION ═══ */}
      {(loading || criticalQuestion) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : criticalQuestion ? (
            <div className="rounded-xl px-5 py-4 bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={14} className="text-primary flex-shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  The Question to Answer First
                </span>
              </div>
              <p className="text-base font-bold text-foreground leading-snug">
                {criticalQuestion}
              </p>
            </div>
          ) : null}
        </motion.div>
      )}

      {/* ═══ 5. OPPORTUNITIES (exactly 3) ═══ */}
      {(loading || opportunities.length > 0) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.22 }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Zap size={15} className="text-primary" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Top Moves
              </h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp, i) => (
                  <OpportunityCard key={i} opp={opp} index={i} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }} className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={() => navigate(`/analysis/${analysisId}/command-deck`)}
          className="gap-2"
        >
          See Full Analysis
          <ArrowRight size={16} />
        </Button>
      </motion.div>
    </div>
  );
}

/* ── Insight Hero ── */
function InsightHero({ insight }: { insight: SingleInsight }) {
  return (
    <div className="rounded-xl px-5 py-5 bg-primary/5 border-2 border-primary/20">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
        The Key Finding
      </span>
      <h2 className="text-lg sm:text-xl font-black text-foreground leading-snug mt-2">
        {insight.headline}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
        {insight.body}
      </p>
    </div>
  );
}

/* ── Assumption Banner ── */
function AssumptionBannerCard({ banner }: { banner: AssumptionBanner }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 px-4 py-3 bg-destructive/5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-destructive mb-1">
            Everyone Assumes
          </p>
          <p className="text-sm text-foreground/80 leading-snug">
            "{banner.everyone_assumes}"
          </p>
        </div>
        <div className="flex items-center justify-center px-2">
          <ArrowRight size={14} className="text-muted-foreground rotate-90 sm:rotate-0" />
        </div>
        <div className="flex-1 px-4 py-3 bg-primary/5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary mb-1">
            The Evidence Suggests
          </p>
          <p className="text-sm text-foreground font-semibold leading-snug">
            "{banner.evidence_suggests}"
          </p>
        </div>
      </div>
      <div className="px-4 py-2 bg-muted/40 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{banner.so_what}</span>
        </p>
      </div>
    </div>
  );
}

/* ── Reality Card ── */
function RealityCard({
  icon: Icon, label, text, colorClass, bgClass, borderClass,
}: {
  icon: React.ElementType; label: string; text: string;
  colorClass: string; bgClass: string; borderClass: string;
}) {
  return (
    <Card className={`${bgClass} ${borderClass} border`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={13} className={colorClass} />
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${colorClass}`}>{label}</span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
}

/* ── Opportunity Card ── */
function OpportunityCard({ opp, index }: { opp: OpportunityWithBadges; index: number }) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-5 pb-4">
        <div className="flex gap-3 items-start">
          <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-bold text-foreground leading-snug">
              {opp.title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {opp.description}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {opp.badges.map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
