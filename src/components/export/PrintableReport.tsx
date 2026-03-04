import React from "react";
import type { Product } from "@/data/mockProducts";
import { isServiceCategory } from "@/utils/normalizeProduct";
import { ScoreBar } from "@/components/ScoreBar";
import { WorkflowTimeline } from "@/components/FirstPrinciplesAnalysis";
import {
  Target, Clock, MessageSquare, DollarSign, Package, Factory, Store, Truck,
  ShieldAlert, Lightbulb, ExternalLink, ScrollText,
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

  return (
    <div className="print-report">
      {/* ── Cover Page ── */}
      <div className="print-cover">
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

      {/* ── Disruption Analysis ── */}
      {analysisData?.disrupt && (
        <PrintSection title="Disruption Analysis">
          <PrintJSON data={analysisData.disrupt as Record<string, unknown>} />
        </PrintSection>
      )}

      {/* ── Stress Test ── */}
      {analysisData?.stressTest && (
        <PrintSection title="Stress Test">
          <PrintJSON data={analysisData.stressTest as Record<string, unknown>} />
        </PrintSection>
      )}

      {/* ── Pitch Deck ── */}
      {analysisData?.pitchDeck && (
        <PrintSection title="Pitch Deck">
          <PrintJSON data={analysisData.pitchDeck as Record<string, unknown>} />
        </PrintSection>
      )}

      {/* ── Redesign ── */}
      {analysisData?.redesign && (
        <PrintSection title="Redesign Proposals">
          <PrintJSON data={analysisData.redesign as Record<string, unknown>} />
        </PrintSection>
      )}

      {/* ── Patent Data ── */}
      {!isService && product?.patentData && (
        <PrintSection title="Patent Intelligence" icon={<ScrollText size={14} />}>
          <PrintJSON data={product.patentData as Record<string, unknown>} />
        </PrintSection>
      )}

      {/* ── Footer ── */}
      <div className="print-footer">
        <p>Generated by Market Disruptor — {now}</p>
      </div>
    </div>
  );
}

function PrintSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="print-section">
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

/** Renders nested analysis JSON as readable key-value pairs */
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
            const label = k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
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
