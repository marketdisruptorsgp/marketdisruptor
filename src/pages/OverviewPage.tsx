/**
 * Overview Page — Analysis Landing Tab
 *
 * Two-column layout:
 *   Left:  Problem Statement + Key Challenges
 *   Right: Analysis Overview + SWOT + Top Opportunities
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { useModeTheme } from "@/hooks/useModeTheme";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import {
  aggregateOpportunities,
  type CommandDeckMetricsInput,
} from "@/lib/commandDeckMetrics";
import { extractSwot, type SwotData } from "@/lib/swotExtractor";
import { motion } from "framer-motion";
import {
  MessageSquareText, Target, ArrowRight, TrendingUp,
  ShieldAlert, Zap, AlertTriangle, Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const autoAnalysis = useAutoAnalysis();
  const { narrative, deepenedOpportunities, intelligence, completedSteps, hasRun, isComputing } = autoAnalysis;

  const { selectedProduct, adaptiveContext, analysisId: ctxAnalysisId } = analysis;

  const urlAnalysisId = useMemo(() => {
    const m = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return m?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;

  // Build metrics input for opportunity aggregation
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
  const swot: SwotData = useMemo(() => extractSwot(narrative, topOpps, deepenedOpportunities), [narrative, topOpps, deepenedOpportunities]);

  const problemStatement = adaptiveContext?.problemStatement || selectedProduct?.notes || selectedProduct?.description || "";
  const challenges = adaptiveContext?.selectedChallenges || [];
  const entityName = adaptiveContext?.entity?.name || selectedProduct?.name || "Analysis";
  const summaryText = narrative?.executiveSummary || narrative?.narrativeSummary || "";
  const loading = isComputing || !hasRun;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {entityName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Analysis Overview</p>
      </motion.div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="space-y-5">
          {/* Problem Statement */}
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText size={15} className="text-primary" />
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Problem Statement
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {problemStatement ? (
                  <p className="text-sm leading-relaxed text-foreground/90">{problemStatement}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No problem statement provided.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Challenges */}
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-primary" />
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Key Challenges
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges.length > 0 ? (
                  challenges.map((ch, i) => (
                    <div key={ch.id || i} className="flex gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          ch.priority === "high"
                            ? "bg-destructive/15 text-destructive"
                            : ch.priority === "medium"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">{ch.question}</p>
                        {ch.context && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ch.context}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No challenges identified yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-5">
          {/* Analysis Overview */}
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-primary" />
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Analysis Overview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : summaryText ? (
                  <p className="text-sm leading-relaxed text-foreground/90">{summaryText}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Run the analysis pipeline to generate insights.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* SWOT */}
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                  Strategic Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SwotQuadrant icon={TrendingUp} label="Strengths" items={swot.strengths} color="text-emerald-500" bg="bg-emerald-500/10" />
                    <SwotQuadrant icon={AlertTriangle} label="Weaknesses" items={swot.weaknesses} color="text-amber-500" bg="bg-amber-500/10" />
                    <SwotQuadrant icon={Lightbulb} label="Opportunities" items={swot.opportunities} color="text-sky-500" bg="bg-sky-500/10" />
                    <SwotQuadrant icon={ShieldAlert} label="Threats" items={swot.threats} color="text-red-500" bg="bg-red-500/10" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Opportunities */}
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.25 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={15} className="text-primary" />
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                    Top Opportunities
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : topOpps.length > 0 ? (
                  <div className="space-y-2.5">
                    {topOpps.slice(0, 5).map((opp, i) => (
                      <div key={opp.id} className="flex gap-3 items-start">
                        <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">{opp.label}</p>
                          {opp.source && (
                            <p className="text-xs text-muted-foreground mt-0.5">{opp.source}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Complete the pipeline to surface opportunities.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }} className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={() => navigate(`/analysis/${analysisId}/command-deck`)}
          className="gap-2"
        >
          Go to Command Deck
          <ArrowRight size={16} />
        </Button>
      </motion.div>
    </div>
  );
}

/* ── SWOT Quadrant ── */
function SwotQuadrant({
  icon: Icon,
  label,
  items,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  items: string[];
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} className={color} />
        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${color}`}>{label}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-foreground/80 leading-snug flex gap-1.5">
              <span className="text-muted-foreground mt-0.5">•</span>
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
