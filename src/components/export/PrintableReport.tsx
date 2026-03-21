import React from "react";
import type { Product } from "@/data/mockProducts";
import { isServiceCategory } from "@/utils/normalizeProduct";
import { extractFinancialInputs, computeETAScores, type ETAFinancialInputs, type ETAScoreResult } from "@/lib/etaScoringEngine";
import { ScoreBar } from "@/components/ScoreBar";
import { WorkflowTimeline } from "@/components/FirstPrinciplesAnalysis";
import {
  Target, Clock, MessageSquare, DollarSign, Package,
  ShieldAlert, Lightbulb, ExternalLink, ScrollText,
  Brain, Zap, Sparkles, Swords, Shield, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, BarChart3, Globe, Rocket,
  FlipHorizontal, AlertTriangle, RefreshCw,
} from "lucide-react";

interface PrintableReportProps {
  product: Product;
  analysisData: Record<string, unknown> | null;
  analysisTitle?: string;
  mode?: string;
}

export function PrintableReport({ product, analysisData, analysisTitle, mode }: PrintableReportProps) {
  const isService = product?.category === "Service" || isServiceCategory(product?.category || "");
  const ci = (product as any)?.communityInsights;
  const uw = (product as any)?.userWorkflow;
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const disruptData = (analysisData?.disrupt ?? analysisData?.disruptData) as Record<string, unknown> | null;
  const stressTestData = (analysisData?.stressTest ?? analysisData?.stressTestData) as Record<string, unknown> | null;
  const pitchDeckData = (analysisData?.pitchDeck ?? analysisData?.pitchDeckData) as Record<string, unknown> | null;
  const redesignData = (analysisData?.redesign ?? analysisData?.reimagine ?? analysisData?.redesignData) as Record<string, unknown> | null;
  const governedData = (analysisData?.governed ?? analysisData?.governedData) as Record<string, unknown> | null;
  const strategicSnapshot = analysisData?.strategicSnapshot as Record<string, unknown> | null;

  return (
    <div className="print-report">
      {/* ── Cover Page ── */}
      <div className="print-cover" data-pdf-section="cover">
        <div className="print-cover-inner">
          <p className="print-cover-label">Intelligence Report</p>
          <h1 className="print-cover-title">{analysisTitle || product?.name || "Analysis Report"}</h1>
          {product?.category && <p className="print-cover-mode">{mode || product.category} Mode</p>}
          <p className="print-cover-date">{now}</p>
          {product?.keyInsight && (
            <p className="print-cover-insight">"{product.keyInsight}"</p>
          )}
        </div>
      </div>

      {/* ── Overview ── */}
      <PrintSection title="Overview" icon={<Target size={14} />}>
        {product?.description && <p className="print-body">{product.description}</p>}
        {product?.marketSizeEstimate && (
          <p className="print-body font-semibold" style={{ color: "hsl(152 60% 40%)" }}>TAM: {product.marketSizeEstimate}</p>
        )}
        {product?.confidenceScores && (
          <div className="print-scores">
            <ScoreBar label="Adoption" score={product.confidenceScores.adoptionLikelihood ?? 7} />
            <ScoreBar label="Feasibility" score={product.confidenceScores.feasibility ?? 7} />
            <ScoreBar label="Resonance" score={product.confidenceScores.emotionalResonance ?? 8} />
          </div>
        )}
        {product?.trendAnalysis && <p className="print-body text-muted-foreground">{product.trendAnalysis}</p>}
        {product?.sources?.length > 0 && (
          <div className="print-sources">
            {product.sources.map((src: any) => (
              <span key={src.url} className="print-source-item">
                <ExternalLink size={9} /> {src.label?.slice(0, 40)} — {src.url}
              </span>
            ))}
          </div>
        )}
      </PrintSection>

      {/* ── User Journey ── */}
      {uw?.stepByStep?.length > 0 && (
        <PrintSection title="User Journey" icon={<Clock size={14} />}>
          <WorkflowTimeline steps={uw.stepByStep} frictionPoints={uw.frictionPoints || []} />
          {(uw.cognitiveLoad || uw.contextOfUse) && (
            <div className="print-grid-2">
              {uw.cognitiveLoad && (
                <div className="print-info-box">
                  <p className="print-label">Cognitive Load</p>
                  <p className="print-body-sm">{uw.cognitiveLoad}</p>
                </div>
              )}
              {uw.contextOfUse && (
                <div className="print-info-box">
                  <p className="print-label">Context of Use</p>
                  <p className="print-body-sm">{uw.contextOfUse}</p>
                </div>
              )}
            </div>
          )}
        </PrintSection>
      )}

      {/* ── Community Intel ── */}
      {ci && (
        <PrintSection title="Community Intel" icon={<MessageSquare size={14} />}>
          {(() => {
            const sentiment = ci.communitySentiment || ci.redditSentiment;
            const hasReal = sentiment && !/no direct.*found|not found/i.test(sentiment);
            return (
              <div className="space-y-2">
                {hasReal && <p className="print-body">{sentiment}</p>}
                {ci.topComplaints?.length > 0 && (
                  <div>
                    <p className="print-label">Complaints</p>
                    {ci.topComplaints.map((c: string, i: number) => (
                      <div key={i} className="print-list-item">
                        <ShieldAlert size={10} className="text-destructive flex-shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {ci.improvementRequests?.length > 0 && (
                  <div>
                    <p className="print-label">Requests</p>
                    {ci.improvementRequests.map((r: string, i: number) => (
                      <div key={i} className="print-list-item">
                        <Lightbulb size={10} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </PrintSection>
      )}

      {/* ── Pricing Intel ── */}
      {product?.pricingIntel && (
        <PrintSection title="Pricing Intel" icon={<DollarSign size={14} />}>
          <div className="print-grid-3">
            {[
              { label: "Market Price", value: product.pricingIntel.currentMarketPrice },
              { label: "Resale Avg", value: (product.pricingIntel as any).resaleAvgSold || product.pricingIntel.ebayAvgSold },
              { label: "Original MSRP", value: product.pricingIntel.msrpOriginal },
              { label: "Collector Premium", value: product.pricingIntel.collectorPremium },
              { label: "Margins", value: product.pricingIntel.margins },
              { label: "Trend", value: product.pricingIntel.priceDirection?.toUpperCase() },
            ].filter(x => x.value).map((item) => (
              <div key={item.label} className="print-info-box">
                <p className="print-label">{item.label}</p>
                <p className="print-body font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </PrintSection>
      )}

      {/* ── Supply Chain (products only) ── */}
      {!isService && product?.supplyChain && (
        <PrintSection title="Supply Chain" icon={<Package size={14} />}>
          <PrintSupplyList title="Suppliers" items={(product.supplyChain.suppliers || []).map((s: any) => `${s.name} (${s.region}) — ${s.role}`)} />
          <PrintSupplyList title="Manufacturers" items={(product.supplyChain.manufacturers || []).map((m: any) => `${m.name} (${m.region}) — MOQ: ${m.moq}`)} />
          <PrintSupplyList title="Vendors" items={(product.supplyChain.vendors || []).map((v: any) => `${v.name} (${v.type}) — ${v.notes || ""}`)} />
          <PrintSupplyList title="Distributors" items={(product.supplyChain.distributors || []).map((d: any) => `${d.name} (${d.region})`)} />
        </PrintSection>
      )}

      {/* ── Strategic Snapshot (Command Deck + Insight Graph) ── */}
      {strategicSnapshot && <StrategicSnapshotSection data={strategicSnapshot} />}

      {/* ── Disruption Analysis ── */}
      {disruptData && <DisruptSection data={disruptData} />}

      {/* ── Redesign / Reimagine ── */}
      {redesignData && <RedesignSection data={redesignData} />}

      {/* ── Governed Intelligence (Reasoning, Confidence, Decision) ── */}
      {governedData && <GovernedSection data={governedData} />}

      {/* ── Stress Test ── */}
      {stressTestData && <StressTestSection data={stressTestData} />}

      {/* ── Pitch Deck ── */}
      {pitchDeckData && <PitchDeckSection data={pitchDeckData} />}

      {/* ── Flipped Ideas from product ── */}
      {(product as any)?.flippedIdeas?.length > 0 && !disruptData && (
        <PrintSection title="Disruption Ideas" icon={<Sparkles size={14} />}>
          {(product as any).flippedIdeas.map((idea: any, i: number) => (
            <PrintCard key={i} accent="hsl(271 81% 55%)">
              <p className="print-card-title">
                <span className="print-card-number">{i + 1}</span>
                {idea.title || idea.idea || idea.name || `Idea ${i + 1}`}
              </p>
              {idea.description && <p className="print-body-sm">{idea.description}</p>}
              {idea.mechanism && <p className="print-body-sm">Mechanism: {idea.mechanism}</p>}
              {idea.marketPotential && <p className="print-body-sm">Market: {idea.marketPotential}</p>}
            </PrintCard>
          ))}
        </PrintSection>
      )}

      {/* ── Patent Data ── */}
      {!isService && product?.patentData && (
        <PrintSection title="Patent Intelligence" icon={<ScrollText size={14} />}>
          <PatentSection data={product.patentData as Record<string, unknown>} />
        </PrintSection>
      )}

      {/* ── Footer ── */}
      <div className="print-footer" data-pdf-section="footer">
        <p>Generated by Market Disruptor — {now}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════════════════════════════ */

function PrintSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="print-section" data-pdf-section={title}>
      <h2 className="print-section-title">
        {icon && <span className="print-section-icon">{icon}</span>}
        {title}
      </h2>
      <div className="print-section-content">{children}</div>
    </section>
  );
}

function PrintSupplyList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      <p className="print-label">{title}</p>
      {items.map((item, i) => (
        <p key={i} className="print-body-sm">• {item}</p>
      ))}
    </div>
  );
}

function PrintCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="print-card"
      style={{
        borderLeft: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      {children}
    </div>
  );
}

function PrintMetricBox({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null;
  return (
    <div className="print-metric-box">
      <p className="print-label">{label}</p>
      <p className="print-metric-value">{value}</p>
    </div>
  );
}

function PrintTag({ label, color }: { label: string; color: string }) {
  return (
    <span className="print-tag" style={{ background: color + "18", color, borderColor: color + "30" }}>
      {label}
    </span>
  );
}

function StrategicSnapshotSection({ data }: { data: Record<string, unknown> }) {
  const metrics = (data.metrics as Record<string, any> | undefined) || {};
  const graph = (data.graph as Record<string, any> | undefined) || {};
  const topOpportunities = (data.topOpportunities as Record<string, any>[] | undefined) || [];
  const nodeTypeCounts = (graph.nodeTypeCounts as Record<string, number> | undefined) || {};
  const topNodes = (graph.topNodes as Record<string, string | null> | undefined) || {};

  return (
    <>
      <PrintSection title="Command Deck Snapshot" icon={<TrendingUp size={14} />}>
        <div className="print-grid-3">
          <PrintMetricBox label="Opportunities" value={metrics.opportunitiesIdentified} />
          <PrintMetricBox label="Constraints" value={metrics.constraintsDetected} />
          <PrintMetricBox label="Leverage" value={metrics.leveragePoints} />
          <PrintMetricBox label="Risk Signals" value={metrics.riskSignals} />
          <PrintMetricBox label="Pipeline" value={metrics.pipelineCompletion != null ? `${metrics.pipelineCompletion}%` : undefined} />
          <PrintMetricBox label="Evidence" value={metrics.totalEvidenceCount} />
        </div>

        {topOpportunities.length > 0 && (
          <div className="print-subsection">
            <h3 className="print-subsection-title"><Lightbulb size={12} /> Top Opportunities</h3>
            {topOpportunities.map((opp, index) => (
              <PrintCard key={opp.label || index} accent="hsl(217 91% 55%)">
                <p className="print-card-title">
                  <span className="print-card-number">{opp.rank || index + 1}</span>
                  {opp.label || `Opportunity ${index + 1}`}
                </p>
                <div className="print-tag-row">
                  {opp.impact != null && <PrintTag label={opp.impact >= 8 ? "High impact" : opp.impact >= 5 ? "Moderate impact" : "Low impact"} color="hsl(217 91% 55%)" />}
                  {opp.confidence && <PrintTag label={`Confidence ${opp.confidence}`} color="hsl(142 70% 40%)" />}
                  {opp.source && <PrintTag label={String(opp.source)} color="hsl(220 10% 45%)" />}
                </div>
              </PrintCard>
            ))}
          </div>
        )}
      </PrintSection>

      <PrintSection title="Insight Graph Snapshot" icon={<Brain size={14} />}>
        <div className="print-grid-3">
          <PrintMetricBox label="Nodes" value={graph.nodes} />
          <PrintMetricBox label="Edges" value={graph.edges} />
          <PrintMetricBox label="Node Types" value={Object.keys(nodeTypeCounts).length} />
        </div>

        {Object.keys(nodeTypeCounts).length > 0 && (
          <div className="print-subsection">
            <h3 className="print-subsection-title"><BarChart3 size={12} /> Node Type Breakdown</h3>
            <div className="print-tag-row">
              {Object.entries(nodeTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <PrintTag
                    key={type}
                    label={`${type.replace(/_/g, " ")}: ${count}`}
                    color="hsl(229 89% 63%)"
                  />
                ))}
            </div>
          </div>
        )}

        {(topNodes.primaryConstraint || topNodes.keyDriver || topNodes.breakthroughOpportunity || topNodes.highestConfidence) && (
          <div className="print-subsection">
            <h3 className="print-subsection-title"><Target size={12} /> Key Graph Anchors</h3>
            <div className="print-grid-2">
              {topNodes.primaryConstraint && (
                <div className="print-info-box">
                  <p className="print-label">Primary Constraint</p>
                  <p className="print-body-sm">{topNodes.primaryConstraint}</p>
                </div>
              )}
              {topNodes.keyDriver && (
                <div className="print-info-box">
                  <p className="print-label">Key Driver</p>
                  <p className="print-body-sm">{topNodes.keyDriver}</p>
                </div>
              )}
              {topNodes.breakthroughOpportunity && (
                <div className="print-info-box">
                  <p className="print-label">Breakthrough Opportunity</p>
                  <p className="print-body-sm">{topNodes.breakthroughOpportunity}</p>
                </div>
              )}
              {topNodes.highestConfidence && (
                <div className="print-info-box">
                  <p className="print-label">Highest Confidence Node</p>
                  <p className="print-body-sm">{topNodes.highestConfidence}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </PrintSection>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DISRUPTION ANALYSIS (Assumptions, Flipped Logic, Redesigned Concept)
   ═══════════════════════════════════════════════════════════════ */

function DisruptSection({ data }: { data: Record<string, unknown> }) {
  const assumptions = (data.hiddenAssumptions as any[]) || [];
  const flippedLogic = (data.flippedLogic as any[]) || [];
  const flippedIdeas = (data.flippedIdeas || data.ideas || data.paths) as any[] | undefined;
  const concept = data.redesignedConcept as Record<string, any> | undefined;
  const constraints = (data.constraints || data.bindingConstraints) as any[] | undefined;
  const revenueReinvention = data.revenueReinvention as Record<string, any> | undefined;

  return (
    <PrintSection title="Disruption Analysis" icon={<Brain size={14} />}>
      {/* Assumptions */}
      {assumptions.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title">
            <Brain size={12} /> Hidden Assumptions
          </h3>
          {assumptions.map((a, i) => (
            <PrintCard key={i} accent={a.isChallengeable ? "hsl(271 81% 55%)" : "hsl(220 10% 70%)"}>
              <p className="print-card-title">
                <span className="print-card-number">{i + 1}</span>
                {a.assumption}
              </p>
              <p className="print-body-sm">{a.currentAnswer}</p>
              {a.challengeIdea && (
                <div className="print-highlight-box">
                  <span className="font-semibold">Challenge:</span> {a.challengeIdea}
                </div>
              )}
              <div className="print-tag-row">
                {a.reason && <PrintTag label={a.reason} color="hsl(38 92% 45%)" />}
                {a.isChallengeable && <PrintTag label="Challengeable" color="hsl(271 81% 55%)" />}
                {a.leverageScore != null && <PrintTag label={`Leverage ${a.leverageScore}/10`} color="hsl(217 91% 50%)" />}
              </div>
            </PrintCard>
          ))}
        </div>
      )}

      {/* Flipped Logic */}
      {flippedLogic.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title">
            <FlipHorizontal size={12} /> Flipped Logic
          </h3>
          {flippedLogic.map((item, i) => (
            <PrintCard key={i}>
              <div className="print-flip-grid">
                <div className="print-flip-left">
                  <p className="print-label">Assumption</p>
                  <p className="print-body-sm">{item.originalAssumption}</p>
                </div>
                <div className="print-flip-arrow">→</div>
                <div className="print-flip-right">
                  <p className="print-label" style={{ color: "hsl(271 81% 55%)" }}>Flip</p>
                  <p className="print-body-sm font-semibold">{item.boldAlternative}</p>
                </div>
              </div>
              {(item.rationale || item.physicalMechanism) && (
                <div className="print-grid-2" style={{ marginTop: "0.5rem" }}>
                  {item.rationale && (
                    <div>
                      <p className="print-label">Value Created</p>
                      <p className="print-body-sm">{item.rationale}</p>
                    </div>
                  )}
                  {item.physicalMechanism && (
                    <div>
                      <p className="print-label">Mechanism</p>
                      <p className="print-body-sm">{item.physicalMechanism}</p>
                    </div>
                  )}
                </div>
              )}
            </PrintCard>
          ))}
        </div>
      )}

      {/* Flipped Ideas (alternative shape) */}
      {flippedIdeas && Array.isArray(flippedIdeas) && flippedIdeas.length > 0 && flippedLogic.length === 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title">
            <Sparkles size={12} /> Disruption Ideas
          </h3>
          {flippedIdeas.map((idea: any, i: number) => (
            <PrintCard key={i} accent="hsl(271 81% 55%)">
              <p className="print-card-title">
                <span className="print-card-number">{i + 1}</span>
                {idea.title || idea.idea || idea.boldAlternative || idea.name || `Idea ${i + 1}`}
              </p>
              {(idea.description || idea.rationale) && <p className="print-body-sm">{idea.description || idea.rationale}</p>}
              {idea.mechanism && <p className="print-body-sm">Mechanism: {idea.mechanism}</p>}
              {idea.marketPotential && <p className="print-body-sm">Market: {idea.marketPotential}</p>}
              {idea.physicalMechanism && <p className="print-body-sm">Physical: {idea.physicalMechanism}</p>}
            </PrintCard>
          ))}
        </div>
      )}

      {/* Constraints */}
      {constraints && Array.isArray(constraints) && constraints.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title">
            <AlertTriangle size={12} /> Binding Constraints
          </h3>
          {constraints.map((c: any, i: number) => (
            <PrintCard key={i} accent="hsl(0 72% 51%)">
              <p className="print-card-title">{typeof c === "string" ? c : c.label || c.constraint || c.name || `Constraint ${i + 1}`}</p>
              {c.description && <p className="print-body-sm">{c.description}</p>}
              {c.impact && <PrintTag label={`Impact: ${c.impact}`} color="hsl(0 72% 51%)" />}
            </PrintCard>
          ))}
        </div>
      )}

      {/* Revenue Reinvention */}
      {revenueReinvention && (
        <div className="print-subsection">
          <h3 className="print-subsection-title">
            <TrendingUp size={12} /> Revenue Reinvention
          </h3>
          {revenueReinvention.currentRevenueMix && (
            <PrintCard>
              <p className="print-label">Current Revenue Mix</p>
              <p className="print-body-sm">{revenueReinvention.currentRevenueMix}</p>
            </PrintCard>
          )}
          {revenueReinvention.newRevenueStreams?.length > 0 && (
            <div>
              {revenueReinvention.newRevenueStreams.map((s: any, i: number) => (
                <PrintCard key={i} accent="hsl(142 70% 40%)">
                  <p className="print-card-title">{typeof s === "string" ? s : s.name || s.title || `Stream ${i + 1}`}</p>
                  {s.description && <p className="print-body-sm">{s.description}</p>}
                  {s.potential && <p className="print-body-sm">Potential: {s.potential}</p>}
                </PrintCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redesigned Concept (within disrupt data) */}
      {concept?.conceptName && <ConceptCard concept={concept} />}
    </PrintSection>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REDESIGN SECTION
   ═══════════════════════════════════════════════════════════════ */

function RedesignSection({ data }: { data: Record<string, unknown> }) {
  const concept = data.redesignedConcept as Record<string, any> | undefined;
  const flippedIdeas = (data.flippedIdeas || data.ideas) as any[] | undefined;
  const transformations = (data.transformations || data.proposals || data.concepts) as any[] | undefined;

  // Has a main concept
  if (concept?.conceptName) {
    return (
      <PrintSection title="Reimagine / Redesign" icon={<Sparkles size={14} />}>
        <ConceptCard concept={concept} />
        {/* Also render flipped ideas if present alongside concept */}
        {flippedIdeas && Array.isArray(flippedIdeas) && flippedIdeas.length > 0 && (
          <div className="print-subsection">
            <h3 className="print-subsection-title"><Sparkles size={12} /> Additional Ideas</h3>
            {flippedIdeas.map((idea: any, i: number) => (
              <PrintCard key={i} accent="hsl(38 92% 50%)">
                <p className="print-card-title">
                  <span className="print-card-number">{i + 1}</span>
                  {idea.title || idea.idea || idea.boldAlternative || idea.name || `Idea ${i + 1}`}
                </p>
                {(idea.description || idea.rationale) && <p className="print-body-sm">{idea.description || idea.rationale}</p>}
                {idea.mechanism && <p className="print-body-sm">Mechanism: {idea.mechanism}</p>}
              </PrintCard>
            ))}
          </div>
        )}
      </PrintSection>
    );
  }

  // Has flipped ideas but no concept
  if (flippedIdeas && Array.isArray(flippedIdeas) && flippedIdeas.length > 0) {
    return (
      <PrintSection title="Reimagine / Redesign" icon={<Sparkles size={14} />}>
        {flippedIdeas.map((idea: any, i: number) => (
          <PrintCard key={i} accent="hsl(38 92% 50%)">
            <p className="print-card-title">
              <span className="print-card-number">{i + 1}</span>
              {idea.title || idea.idea || idea.boldAlternative || idea.name || `Idea ${i + 1}`}
            </p>
            {(idea.description || idea.rationale) && <p className="print-body-sm">{idea.description || idea.rationale}</p>}
            {idea.mechanism && <p className="print-body-sm">Mechanism: {idea.mechanism}</p>}
            {idea.marketPotential && <p className="print-body-sm">Market: {idea.marketPotential}</p>}
          </PrintCard>
        ))}
      </PrintSection>
    );
  }

  // Has transformations array
  if (transformations && Array.isArray(transformations) && transformations.length > 0) {
    return (
      <PrintSection title="Reimagine / Redesign" icon={<Sparkles size={14} />}>
        {transformations.map((t: any, i: number) => (
          <PrintCard key={i} accent="hsl(38 92% 50%)">
            <p className="print-card-title">{t.title || t.name || t.conceptName || `Proposal ${i + 1}`}</p>
            {t.description && <p className="print-body-sm">{t.description}</p>}
            {t.tagline && <p className="print-body-sm font-semibold" style={{ fontStyle: "italic" }}>{t.tagline}</p>}
          </PrintCard>
        ))}
      </PrintSection>
    );
  }

  // Fallback for unknown structure
  return (
    <PrintSection title="Reimagine / Redesign" icon={<Sparkles size={14} />}>
      <PrintJSON data={data} />
    </PrintSection>
  );
}

function ConceptCard({ concept }: { concept: Record<string, any> }) {
  return (
    <div className="print-subsection">
      <h3 className="print-subsection-title" style={{ color: "hsl(38 92% 45%)" }}>
        <Sparkles size={12} /> {concept.conceptName}
      </h3>
      {concept.tagline && <p className="print-body font-semibold" style={{ fontStyle: "italic" }}>{concept.tagline}</p>}

      {concept.coreInsight && (
        <PrintCard accent="hsl(38 92% 50%)">
          <p className="print-label">Core Insight</p>
          <p className="print-body-sm">{concept.coreInsight}</p>
        </PrintCard>
      )}

      {concept.radicalDifferences?.length > 0 && (
        <div>
          <p className="print-label" style={{ marginBottom: "0.3rem" }}>Radical Differences</p>
          {concept.radicalDifferences.map((d: string, i: number) => (
            <div key={i} className="print-list-item">
              <Zap size={10} style={{ color: "hsl(38 92% 50%)", flexShrink: 0, marginTop: 2 }} />
              <span>{d}</span>
            </div>
          ))}
        </div>
      )}

      <div className="print-grid-2">
        {concept.physicalDescription && (
          <div className="print-info-box">
            <p className="print-label">Physical Form</p>
            <p className="print-body-sm">{concept.physicalDescription}</p>
            {concept.sizeAndWeight && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>Size: {concept.sizeAndWeight}</p>}
          </div>
        )}
        {concept.materials?.length > 0 && (
          <div className="print-info-box">
            <p className="print-label">Materials</p>
            <div className="print-tag-row">
              {concept.materials.map((m: string, i: number) => (
                <PrintTag key={i} label={m} color="hsl(220 10% 45%)" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Business metrics */}
      <div className="print-grid-4">
        <PrintMetricBox label="Price Point" value={concept.pricePoint} />
        <PrintMetricBox label="Target User" value={concept.targetUser} />
        <PrintMetricBox label="Capital Required" value={concept.capitalRequired} />
        <PrintMetricBox label="Risk Level" value={concept.riskLevel} />
      </div>

      {concept.smartFeatures?.length > 0 && (
        <div>
          <p className="print-label">Smart Features</p>
          {concept.smartFeatures.map((f: string, i: number) => (
            <div key={i} className="print-list-item">
              <Zap size={10} style={{ color: "hsl(271 81% 55%)", flexShrink: 0, marginTop: 2 }} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}

      {concept.userExperienceTransformation && (
        <PrintCard>
          <p className="print-label">UX Transformation</p>
          <p className="print-body-sm">{concept.userExperienceTransformation}</p>
        </PrintCard>
      )}

      {concept.frictionEliminated?.length > 0 && (
        <div>
          <p className="print-label">Friction Eliminated</p>
          {concept.frictionEliminated.map((f: string, i: number) => (
            <div key={i} className="print-list-item">
              <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}

      {(concept.whyItHasntBeenDone || concept.biggestRisk || concept.manufacturingPath) && (
        <div className="print-grid-2" style={{ marginTop: "0.25rem" }}>
          {concept.whyItHasntBeenDone && (
            <div className="print-info-box">
              <p className="print-label">Why Not Already Done</p>
              <p className="print-body-sm">{concept.whyItHasntBeenDone}</p>
            </div>
          )}
          {concept.biggestRisk && (
            <div className="print-info-box">
              <p className="print-label">Biggest Risk</p>
              <p className="print-body-sm">{concept.biggestRisk}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STRESS TEST
   ═══════════════════════════════════════════════════════════════ */

function StressTestSection({ data }: { data: Record<string, unknown> }) {
  const redTeam = data.redTeam as { verdict?: string; arguments?: any[]; killShot?: string } | undefined;
  const blueTeam = data.blueTeam as { verdict?: string; arguments?: any[]; moonshot?: string } | undefined;
  const counterExamples = (data.counterExamples as any[]) || [];
  const feasibility = (data.feasibilityChecklist as any[]) || [];
  const confidenceScores = data.confidenceScores as Record<string, { score: number; reasoning: string }> | undefined;
  const blindSpots = (data.blindSpots as string[]) || [];
  const recommendations = (data.strategicRecommendations as string[]) || [];

  return (
    <PrintSection title="Stress Test" icon={<Swords size={14} />}>
      {/* Red Team */}
      {redTeam?.arguments?.length && (
        <div className="print-subsection">
          <h3 className="print-subsection-title" style={{ color: "hsl(0 72% 51%)" }}>
            <ShieldAlert size={12} /> Red Team — Why It Could Fail
          </h3>
          {redTeam.verdict && <p className="print-body font-semibold">{redTeam.verdict}</p>}
          {redTeam.arguments.map((arg, i) => (
            <PrintCard key={i} accent={arg.severity === "critical" ? "hsl(0 72% 51%)" : arg.severity === "major" ? "hsl(38 92% 50%)" : "hsl(220 10% 60%)"}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                <p className="print-card-title" style={{ margin: 0 }}>{arg.title}</p>
                <PrintTag label={arg.severity?.toUpperCase() || "—"} color={arg.severity === "critical" ? "hsl(0 72% 51%)" : "hsl(38 92% 50%)"} />
              </div>
              <p className="print-body-sm">{arg.argument}</p>
              {arg.biasExposed && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>Bias: {arg.biasExposed}</p>}
            </PrintCard>
          ))}
          {redTeam.killShot && (
            <PrintCard accent="hsl(0 72% 51%)">
              <p className="print-label" style={{ color: "hsl(0 72% 51%)" }}>Kill Shot</p>
              <p className="print-body-sm font-semibold">{redTeam.killShot}</p>
            </PrintCard>
          )}
        </div>
      )}

      {/* Blue Team */}
      {blueTeam?.arguments?.length && (
        <div className="print-subsection">
          <h3 className="print-subsection-title" style={{ color: "hsl(142 70% 35%)" }}>
            <Shield size={12} /> Blue Team — Why It Could Succeed
          </h3>
          {blueTeam.verdict && <p className="print-body font-semibold">{blueTeam.verdict}</p>}
          {blueTeam.arguments.map((arg, i) => (
            <PrintCard key={i} accent={arg.strength === "strong" ? "hsl(142 70% 40%)" : "hsl(217 91% 55%)"}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                <p className="print-card-title" style={{ margin: 0 }}>{arg.title}</p>
                <PrintTag label={arg.strength?.toUpperCase() || "—"} color={arg.strength === "strong" ? "hsl(142 70% 40%)" : "hsl(217 91% 55%)"} />
              </div>
              <p className="print-body-sm">{arg.argument}</p>
              {arg.enabler && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>Enabler: {arg.enabler}</p>}
            </PrintCard>
          ))}
          {blueTeam.moonshot && (
            <PrintCard accent="hsl(142 70% 40%)">
              <p className="print-label" style={{ color: "hsl(142 70% 35%)" }}>Moonshot Scenario</p>
              <p className="print-body-sm font-semibold">{blueTeam.moonshot}</p>
            </PrintCard>
          )}
        </div>
      )}

      {/* Counter Examples */}
      {counterExamples.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title">
            <Globe size={12} /> Counter Examples
          </h3>
          {counterExamples.map((ex, i) => {
            const outcomeColor = ex.outcome === "succeeded" ? "hsl(142 70% 40%)" : ex.outcome === "failed" ? "hsl(0 72% 51%)" : "hsl(38 92% 50%)";
            return (
              <PrintCard key={i} accent={outcomeColor}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                  <p className="print-card-title" style={{ margin: 0 }}>{ex.name}</p>
                  <PrintTag label={ex.outcome?.toUpperCase()} color={outcomeColor} />
                  {ex.year && <span className="print-body-sm" style={{ color: "hsl(220 10% 55%)" }}>{ex.year}</span>}
                </div>
                {ex.similarity && <p className="print-body-sm">Similarity: {ex.similarity}</p>}
                <p className="print-body-sm font-semibold">Lesson: {ex.lesson}</p>
                {ex.revenue && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>{ex.revenue}</p>}
              </PrintCard>
            );
          })}
        </div>
      )}

      {/* Confidence Scores */}
      {confidenceScores && Object.keys(confidenceScores).length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><BarChart3 size={12} /> Confidence Scores</h3>
          <div className="print-grid-2">
            {Object.entries(confidenceScores).map(([key, val]) => {
              const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
              const score = typeof val === "object" ? val.score : val;
              const reasoning = typeof val === "object" ? val.reasoning : "";
              const color = (score as number) >= 7 ? "hsl(142 70% 40%)" : (score as number) >= 5 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)";
              return (
                <div key={key} className="print-info-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p className="print-label">{label}</p>
                    <span className="print-score-badge" style={{ background: color + "18", color }}>{String(score)}/10</span>
                  </div>
                  {reasoning && <p className="print-body-sm">{reasoning}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feasibility */}
      {feasibility.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><CheckCircle2 size={12} /> Feasibility Checklist</h3>
          {feasibility.map((item, i) => {
            const statusColor = item.status === "critical" ? "hsl(0 72% 51%)" : item.status === "important" ? "hsl(38 92% 50%)" : "hsl(220 10% 55%)";
            return (
              <PrintCard key={i} accent={statusColor}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                  <p className="print-card-title" style={{ margin: 0 }}>{item.item}</p>
                  <PrintTag label={item.status?.toUpperCase()} color={statusColor} />
                </div>
                <p className="print-body-sm">{item.detail}</p>
                {item.estimatedCost && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>Est. cost: {item.estimatedCost}</p>}
              </PrintCard>
            );
          })}
        </div>
      )}

      {/* Blind Spots */}
      {blindSpots.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><AlertTriangle size={12} /> Blind Spots</h3>
          {blindSpots.map((b, i) => (
            <div key={i} className="print-list-item">
              <AlertTriangle size={10} style={{ color: "hsl(38 92% 50%)", flexShrink: 0, marginTop: 2 }} />
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      {/* Strategic Recommendations */}
      {recommendations.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><Rocket size={12} /> Strategic Recommendations</h3>
          {recommendations.map((r, i) => (
            <div key={i} className="print-list-item">
              <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </PrintSection>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PITCH DECK
   ═══════════════════════════════════════════════════════════════ */

function PitchDeckSection({ data }: { data: Record<string, unknown> }) {
  const d = data as Record<string, any>;
  const market = d.marketOpportunity as { tam?: string; sam?: string; som?: string; growthRate?: string } | undefined;
  const financials = d.financialModel as Record<string, any> | undefined;
  const risks = (d.risks || d.risksMitigation) as any[] | undefined;
  const milestones = (d.milestones || d.implementationTimeline) as any[] | undefined;
  const competitiveAdvantage = (d.competitiveAdvantage || d.competitiveMoat) as string[] | string | undefined;

  return (
    <PrintSection title="Pitch Deck" icon={<BarChart3 size={14} />}>
      {/* Tagline & Elevator Pitch */}
      {(d.tagline || d.elevatorPitch) && (
        <PrintCard accent="hsl(271 81% 55%)">
          {d.tagline && <p className="print-body font-bold" style={{ fontSize: "14px" }}>{d.tagline}</p>}
          {d.elevatorPitch && <p className="print-body-sm">{d.elevatorPitch}</p>}
        </PrintCard>
      )}

      {/* Problem / Solution */}
      {(d.problemStatement || d.solutionStatement) && (
        <div className="print-grid-2">
          {d.problemStatement && (
            <PrintCard accent="hsl(0 72% 51%)">
              <p className="print-label">Problem</p>
              <p className="print-body-sm">{d.problemStatement}</p>
            </PrintCard>
          )}
          {d.solutionStatement && (
            <PrintCard accent="hsl(142 70% 40%)">
              <p className="print-label">Solution</p>
              <p className="print-body-sm">{d.solutionStatement}</p>
            </PrintCard>
          )}
        </div>
      )}

      {/* Why Now */}
      {d.whyNow && (
        <PrintCard>
          <p className="print-label">Why Now</p>
          <p className="print-body-sm">{d.whyNow}</p>
        </PrintCard>
      )}

      {/* Market Opportunity */}
      {market && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><Globe size={12} /> Market Opportunity</h3>
          <div className="print-grid-4">
            <PrintMetricBox label="TAM" value={market.tam} />
            <PrintMetricBox label="SAM" value={market.sam} />
            <PrintMetricBox label="SOM" value={market.som} />
            <PrintMetricBox label="Growth" value={market.growthRate} />
          </div>
        </div>
      )}

      {/* Financial Model */}
      {financials && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><DollarSign size={12} /> Financial Model</h3>
          {financials.unitEconomics && (
            <div className="print-grid-3">
              <PrintMetricBox label="COGS" value={financials.unitEconomics.cogs} />
              <PrintMetricBox label="Retail Price" value={financials.unitEconomics.retailPrice} />
              <PrintMetricBox label="Gross Margin" value={financials.unitEconomics.grossMargin} />
              <PrintMetricBox label="Payback" value={financials.unitEconomics.paybackPeriod} />
              <PrintMetricBox label="LTV" value={financials.unitEconomics.ltv} />
              <PrintMetricBox label="CAC" value={financials.unitEconomics.cac} />
            </div>
          )}
          {financials.scenarios && (
            <div className="print-grid-3" style={{ marginTop: "0.5rem" }}>
              {["conservative", "base", "optimistic"].map((key) => {
                const s = financials.scenarios?.[key];
                if (!s) return null;
                const color = key === "conservative" ? "hsl(38 92% 50%)" : key === "optimistic" ? "hsl(142 70% 40%)" : "hsl(217 91% 55%)";
                return (
                  <PrintCard key={key} accent={color}>
                    <p className="print-label">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                    <p className="print-body-sm">Units: {s.units}</p>
                    <p className="print-body-sm">Revenue: {s.revenue}</p>
                    <p className="print-body-sm">Profit: {s.profit}</p>
                    {s.assumptions && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>{s.assumptions}</p>}
                  </PrintCard>
                );
              })}
            </div>
          )}
          {financials.fundingAsk && (
            <PrintCard accent="hsl(271 81% 55%)">
              <p className="print-label">Funding Ask</p>
              <p className="print-body-sm font-semibold">{financials.fundingAsk}</p>
              {financials.useOfFunds?.length > 0 && (
                <div style={{ marginTop: "0.3rem" }}>
                  {financials.useOfFunds.map((u: string, i: number) => (
                    <div key={i} className="print-list-item">
                      <CheckCircle2 size={9} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              )}
            </PrintCard>
          )}
        </div>
      )}

      {/* Competitive Advantage */}
      {competitiveAdvantage && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><Shield size={12} /> Competitive Advantage</h3>
          {Array.isArray(competitiveAdvantage) ? (
            competitiveAdvantage.map((a, i) => (
              <div key={i} className="print-list-item">
                <Shield size={10} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 2 }} />
                <span>{a}</span>
              </div>
            ))
          ) : (
            <p className="print-body-sm">{competitiveAdvantage}</p>
          )}
        </div>
      )}

      {/* Risks */}
      {risks && Array.isArray(risks) && risks.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><AlertTriangle size={12} /> Risks & Mitigation</h3>
          {risks.map((r, i) => (
            <PrintCard key={i} accent="hsl(38 92% 50%)">
              <p className="print-card-title">{r.risk || r.title || r.name || `Risk ${i + 1}`}</p>
              {r.mitigation && <p className="print-body-sm">Mitigation: {r.mitigation}</p>}
              {r.severity && <PrintTag label={r.severity} color="hsl(38 92% 50%)" />}
            </PrintCard>
          ))}
        </div>
      )}

      {/* Milestones */}
      {milestones && Array.isArray(milestones) && milestones.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><Clock size={12} /> Milestones</h3>
          {milestones.map((m, i) => (
            <div key={i} className="print-list-item">
              <span className="print-card-number">{i + 1}</span>
              <span>{typeof m === "string" ? m : `${m.milestone || m.title || ""} — ${m.timeline || m.date || ""}`}</span>
            </div>
          ))}
        </div>
      )}
    </PrintSection>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PATENT INTELLIGENCE
   ═══════════════════════════════════════════════════════════════ */

function PatentSection({ data }: { data: Record<string, unknown> }) {
  const patents = (data.patents || data.relevantPatents) as any[] | undefined;
  const landscape = data.landscapeAnalysis as string | undefined;
  const whitespace = (data.whitespaceOpportunities || data.opportunities) as string[] | undefined;

  if (!patents?.length && !landscape && !whitespace?.length) {
    return <PrintJSON data={data} />;
  }

  return (
    <>
      {landscape && (
        <PrintCard>
          <p className="print-label">Landscape Analysis</p>
          <p className="print-body-sm">{landscape}</p>
        </PrintCard>
      )}
      {patents && patents.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><ScrollText size={12} /> Relevant Patents</h3>
          {patents.map((p, i) => (
            <PrintCard key={i}>
              <p className="print-card-title">{p.title || p.name || `Patent ${i + 1}`}</p>
              {p.patentNumber && <p className="print-body-sm" style={{ color: "hsl(220 10% 50%)" }}>{p.patentNumber}</p>}
              {p.assignee && <p className="print-body-sm">Assignee: {p.assignee}</p>}
              {(p.abstract || p.description || p.summary) && <p className="print-body-sm">{p.abstract || p.description || p.summary}</p>}
              {p.relevance && <p className="print-body-sm font-semibold">Relevance: {p.relevance}</p>}
            </PrintCard>
          ))}
        </div>
      )}
      {whitespace && whitespace.length > 0 && (
        <div className="print-subsection">
          <h3 className="print-subsection-title"><Lightbulb size={12} /> Whitespace Opportunities</h3>
          {whitespace.map((w, i) => (
            <div key={i} className="print-list-item">
              <Lightbulb size={10} style={{ color: "hsl(38 92% 50%)", flexShrink: 0, marginTop: 2 }} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOVERNED INTELLIGENCE (Reasoning Synopsis, Decision Synthesis, Confidence)
   ═══════════════════════════════════════════════════════════════ */

function GovernedSection({ data }: { data: Record<string, unknown> }) {
  const synopsis = data.reasoning_synopsis as Record<string, any> | undefined;
  const decision = data.decision_synthesis as Record<string, any> | undefined;
  const constraintMap = data.constraint_map as Record<string, any> | undefined;
  const firstPrinciples = data.first_principles as Record<string, any> | undefined;
  const hypotheses = (data.root_hypotheses as any[]) || [];

  return (
    <>
      {/* Reasoning Synopsis */}
      {synopsis && (
        <PrintSection title="Reasoning Synopsis" icon={<Brain size={14} />}>
          {synopsis.lens_influence && (
            <PrintCard accent="hsl(271 81% 55%)">
              <p className="print-label">Lens Applied</p>
              <p className="print-body font-semibold">{synopsis.lens_influence?.lens_name || "Strategic Lens"}</p>
              {synopsis.lens_influence?.prioritized_factors?.length > 0 && (
                <div style={{ marginTop: "0.3rem" }}>
                  <p className="print-label">Prioritized Factors</p>
                  <div className="print-tag-row">
                    {synopsis.lens_influence.prioritized_factors.map((f: string, i: number) => (
                      <PrintTag key={i} label={f} color="hsl(271 81% 55%)" />
                    ))}
                  </div>
                </div>
              )}
              {synopsis.lens_influence?.deprioritized_factors?.length > 0 && (
                <div style={{ marginTop: "0.3rem" }}>
                  <p className="print-label">De-prioritized</p>
                  <div className="print-tag-row">
                    {synopsis.lens_influence.deprioritized_factors.map((f: string, i: number) => (
                      <PrintTag key={i} label={f} color="hsl(220 10% 55%)" />
                    ))}
                  </div>
                </div>
              )}
              {synopsis.lens_influence?.alternative_lens_impact && (
                <div style={{ marginTop: "0.3rem" }}>
                  <p className="print-label">Alternative Lens Impact</p>
                  <p className="print-body-sm">{synopsis.lens_influence.alternative_lens_impact}</p>
                </div>
              )}
            </PrintCard>
          )}

          {synopsis.evaluation_path && (
            <PrintCard>
              {synopsis.evaluation_path.evaluation_logic && (
                <div>
                  <p className="print-label">Evaluation Logic</p>
                  <p className="print-body-sm">{synopsis.evaluation_path.evaluation_logic}</p>
                </div>
              )}
              {synopsis.evaluation_path.dimensions_examined?.length > 0 && (
                <div style={{ marginTop: "0.3rem" }}>
                  <p className="print-label">Dimensions Examined</p>
                  <div className="print-tag-row">
                    {synopsis.evaluation_path.dimensions_examined.map((d: string, i: number) => (
                      <PrintTag key={i} label={d} color="hsl(217 91% 50%)" />
                    ))}
                  </div>
                </div>
              )}
            </PrintCard>
          )}

          {synopsis.key_assumptions?.length > 0 && (
            <div className="print-subsection">
              <h3 className="print-subsection-title"><AlertTriangle size={12} /> Key Assumptions</h3>
              {synopsis.key_assumptions.map((a: string, i: number) => (
                <div key={i} className="print-list-item">
                  <AlertTriangle size={10} style={{ color: "hsl(38 92% 50%)", flexShrink: 0, marginTop: 2 }} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </PrintSection>
      )}

      {/* Decision Synthesis */}
      {decision && (
        <PrintSection title="Decision Synthesis" icon={<CheckCircle2 size={14} />}>
          {decision.decision_grade && (
            <PrintCard accent={
              decision.decision_grade === "go" ? "hsl(142 70% 40%)" :
              decision.decision_grade === "conditional" ? "hsl(38 92% 50%)" :
              "hsl(0 72% 51%)"
            }>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <p className="print-label">Decision Grade</p>
                <PrintTag
                  label={decision.decision_grade.toUpperCase()}
                  color={
                    decision.decision_grade === "go" ? "hsl(142 70% 40%)" :
                    decision.decision_grade === "conditional" ? "hsl(38 92% 50%)" :
                    "hsl(0 72% 51%)"
                  }
                />
              </div>
              {decision.confidence_score != null && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <p className="print-label">Confidence Score</p>
                  <span className="print-score-badge" style={{
                    background: (decision.confidence_score >= 60 ? "hsl(142 70% 40%)" : decision.confidence_score >= 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)") + "18",
                    color: decision.confidence_score >= 60 ? "hsl(142 70% 40%)" : decision.confidence_score >= 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)"
                  }}>{decision.confidence_score}/100</span>
                </div>
              )}
            </PrintCard>
          )}

          {decision.blocking_uncertainties?.length > 0 && (
            <div className="print-subsection">
              <h3 className="print-subsection-title" style={{ color: "hsl(38 92% 45%)" }}>
                <AlertTriangle size={12} /> Blocking Uncertainties
              </h3>
              {decision.blocking_uncertainties.map((u: string, i: number) => (
                <div key={i} className="print-list-item">
                  <AlertTriangle size={10} style={{ color: "hsl(38 92% 50%)", flexShrink: 0, marginTop: 2 }} />
                  <span>{u}</span>
                </div>
              ))}
            </div>
          )}

          {decision.next_required_evidence && (
            <PrintCard>
              <p className="print-label">Next Required Evidence</p>
              <p className="print-body-sm">{decision.next_required_evidence}</p>
            </PrintCard>
          )}

          {decision.fastest_validation_experiment && (
            <PrintCard accent="hsl(217 91% 50%)">
              <p className="print-label">Fastest Validation Experiment</p>
              <p className="print-body-sm">{decision.fastest_validation_experiment}</p>
            </PrintCard>
          )}
        </PrintSection>
      )}

      {/* Root Hypotheses */}
      {hypotheses.length > 0 && (
        <PrintSection title="Strategic Hypotheses" icon={<Lightbulb size={14} />}>
          {hypotheses.map((h: any, i: number) => (
            <PrintCard key={i} accent="hsl(271 81% 55%)">
              <p className="print-card-title">
                <span className="print-card-number">{i + 1}</span>
                {h.statement || h.hypothesis || h.title || `Hypothesis ${i + 1}`}
              </p>
              {h.rationale && <p className="print-body-sm">{h.rationale}</p>}
              {h.confidence != null && (
                <PrintTag label={`Confidence: ${h.confidence}`} color="hsl(217 91% 50%)" />
              )}
            </PrintCard>
          ))}
        </PrintSection>
      )}

      {/* First Principles */}
      {firstPrinciples && (
        <PrintSection title="First Principles" icon={<Zap size={14} />}>
          {firstPrinciples.minimum_viable_system && (
            <PrintCard>
              <p className="print-label">Minimum Viable System</p>
              <p className="print-body-sm">{typeof firstPrinciples.minimum_viable_system === "string" ? firstPrinciples.minimum_viable_system : JSON.stringify(firstPrinciples.minimum_viable_system)}</p>
            </PrintCard>
          )}
          {firstPrinciples.constraints?.length > 0 && (
            <div className="print-subsection">
              <h3 className="print-subsection-title">Binding Constraints</h3>
              {(firstPrinciples.constraints as any[]).map((c: any, i: number) => (
                <div key={i} className="print-list-item">
                  <span className="print-card-number">{i + 1}</span>
                  <span>{typeof c === "string" ? c : c.name || c.constraint || JSON.stringify(c)}</span>
                </div>
              ))}
            </div>
          )}
        </PrintSection>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FALLBACK JSON RENDERER (for truly unknown data)
   ═══════════════════════════════════════════════════════════════ */

/** Humanize any key format: snake_case, SCREAMING_SNAKE, camelCase, _prefixed */
function humanizeKey(key: string): string {
  // Strip leading underscores
  let k = key.replace(/^_+/, "");
  // Convert snake_case / SCREAMING_SNAKE to spaces
  k = k.replace(/_/g, " ");
  // Insert space before uppercase runs in camelCase
  k = k.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Title case
  return k.replace(/\b\w/g, c => c.toUpperCase()).trim();
}

/** Keys to skip in the fallback renderer (internal computation artifacts) */
const INTERNAL_KEYS = new Set([
  "_confidence_computation", "_evidence_distribution", "_meta",
  "computation_trace", "governed_hashes", "_governed_version",
]);

function PrintJSON({ data }: { data: Record<string, unknown> }) {
  if (!data) return null;

  const renderValue = (val: unknown, depth = 0): React.ReactNode => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") return <span>{val}</span>;
    if (typeof val === "number" || typeof val === "boolean") return <span>{String(val)}</span>;
    if (Array.isArray(val)) {
      return (
        <ul className="print-json-list">
          {val.map((item, i) => (
            <li key={i}>{typeof item === "object" ? renderValue(item, depth + 1) : String(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      return (
        <div className="print-json-object" style={{ marginLeft: depth > 0 ? "1rem" : 0 }}>
          {Object.entries(obj).map(([k, v]) => {
            if (v === null || v === undefined) return null;
            if (INTERNAL_KEYS.has(k)) return null;
            const label = humanizeKey(k);
            return (
              <div key={k} className="print-json-entry">
                <span className="print-label">{label}</span>
                <div className="print-body-sm">{renderValue(v, depth + 1)}</div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return <>{renderValue(data)}</>;
}
