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
import type { InstantInsights } from "@/lib/instantInsights";
import type { OpportunityZone } from "@/lib/opportunityDesignEngine";
import {
  ArrowRight, Zap, TrendingUp, AlertTriangle,
  ShieldAlert, Target, HelpCircle, Lock,
  Lightbulb, Crosshair, AlertCircle, Grid3X3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const autoAnalysis = useAutoAnalysis();
  const { narrative, deepenedOpportunities, intelligence, completedSteps, hasRun, isComputing, morphologicalZones: rawMorphZones } = autoAnalysis;

  const { selectedProduct, adaptiveContext, analysisId: ctxAnalysisId, decompositionData, instantInsights } = analysis;

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

  // Show instant insights when deep analysis hasn't arrived yet
  const showInstantInsights = !!instantInsights && !singleInsight && !earlyConstraint;

  const topMorphZones = rawMorphZones.filter(z => z.vectors.length > 0).slice(0, 3);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {entityName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Strategic Briefing</p>
      </motion.div>

      {/* ═══ -1. INSTANT INSIGHTS (from scraped data — shows in ~0s after scraping) ═══ */}
      {showInstantInsights && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }} className="space-y-4">
          <InstantInsightsPanel insights={instantInsights} isRefining={isComputing} />
        </motion.div>
      )}

      {/* ═══ 0b. MORPHOLOGICAL ZONES (from strategic engine — shows after AI phase 1 completes) ═══ */}
      {topMorphZones.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.07 }}>
          <MorphologicalZonesPanel zones={topMorphZones} />
        </motion.div>
      )}

      {/* ═══ 0. EARLY BINDING CONSTRAINT (from Phase 1 — shows in ~20s) ═══ */}
      {earlyConstraint && !singleInsight && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.08 }}>
          <EarlyConstraintCard constraint={earlyConstraint} isRefining={isComputing} />
        </motion.div>
      )}

      {/* ═══ 1. SINGLE INSIGHT ═══ */}
      {(loading || singleInsight) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
          {loading && !earlyConstraint ? (
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
                {opportunities.map((opp, i) => {
                  const matchedDeep = deepOpps.find(d =>
                    d.label === opp.title || d.reconfigurationLabel === opp.title
                  );
                  const precedent = matchedDeep?.strategicPrecedents?.[0];
                  return (
                    <OpportunityCard key={i} opp={opp} index={i} precedent={precedent} />
                  );
                })}
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
function OpportunityCard({ opp, index, precedent }: {
  opp: OpportunityWithBadges;
  index: number;
  precedent?: { company: string; description: string; pattern: string } | null;
}) {
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
              {precedent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                  Inspired by: {precedent.company} → {precedent.pattern}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Early Binding Constraint Card (Phase 1 — ~20s) ── */
function EarlyConstraintCard({
  constraint,
  isRefining,
}: {
  constraint: {
    constraint: string;
    reasoning: string;
    leverageScore: number;
    bestTransformation: string;
    bottleneck: { resource: string; impact: string; severity: string } | null;
    highestFriction: { stage: string; detail: string; costShare: string } | null;
  };
  isRefining: boolean;
}) {
  return (
    <div className="rounded-xl px-5 py-5 bg-amber-500/5 border-2 border-amber-500/20 relative overflow-hidden">
      {isRefining && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 overflow-hidden">
          <div className="h-full w-1/3 bg-amber-500/60 animate-pulse" 
               style={{ animation: "shimmer 2s ease-in-out infinite" }} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Lock size={13} className="text-amber-500" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">
          #1 Structural Blocker
        </span>
        {isRefining && (
          <span className="text-[9px] font-medium text-amber-500/60 ml-auto">
            Refining with deep analysis…
          </span>
        )}
      </div>
      <h2 className="text-lg font-black text-foreground leading-snug">
        {constraint.constraint}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
        {constraint.reasoning}
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          Leverage: {constraint.leverageScore.toFixed(1)}/10
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
          Best move: {constraint.bestTransformation}
        </span>
        {constraint.highestFriction && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            High friction: {constraint.highestFriction.stage}
          </span>
        )}
      </div>
      {constraint.bottleneck && (
        <p className="text-xs text-muted-foreground mt-2 pl-3 border-l-2 border-amber-500/20">
          <span className="font-semibold text-foreground/80">Bottleneck:</span>{" "}
          {constraint.bottleneck.resource} — {constraint.bottleneck.impact}
        </p>
      )}
    </div>
  );
}

/* ── Instant Insights Panel (from scraped data — ~0s) ── */
function InstantInsightsPanel({
  insights,
  isRefining,
}: {
  insights: InstantInsights;
  isRefining: boolean;
}) {
  const REASON_ICONS: Record<string, typeof Lightbulb> = {
    pricing_default: Target,
    supply_chain: Crosshair,
    labor: AlertCircle,
    industry_norm: Lightbulb,
    distribution: Zap,
  };

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="rounded-xl px-5 py-4 bg-primary/5 border border-primary/15 relative overflow-hidden">
        {isRefining && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
            <div className="h-full w-1/3 bg-primary/60" style={{ animation: "pulse 2s ease-in-out infinite" }} />
          </div>
        )}
        <div className="flex items-center gap-2 mb-1.5">
          <Zap size={13} className="text-primary" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            Instant Structural Scan
          </span>
          {isRefining && (
            <span className="text-[9px] font-medium text-muted-foreground ml-auto">
              Deep analysis running…
            </span>
          )}
        </div>
        <p className="text-sm text-foreground font-medium leading-relaxed">{insights.summary}</p>
      </div>

      {/* Contrarian Pair */}
      {insights.contrarianPair && (
        <div className="rounded-xl overflow-hidden border-2 border-primary/20">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 px-4 py-3 bg-destructive/5">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-destructive mb-1">
                Everyone Assumes
              </p>
              <p className="text-sm text-foreground/80 leading-snug">
                "{insights.contrarianPair.everyoneAssumes}"
              </p>
            </div>
            <div className="flex items-center justify-center px-2 py-1 sm:py-0">
              <ArrowRight size={14} className="text-muted-foreground rotate-90 sm:rotate-0" />
            </div>
            <div className="flex-1 px-4 py-3 bg-primary/5">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary mb-1">
                Evidence Suggests
              </p>
              <p className="text-sm text-foreground font-semibold leading-snug">
                "{insights.contrarianPair.evidenceSuggests}"
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-muted/40 border-t border-border">
            <p className="text-xs text-muted-foreground leading-snug">
              <span className="font-bold text-foreground">The move: </span>
              {insights.contrarianPair.soWhat}
            </p>
          </div>
        </div>
      )}

      {/* Binding constraint */}
      {insights.bindingConstraint && (
        <div className="rounded-xl px-5 py-4 bg-destructive/5 border border-destructive/15">
          <div className="flex items-center gap-2 mb-1.5">
            <Lock size={13} className="text-destructive" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-destructive">
              #1 Structural Blocker (Hypothesis)
            </span>
          </div>
          <h3 className="text-base font-black text-foreground leading-snug">{insights.bindingConstraint.label}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">{insights.bindingConstraint.reasoning}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            Leverage: {insights.bindingConstraint.leverageScore.toFixed(1)}/10
          </span>
        </div>
      )}

      {/* Disruption Vulnerability */}
      {insights.disruptionVulnerability && (
        <div className="rounded-xl px-5 py-4 bg-orange-500/5 border border-orange-500/20">
          <div className="flex items-start gap-3">
            <ShieldAlert size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500">
                  Disruption Vulnerability
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                  {insights.disruptionVulnerability.label}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {Math.round(insights.disruptionVulnerability.score * 100)}% signal match
                </span>
              </div>
              <p className="text-sm text-foreground mt-1 leading-relaxed">
                {insights.disruptionVulnerability.mechanism}
              </p>
              {insights.disruptionVulnerability.matchedSignals.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {insights.disruptionVulnerability.matchedSignals.slice(0, 5).map((signal, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
                      {signal}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Most Dangerous Assumption */}
      {insights.dangerousAssumption && (
        <div className="rounded-xl px-5 py-4 bg-destructive/5 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-destructive">
                  Most Dangerous Assumption
                </span>
                <span className="text-[10px] font-bold text-destructive ml-auto">
                  {insights.dangerousAssumption.leverageEstimate}/10
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {insights.dangerousAssumption.assumption}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {insights.dangerousAssumption.challengeHint}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Highest Leverage Opportunity */}
      {insights.highestLeverage && (
        <div className="rounded-xl px-5 py-4 bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Target size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Highest Leverage Opportunity
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-auto">
                  {insights.highestLeverage.score}/10
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {insights.highestLeverage.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {insights.highestLeverage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top assumptions */}
      {insights.assumptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Hidden Assumptions to Challenge ({insights.assumptions.length})
          </p>
          <div className="grid gap-2">
            {insights.assumptions.slice(0, 4).map((a, i) => {
              const Icon = REASON_ICONS[a.reason] || Lightbulb;
              return (
                <div key={i} className="rounded-lg px-4 py-3 bg-card border border-border">
                  <div className="flex items-start gap-2">
                    <Icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{a.assumption}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.challengeHint}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary flex-shrink-0">{a.leverageEstimate}/10</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top leverage points */}
      {insights.leveragePoints.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Highest-Leverage Opportunities ({insights.leveragePoints.length})
          </p>
          <div className="grid gap-2">
            {insights.leveragePoints.slice(0, 3).map((lp, i) => (
              <div key={i} className="rounded-lg px-4 py-3 bg-card border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{lp.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lp.description}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    {lp.score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Morphological Zones Panel (from strategic engine — after AI phase 1) ── */
function MorphologicalZonesPanel({ zones }: { zones: OpportunityZone[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Grid3X3 size={13} className="text-primary" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Opportunity Zones ({zones.length})
        </span>
      </div>
      <div className="space-y-2">
        {zones.map((zone) => (
          <div key={zone.id} className="rounded-xl px-4 py-3 bg-primary/5 border border-primary/15">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-1">
              {zone.theme}
            </p>
            <div className="space-y-1 mt-2">
              {zone.vectors.slice(0, 3).map((vec) => (
                <div key={vec.id} className="flex items-start gap-2">
                  <ArrowRight size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/80 leading-snug">{vec.rationale}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {zone.vectors.length} vector{zone.vectors.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {zone.vectors[0]?.explorationMode === "constraint" ? "constraint-driven" : "adjacency"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
