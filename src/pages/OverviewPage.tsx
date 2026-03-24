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

import { useMemo, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { extractAllEvidence, flattenEvidence } from "@/lib/evidenceEngine";
import { CompetitiveInversion } from "@/components/strategic-visuals/CompetitiveInversion";
import { ComplaintHierarchy } from "@/components/strategic-visuals/ComplaintHierarchy";
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
  FlipHorizontal2, Unlock, Clock, Search,
  MapPin, Building2, ShieldCheck, ShieldOff, Shield,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const autoAnalysis = useAutoAnalysis();
  const { narrative, deepenedOpportunities, intelligence, completedSteps, hasRun, isComputing, morphologicalZones: rawMorphZones, constraintInversions, secondOrderUnlocks, temporalUnlocks, competitiveGaps, productConstraints, productOpportunities, productActionPlan } = autoAnalysis;

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

  // ── Early assumption banner from decomposition data (before synthesis) ──
  const earlyAssumptionBanner = useMemo(() => {
    if (assumptionBanner) return null; // full banner available
    const dd = analysis.disruptData as Record<string, unknown> | null;
    if (!dd?._earlyInsights) return null;
    const assumptions = dd.hiddenAssumptions as any[] | undefined;
    if (!assumptions || assumptions.length === 0) return null;
    const top = assumptions
      .filter((a: any) => a.isChallengeable)
      .sort((a: any, b: any) => (b.leverageScore || 0) - (a.leverageScore || 0))[0];
    if (!top) return null;
    return {
      assumption: top.assumption as string,
      challenge: top.challengeIdea || top.impactScenario || "This assumption may be worth questioning.",
      isPreliminary: true,
    };
  }, [assumptionBanner, analysis.disruptData]);

  const hasData = !!narrative || topOpps.length > 0;
  const loading = isComputing && !hasData;

  // Show instant insights when deep analysis hasn't arrived yet
  const showInstantInsights = !!instantInsights && !singleInsight && !earlyConstraint;

  const topMorphZones = rawMorphZones.filter(z => z.vectors.length > 0).slice(0, 3);

  // Product-mode visuals
  const analysisType = analysis.activeMode === "service"
    ? "service"
    : analysis.activeMode === "business"
      ? "business_model"
      : "product";

  const flatEvidence = useMemo(() => flattenEvidence(allEvidence), [allEvidence]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {entityName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Strategic Briefing</p>
      </motion.div>

      {/* ═══ Territory Intelligence (when focusTerritory is available) ═══ */}
      {(analysis.geoData as any)?.focusTerritory && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.03 }}>
          <TerritoryIntelligenceCard territory={(analysis.geoData as any).focusTerritory} />
        </motion.div>
      )}

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

      {/* ═══ 0c. CONSTRAINT INVERSIONS (turn constraint into advantage) ═══ */}
      {constraintInversions.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.09 }}>
          <ConstraintInversionsCard data={constraintInversions} />
        </motion.div>
      )}

      {/* ═══ 0d. SECOND-ORDER UNLOCKS (what becomes possible if constraint removed) ═══ */}
      {secondOrderUnlocks.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.11 }}>
          <SecondOrderUnlocksCard data={secondOrderUnlocks} />
        </motion.div>
      )}

      {/* ═══ 0e. TEMPORAL UNLOCKS (new possibilities since recent changes) ═══ */}
      {temporalUnlocks.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.13 }}>
          <TemporalUnlocksCard data={temporalUnlocks} />
        </motion.div>
      )}

      {/* ═══ 0f. COMPETITIVE GAPS (what no competitor is doing) ═══ */}
      {competitiveGaps.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
          <CompetitiveGapsCard data={competitiveGaps} />
        </motion.div>
      )}

      {/* ═══ 0g. PRODUCT ACTION PLAN (product mode only) ═══ */}
      {analysis.activeMode === "custom" && productActionPlan.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.17 }}>
          <ProductActionPlanCard
            constraints={productConstraints}
            opportunities={productOpportunities}
            actionPlan={productActionPlan}
          />
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
      {(loading || assumptionBanner || earlyAssumptionBanner) && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
          {loading && !earlyAssumptionBanner ? (
            <Skeleton className="h-24 w-full" />
          ) : assumptionBanner ? (
            <AssumptionBannerCard banner={assumptionBanner} />
          ) : earlyAssumptionBanner ? (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: "hsl(38 92% 50% / 0.06)", border: "1.5px solid hsl(38 92% 50% / 0.2)" }}
            >
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(38 92% 50%)" }}>
                  Dangerous Assumption Detected
                </p>
                {isComputing && (
                  <span className="text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                    Refining…
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-foreground leading-snug">
                "{earlyAssumptionBanner.assumption}"
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {earlyAssumptionBanner.challenge}
              </p>
            </div>
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

      {/* ═══ PRODUCT MODE VISUALS (only in product mode, when data is ready) ═══ */}
      {analysisType === "product" && hasData && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }} className="space-y-6">
          <CompetitiveInversion
            product={selectedProduct}
            analysisType={analysisType}
            evidence={flatEvidence}
          />
          <ComplaintHierarchy
            product={selectedProduct}
            evidence={flatEvidence}
          />
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

/* ── TRIZ Seeds Card (invention seeds from constraint patterns) ── */
function TrizSeedsCard({ seeds }: { seeds: import("@/lib/trizEngine").TrizSeed[] }) {
  if (seeds.length === 0) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-primary/20">
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Lightbulb size={13} className="text-primary" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            Invention Seeds — TRIZ Principles
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {seeds[0]?.contradictionType}
          </span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {seeds.map((seed) => (
          <div key={seed.principleId} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold text-primary">
                #{seed.principleId} {seed.principleName}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-auto">
                {seed.inventiveScore}/10
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-snug mb-1.5">
              {seed.applicationHint}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug italic">
              e.g. {seed.historicExample}
            </p>
          </div>
        ))}
      </div>
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

      {/* TRIZ Invention Seeds */}
      {insights.trizSeeds.length > 0 && (
        <TrizSeedsCard seeds={insights.trizSeeds} />
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

/* ── Constraint Inversions Card (turn constraint into competitive advantage) ── */
function ConstraintInversionsCard({ data }: { data: import("@/lib/constraintInverter").ConstraintInversion[] }) {
  if (data.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <FlipHorizontal2 size={13} className="text-amber-500" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Turn Constraint Into Advantage ({data.length})
        </span>
      </div>
      <div className="space-y-2">
        {data.map((inv) => (
          <div key={inv.id} className="rounded-xl px-4 py-3 bg-amber-500/5 border border-amber-500/15">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
                {inv.sourceConstraint.sourceConstraintLabel}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                inv.viability === "strong" ? "bg-green-500/15 text-green-600" :
                inv.viability === "moderate" ? "bg-amber-500/15 text-amber-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {inv.viability}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug mb-1">{inv.invertedFrame}</p>
            <p className="text-xs text-muted-foreground leading-snug">{inv.mechanism}</p>
            {inv.precedent && (
              <p className="text-[10px] text-muted-foreground mt-1 italic">e.g. {inv.precedent}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Second-Order Unlocks Card (what becomes possible if constraint removed) ── */
function SecondOrderUnlocksCard({ data }: { data: import("@/lib/secondOrderEngine").SecondOrderUnlock[] }) {
  if (data.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Unlock size={13} className="text-emerald-500" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Remove Constraint Entirely ({data.length})
        </span>
      </div>
      <div className="space-y-2">
        {data.map((unlock) => (
          <div key={unlock.id} className="rounded-xl px-4 py-3 bg-emerald-500/5 border border-emerald-500/15">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                {unlock.sourceConstraint.sourceConstraintLabel}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                unlock.viability === "transformational" ? "bg-green-500/15 text-green-600" :
                unlock.viability === "significant" ? "bg-emerald-500/15 text-emerald-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {unlock.viability}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug mb-1">{unlock.unlockedBusinessModel}</p>
            <p className="text-xs text-muted-foreground leading-snug">{unlock.valueMechanism}</p>
            {unlock.precedents.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 italic">e.g. {unlock.precedents[0]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Temporal Unlocks Card (new possibilities since recent changes) ── */
function TemporalUnlocksCard({ data }: { data: import("@/lib/temporalArbitrageEngine").TemporalUnlock[] }) {
  if (data.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Clock size={13} className="text-blue-500" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          New Possibilities Since 2024 ({data.length})
        </span>
      </div>
      <div className="space-y-2">
        {data.map((unlock) => (
          <div key={unlock.id} className="rounded-xl px-4 py-3 bg-blue-500/5 border border-blue-500/15">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                {unlock.recentChange}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                unlock.timingWindow === "narrow" ? "bg-red-500/15 text-red-600" :
                unlock.timingWindow === "moderate" ? "bg-blue-500/15 text-blue-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {unlock.timingWindow} window
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug mb-1">{unlock.nowPossible}</p>
            <p className="text-xs text-muted-foreground leading-snug">Previously: {unlock.previouslyImpossible}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Competitive Gaps Card (what no competitor is doing) ── */
function CompetitiveGapsCard({ data }: { data: import("@/lib/negativeSpaceEngine").CompetitiveGap[] }) {
  if (data.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Search size={13} className="text-violet-500" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          What No One Else Does ({data.length})
        </span>
      </div>
      <div className="space-y-2">
        {data.map((gap) => (
          <div key={gap.id} className="rounded-xl px-4 py-3 bg-violet-500/5 border border-violet-500/15">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600">
                {gap.gapType.replace(/_/g, " ")}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                gap.opportunityConfidence === "high" ? "bg-green-500/15 text-green-600" :
                gap.opportunityConfidence === "medium" ? "bg-violet-500/15 text-violet-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {gap.opportunityConfidence} confidence
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug mb-1">{gap.opportunityHypothesis}</p>
            <p className="text-xs text-muted-foreground leading-snug">{gap.gapDescription}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Product Action Plan Card (product mode only) ── */
function ProductActionPlanCard({
  constraints,
  opportunities,
  actionPlan,
}: {
  constraints: import("@/lib/productMode/types").ProductConstraint[];
  opportunities: import("@/lib/productMode/types").ProductOpportunity[];
  actionPlan: import("@/lib/productMode/types").ProductAction[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (actionPlan.length === 0) return null;

  const PHASE_COLORS = [
    "hsl(217 91% 55%)",
    "hsl(263 70% 60%)",
    "hsl(142 70% 38%)",
    "hsl(38 92% 45%)",
    "hsl(0 72% 52%)",
  ];

  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
              Product GTM Action Plan
            </h3>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">{actionPlan.length} phases</span>
        </div>

        {/* Top constraints */}
        {constraints.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {constraints.slice(0, 3).map(c => (
              <span
                key={c.id}
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: c.impact === "high" ? "hsl(0 72% 52% / 0.4)" : "hsl(38 92% 45% / 0.4)",
                  color: c.impact === "high" ? "hsl(0 72% 52%)" : "hsl(38 92% 45%)",
                  background: c.impact === "high" ? "hsl(0 72% 52% / 0.08)" : "hsl(38 92% 45% / 0.08)",
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}

        {/* Top opportunity */}
        {opportunities.length > 0 && (
          <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2 mb-4">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Top Opportunity</p>
            <p className="text-xs font-bold text-foreground">{opportunities[0].label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{opportunities[0].gtmImplication}</p>
          </div>
        )}

        {/* Phase timeline */}
        <div className="space-y-2">
          {actionPlan.slice(0, expanded ? 5 : 2).map((step, i) => (
            <div key={step.phase} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
                style={{ background: PHASE_COLORS[i % PHASE_COLORS.length] }}
              >
                {step.phase}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-bold text-foreground">{step.label}</p>
                  <span className="text-[9px] text-muted-foreground">{step.timeHorizon}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{step.successGate}</p>
              </div>
            </div>
          ))}
        </div>

        {actionPlan.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-primary hover:opacity-80"
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {expanded ? "Show less" : `Show all ${actionPlan.length} phases`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Territory Intelligence Card ── */
function TerritoryIntelligenceCard({ territory }: { territory: any }) {
  const [expanded, setExpanded] = useState(false);

  const legalStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    legal: { label: "Legal", color: "text-green-600", icon: ShieldCheck },
    restricted: { label: "Restricted", color: "text-yellow-600", icon: ShieldAlert },
    prohibited: { label: "Prohibited", color: "text-red-600", icon: ShieldOff },
    pending: { label: "Pending", color: "text-blue-600", icon: Shield },
    not_applicable: { label: "N/A", color: "text-muted-foreground", icon: Shield },
  };

  const status = territory.regulatory?.legalStatus || "not_applicable";
  const statusConfig = legalStatusConfig[status] || legalStatusConfig.not_applicable;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-primary" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            Territory Intelligence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{territory.name}</span>
          {territory.type && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              {territory.type.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {territory.census && (
          <div className="grid grid-cols-3 gap-2">
            {territory.census.population > 0 && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Population</p>
                <p className="text-sm font-extrabold text-foreground">
                  {territory.census.population >= 1_000_000
                    ? `${(territory.census.population / 1_000_000).toFixed(1)}M`
                    : territory.census.population.toLocaleString()}
                </p>
              </div>
            )}
            {territory.census.medianIncome > 0 && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Median Income</p>
                <p className="text-sm font-extrabold text-foreground">
                  ${(territory.census.medianIncome / 1000).toFixed(0)}k
                </p>
              </div>
            )}
            {territory.census.medianAge > 0 && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Median Age</p>
                <p className="text-sm font-extrabold text-foreground">{territory.census.medianAge}</p>
              </div>
            )}
          </div>
        )}

        {territory.business && territory.business.establishments > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
            <Building2 size={13} className="text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground font-semibold">
                {territory.business.establishments.toLocaleString()} establishments
              </p>
              <p className="text-[10px] text-muted-foreground">
                {territory.business.employees?.toLocaleString()} employees · Rank #{territory.business.nationalRank} nationally
              </p>
            </div>
            {territory.business.opportunityScore > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                {territory.business.opportunityScore}/100
              </span>
            )}
          </div>
        )}

        {territory.regulatory && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusIcon size={13} className={statusConfig.color} />
              <span className={`text-xs font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-xs text-muted-foreground">regulatory status</span>
            </div>
            {territory.regulatory.keyRules && territory.regulatory.keyRules.length > 0 && (
              <ul className="space-y-1">
                {territory.regulatory.keyRules.slice(0, 3).map((rule: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5 flex-shrink-0">·</span>
                    <p className="text-xs text-muted-foreground leading-snug">{rule}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {territory.regulatory?.stateSpecificRules && territory.regulatory.stateSpecificRules.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Hide" : "View"} full regulatory profile
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 border-t border-border pt-2">
                {territory.regulatory.complianceNotes && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{territory.regulatory.complianceNotes}</p>
                )}
                {territory.regulatory.stateSpecificRules.map((rule: { rule: string; source: string }, i: number) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-foreground leading-snug">{rule.rule}</p>
                    {rule.source && (
                      <p className="text-[10px] text-muted-foreground mt-1">Source: {rule.source}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
