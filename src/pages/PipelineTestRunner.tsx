/**
 * Full Pipeline Test Runner — /admin/pipeline-test
 * 
 * Generates structured evidence for a business via AI,
 * then runs it through the complete deterministic pipeline.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ChevronRight, Play, AlertTriangle, CheckCircle, Zap, Target, Layers, FlaskConical, TrendingUp, Award, Route } from "lucide-react";
import { runFullPipelineBenchmark, type PipelineReport, type BusinessDecomposition } from "@/lib/benchmarks/fullPipelineBenchmark";

const PRESET_BUSINESSES = [
  {
    name: "Independent Dental Practice — St. Louis Metro",
    description: "St. Louis MSA (population ~2.8M, 15-county metro). Median household income ~$65,000. Population growth flat (~0.1% annually). ~1,800 active dentists in metro (1 per 1,555 residents). Aging population — 16.5% over 65. Dental insurance coverage ~64% of adults. Major employers: BJC HealthCare, SSM Health, Washington University. Cost of living index ~91 (below national avg). Significant suburban sprawl — St. Charles, O'Fallon, Chesterfield growing fastest. Inner-city population declining. High dental school output from SLU and UMKC within recruiting range.",
  },
  { name: "Automatic Car Wash", description: "Express tunnel model, 3-minute wash, membership-based, suburban location with high traffic count." },
  { name: "Local Gym / Fitness Center", description: "Independent gym, 15,000 sq ft, mix of equipment and group classes, membership-based, suburban market." },
  { name: "Regional Trucking Company", description: "20-truck fleet, regional LTL and FTL, owner-operated, Midwest routes, mix of contract and spot freight." },
  { name: "Insurance Brokerage", description: "Independent P&C and life insurance brokerage, 5-person team, small business and personal lines focus." },
  { name: "Full-Service Restaurant", description: "Casual dining, 120 seats, full bar, dinner-focused, suburban location, average check $35." },
  { name: "Property Management Company", description: "Manages 200 residential units across 15 properties, mix of single-family and small multifamily." },
  { name: "Residential Cleaning Service", description: "Owner-operated, 8-person crew, recurring residential cleaning, serves 25-mile radius." },
];

export default function PipelineTestRunner() {
  const [businessName, setBusinessName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<BusinessDecomposition | null>(null);

  const runTest = useCallback(async (name: string, description?: string) => {
    setBusinessName(name);
    setError(null);
    setReport(null);
    setAiRaw(null);

    // Step 1: Generate evidence via AI
    setIsGenerating(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-business-structure", {
        body: { businessName: name, businessDescription: description || "" },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const decomposition = data as BusinessDecomposition;
      setAiRaw(decomposition);
      setIsGenerating(false);

      // Step 2: Run through pipeline
      setIsRunning(true);
      const pipelineReport = runFullPipelineBenchmark(name, decomposition);
      setReport(pipelineReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
      setIsRunning(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Full Pipeline Diagnostic</h1>
          <p className="text-muted-foreground text-sm mt-1">
            End-to-end strategic reasoning test: AI evidence → constraints → opportunities → stress test → recommendation
          </p>
        </div>

        {/* Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="Enter a business type (e.g., 'independent dental practice')"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && businessName && runTest(businessName)}
                disabled={isGenerating || isRunning}
              />
              <Button onClick={() => runTest(businessName)} disabled={!businessName || isGenerating || isRunning}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isGenerating ? "Generating Evidence…" : isRunning ? "Running Pipeline…" : "Run Test"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {PRESET_BUSINESSES.map((biz) => (
                <Button key={biz.name} variant="outline" size="sm" onClick={() => runTest(biz.name, biz.description)} disabled={isGenerating || isRunning}>
                  {biz.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error:</span> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {report && <ReportView report={report} />}
      </div>
    </div>
  );
}

function ReportView({ report }: { report: PipelineReport }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{report.businessName} — Pipeline Report</span>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{report.totalEvidenceItems} evidence</Badge>
              <Badge variant="outline">{report.facetedEvidenceCount} faceted ({report.facetDiagnostics?.coveragePercent ?? 0}%)</Badge>
              <Badge variant="outline">{report.constraints.length} constraints</Badge>
              {report.inferredConstraintCount > 0 && (
                <Badge variant="secondary">{report.inferredConstraintCount} inferred</Badge>
              )}
              <Badge variant="outline">{report.morphologicalVectors.length} vectors</Badge>
              <Badge variant="outline">{report.stressTests.length} tested</Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Reasoning Trace */}
      <ReportSection title="Reasoning Trace" icon={<Route className="w-4 h-4" />} defaultOpen>
        <div className="space-y-1">
          {report.reasoningTrace.map((t, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-muted/50">
              <span className="font-mono text-xs text-muted-foreground w-8">{i + 1}.</span>
              <span className="flex-1 font-medium">{t.stage}</span>
              <span className="text-muted-foreground text-xs">{t.inputCount} → {t.outputCount}</span>
              <span className="text-muted-foreground text-xs ml-4">{t.durationMs}ms</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
          {report.pipelineEvents.map((ev, i) => (
            <div key={i}>• {ev}</div>
          ))}
        </div>
      </ReportSection>

      {/* Facet Diagnostics */}
      {report.facetDiagnostics && (
        <ReportSection title="Facet Extraction Diagnostics" icon={<Layers className="w-4 h-4" />} defaultOpen>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.facetDiagnostics.coveragePercent}%</div>
              <div className="text-xs text-muted-foreground">Coverage ({report.facetDiagnostics.mappedCount}/{report.facetDiagnostics.totalEvidence})</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.facetDiagnostics.patternMatchCount} / {report.facetDiagnostics.semanticOnlyMatchCount}</div>
              <div className="text-xs text-muted-foreground">Pattern / Semantic-only</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.facetDiagnostics.avgMatchesPerItem}</div>
              <div className="text-xs text-muted-foreground">Avg matches/item (confidence: {report.facetDiagnostics.avgSemanticConfidence})</div>
            </div>
          </div>
          {report.facetDiagnostics.topConcepts.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-sm mb-1">Top Concepts</h4>
              <div className="flex flex-wrap gap-1">
                {report.facetDiagnostics.topConcepts.slice(0, 8).map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {c.name} ({c.frequency}×, {(c.avgSimilarity * 100).toFixed(0)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {report.facetDiagnostics.inferredConstraints.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-sm mb-1">Latent Constraints Inferred</h4>
              {report.facetDiagnostics.inferredConstraints.map((ic, i) => (
                <div key={i} className="text-xs text-muted-foreground py-0.5">
                  • <span className="font-medium text-foreground">{ic.name}</span> — {ic.constraintId} (confidence: {ic.confidence})
                </div>
              ))}
            </div>
          )}
          {report.facetDiagnostics.unmappedEvidence.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1 text-destructive">Unmapped Evidence ({report.facetDiagnostics.unmappedEvidence.length})</h4>
              {report.facetDiagnostics.unmappedEvidence.slice(0, 5).map((u, i) => (
                <div key={i} className="text-xs text-muted-foreground py-0.5 truncate">
                  • {u.snippet}
                </div>
              ))}
            </div>
          )}
        </ReportSection>
      )}

      {/* Morphological Search Diagnostics */}
      {report.morphologicalDiagnostics && (
        <ReportSection title="Morphological Search Diagnostics" icon={<Target className="w-4 h-4" />} defaultOpen>
          <div className="grid grid-cols-4 gap-3 text-sm mb-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.morphologicalDiagnostics.totalActiveConstraints}</div>
              <div className="text-xs text-muted-foreground">Active Constraints</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.morphologicalDiagnostics.hotDimensionCount} / {report.morphologicalDiagnostics.warmDimensionCount}</div>
              <div className="text-xs text-muted-foreground">Hot / Warm Dimensions</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.morphologicalDiagnostics.vectorsBeforeGates} → {report.morphologicalDiagnostics.vectorsAfterGates}</div>
              <div className="text-xs text-muted-foreground">Vectors (before → after gates)</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{report.morphologicalDiagnostics.patternVectorCount} / {report.morphologicalDiagnostics.morphologicalVectorCount}</div>
              <div className="text-xs text-muted-foreground">Pattern / Morphological</div>
            </div>
          </div>
          {report.morphologicalDiagnostics.constraintStrengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Constraint Strength Scores</h4>
              <div className="space-y-1.5">
                {report.morphologicalDiagnostics.constraintStrengths.map((cs, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono w-6 text-muted-foreground">{i + 1}.</span>
                    <span className="flex-1 truncate">{cs.label}</span>
                    <Badge variant="outline" className="text-xs">
                      strength: {cs.strength.toFixed(2)}
                    </Badge>
                    <span className="text-muted-foreground">
                      impact:{cs.impact} × conf:{cs.confidence.toFixed(1)} × ev:{cs.evidenceVolume}
                    </span>
                    <div className="w-20 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5"
                        style={{ width: `${Math.min(100, cs.priorityWeight * 100)}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs w-10 text-right">
                      {(cs.priorityWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSection>
      )}

      {/* Section 1: System Decomposition */}
      <ReportSection title="1. Business System Decomposition" icon={<Layers className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Supply Chain</h4>
            <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
              {report.systemDecomposition.supplyChain.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Value Creation Steps</h4>
            <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
              {report.systemDecomposition.valueCreationSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Revenue Architecture</h4>
            <p className="text-muted-foreground">{report.systemDecomposition.revenueArchitecture}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Customer Acquisition</h4>
            <p className="text-muted-foreground">{report.systemDecomposition.customerAcquisition}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Cost Structure</h4>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {report.systemDecomposition.costStructure.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Operational Assets</h4>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {report.systemDecomposition.operationalAssets.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Distribution Channels</h4>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {report.systemDecomposition.distributionChannels.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Labor Dependencies</h4>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {report.systemDecomposition.laborDependencies.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      </ReportSection>

      {/* Section 2: First Principles */}
      <ReportSection title="2. First Principles Breakdown" icon={<Target className="w-4 h-4" />}>
        <div className="space-y-3 text-sm">
          {Object.entries(report.firstPrinciples).map(([key, val]) => (
            <div key={key} className="flex gap-3">
              <span className="font-semibold min-w-[180px]">{key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}:</span>
              <span className="text-muted-foreground">{val}</span>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Section 3: Constraints */}
      <ReportSection title="3. Constraint Detection (Tiered)" icon={<AlertTriangle className="w-4 h-4" />} defaultOpen>
        {[1, 2, 3].map(tier => {
          const tierConstraints = report.constraints.filter(c => c.tier === tier);
          if (tierConstraints.length === 0) return null;
          return (
            <div key={tier} className="mb-4">
              <h4 className="font-semibold text-sm mb-2">
                Tier {tier} — {tier === 1 ? "Structural System Limits" : tier === 2 ? "Operational Friction" : "Surface Problems"}
              </h4>
              <div className="space-y-2">
                {tierConstraints.map((c, i) => (
                  <div key={i} className="border rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs">{c.constraintId}</span>
                      <div className="flex gap-2">
                        <Badge variant={c.confidence === "strong" ? "default" : c.confidence === "moderate" ? "secondary" : "outline"}>
                          {c.confidence}
                        </Badge>
                        <Badge variant="outline">{c.constraintName}</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{c.explanation}</p>
                    <div className="text-xs">
                      <span className="font-medium">Evidence:</span>
                      <ul className="list-disc list-inside text-muted-foreground mt-0.5">
                        {c.evidenceSignals.map((s, j) => <li key={j}>{s}</li>)}
                      </ul>
                    </div>
                    {c.facetBasis.length > 0 && (
                      <div className="text-xs mt-1">
                        <span className="font-medium">Facet basis:</span>{" "}
                        <span className="text-muted-foreground">{c.facetBasis.join(", ")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {report.severityReport?.primaryBottleneck && (
          <div className="mt-3 p-3 bg-destructive/10 rounded text-sm">
            <span className="font-semibold">Primary Bottleneck:</span>{" "}
            {report.severityReport.primaryBottleneck.constraintLabel} ({report.severityReport.primaryBottleneck.severityLabel} severity)
          </div>
        )}
      </ReportSection>

      {/* Section 4: Competitors */}
      <ReportSection title="4. Competitor Landscape" icon={<Zap className="w-4 h-4" />}>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {(["tier1", "tier2", "tier3"] as const).map(tier => (
            <div key={tier}>
              <h4 className="font-semibold mb-2">
                {tier === "tier1" ? "Tier 1 — Direct" : tier === "tier2" ? "Tier 2 — Alternative" : "Tier 3 — Substitutes"}
              </h4>
              {report.competitors[tier]?.map((c, i) => (
                <div key={i} className="mb-2 p-2 bg-muted/50 rounded">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.model}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Section 5: Morphological Opportunities */}
      <ReportSection title="5. Morphological Opportunity Vectors" icon={<Layers className="w-4 h-4" />}>
        {report.morphologicalVectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No morphological vectors generated (evidence threshold not met or insufficient dimensions)</p>
        ) : (
          <div className="space-y-2">
            {report.morphologicalVectors.map((v, i) => (
              <div key={i} className="border rounded p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{v.explorationType}</Badge>
                  <Badge variant="outline" className="text-xs">{v.explorationMode}</Badge>
                </div>
                <div className="space-y-0.5">
                  {v.shifts.map((s, j) => (
                    <div key={j} className="text-muted-foreground">
                      <span className="font-medium">{s.dimension}:</span> {s.from} → <span className="text-foreground">{s.to}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{v.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* Section 6: Flipped Constraints */}
      <ReportSection title="6. Flipped Constraint Opportunities" icon={<Zap className="w-4 h-4" />}>
        <div className="space-y-2">
          {report.flippedConstraints.map((f, i) => (
            <div key={i} className="border rounded p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{f.constraintName}</Badge>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{f.flip}</span>
              </div>
              <p className="text-xs text-muted-foreground">{f.rationale}</p>
              {f.analogs.length > 0 && (
                <div className="text-xs mt-1">
                  <span className="font-medium">Analogs:</span> {f.analogs.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Section 7: Stress Tests */}
      <ReportSection title="7. Stress Testing" icon={<FlaskConical className="w-4 h-4" />}>
        {report.stressTests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opportunities reached stress testing</p>
        ) : (
          <div className="space-y-2">
            {report.stressTests.map((st, i) => (
              <div key={i} className="border rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium truncate max-w-[60%]">{st.opportunityLabel}</span>
                  <Badge variant={st.viabilityLabel === "strong" ? "default" : st.viabilityLabel === "moderate" ? "secondary" : "outline"}>
                    {st.viabilityLabel} ({st.viabilityScore.toFixed(2)})
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>Feasibility: <span className="font-mono">{st.feasibility.toFixed(2)}</span></div>
                  <div>Capital: <span className="font-mono">{st.capitalRequirement.toFixed(2)}</span></div>
                  <div>Market: <span className="font-mono">{st.marketReadiness.toFixed(2)}</span></div>
                  <div>Complexity: <span className="font-mono">{st.implementationComplexity.toFixed(2)}</span></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{st.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* Section 9: Ranking */}
      <ReportSection title="9. Idea Ranking" icon={<TrendingUp className="w-4 h-4" />}>
        {report.rankedOpportunities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opportunities to rank</p>
        ) : (
          <div className="space-y-1">
            {report.rankedOpportunities.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 px-3 rounded bg-muted/50">
                <span className="font-bold text-lg w-8 text-center">#{r.rank}</span>
                <div className="flex-1">
                  <div className="font-medium truncate">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.shifts}</div>
                </div>
                <Badge variant={r.viabilityLabel === "strong" ? "default" : r.viabilityLabel === "moderate" ? "secondary" : "outline"}>
                  {r.viabilityScore.toFixed(2)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* Section 10: Final Recommendation */}
      <ReportSection title="10. Final Recommendation" icon={<Award className="w-4 h-4" />} defaultOpen>
        {report.recommendation ? (
          <div className="space-y-3 text-sm">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-bold text-lg mb-2">{report.recommendation.selectedIdea}</h4>
              <p className="text-muted-foreground">{report.recommendation.whyItWins}</p>
            </div>
            <div>
              <span className="font-semibold">Constraint Exploited:</span>{" "}
              <Badge variant="outline">{report.recommendation.constraintExploited}</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Key Assumptions</h4>
              <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                {report.recommendation.keyAssumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Biggest Risks</h4>
              <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                {report.recommendation.biggestRisks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Insufficient data to generate recommendation</p>
        )}
      </ReportSection>
    </div>
  );
}

function ReportSection({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <CardTitle className="text-base flex items-center gap-2">
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
