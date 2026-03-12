import { Download } from "lucide-react";
import { useRef } from "react";

const STEPS = [
  {
    step: 1,
    label: "FOUNDATION",
    subtitle: "structural-decomposition",
    color: "hsl(217 91% 60%)",
    bg: "hsl(217 91% 60% / 0.12)",
    border: "hsl(217 91% 60% / 0.4)",
    items: [
      "Product/Service/Business input parsing",
      "Web scraping (specs, pricing, era)",
      "Photo analysis (image → product)",
      "Patent landscape search",
      "Market news & trend signals",
      "Geographic market sizing",
      "Competitor scouting",
      "Community sentiment extraction",
      "Supply chain mapping",
    ],
    outputLabel: "decompositionData + Evidence[]",
  },
  {
    step: "1.5",
    label: "CONFIDENCE GATING",
    subtitle: "confidenceGating.ts",
    color: "hsl(38 92% 50%)",
    bg: "hsl(38 92% 50% / 0.12)",
    border: "hsl(38 92% 50% / 0.4)",
    items: [
      "7 data domains assessed (pricing, supply chain, competitive, patent/IP, BOM, trends, customer, regulatory)",
      "Provenance tagging: SCRAPED | PARAMETRIC | AI_INFERRED | USER_INPUT",
      "Low-confidence gates (score < 0.4 → research question)",
      "Research Checklist generation (prioritized, copyable)",
      "Known vs. inferred ratio computation",
    ],
    outputLabel: "ConfidenceAssessment + ResearchQuestion[]",
    receives: ["decompositionData", "upstreamIntel"],
    crossCutting: true,
  },
  {
    step: 2,
    label: "SYNTHESIS",
    subtitle: "strategic-synthesis + transformation-engine",
    color: "hsl(173 80% 40%)",
    bg: "hsl(173 80% 40% / 0.12)",
    border: "hsl(173 80% 40% / 0.4)",
    items: [
      "Hidden assumptions extraction (5+ with leverage scores)",
      "Flipped logic generation (bold alternatives)",
      "Strategic analysis (true problem, actual usage, hacks)",
      "Friction analysis (gaps, opportunities)",
      "Smart tech analysis (missed opportunities)",
      "Transformation concepts (structural redesigns)",
      "Current strengths assessment (keep vs adapt)",
    ],
    outputLabel: "synthesisData + transformations",
    receives: ["decompositionData", "Evidence[]", "ConfidenceAssessment"],
    receivesDetail: [
      "decompositionData.structuralPrimitives",
      "decompositionData.leverageAnalysis",
      "upstreamIntel.pricingIntel",
      "upstreamIntel.supplyChain",
      "upstreamIntel.communityInsights",
      "upstreamIntel.patentLandscape",
      "_dataConfidence (provenance metadata)",
    ],
  },
  {
    step: 3,
    label: "CONCEPTS",
    subtitle: "concept-architecture + concept-synthesis",
    color: "hsl(271 81% 56%)",
    bg: "hsl(271 81% 56% / 0.12)",
    border: "hsl(271 81% 56% / 0.4)",
    subsections: [
      {
        name: "Concept Architecture",
        items: [
          "Design dimension identification",
          "Morphological design space exploration",
          "Concept variant generation (10–30 candidates)",
          "Feasibility, novelty, market readiness tiers",
        ],
      },
      {
        name: "Concept Synthesis (Product Mode)",
        items: [
          "Product concept cards (name, description, mechanism)",
          "AI visual mockups (auto-generated)",
          "Unit economics (BOM → retail → margin)",
          "3-phase action plan + revenue projection",
          "Risk/capital badges",
          "Constraint linkage to upstream assumptions",
        ],
      },
      {
        name: "Redesigned Concept",
        items: [
          "Concept name + tagline",
          "Core insight + radical differences",
          "Physical description + materials",
          "Smart features + friction eliminated",
          "Manufacturing path + price point",
        ],
      },
    ],
    receives: [
      "synthesisData",
      "transformations",
      "Evidence[] (full bundle)",
      "ConfidenceAssessment",
    ],
    receivesDetail: [
      "synthesisData.hiddenAssumptions[]",
      "synthesisData.flippedLogic[]",
      "transformations.redesignConcepts[]",
      "upstreamIntel (full bundle)",
      "insightPreferences (user curation)",
      "steeringText (user guidance)",
      "governedContext (reasoning synopsis)",
    ],
  },
  {
    step: 4,
    label: "VALIDATION + PITCH",
    subtitle: "critical-validation + generate-pitch-deck",
    color: "hsl(0 70% 50%)",
    bg: "hsl(0 70% 50% / 0.12)",
    border: "hsl(0 70% 50% / 0.4)",
    items: [
      "Red/Green team critical validation",
      "Business model analysis",
      "Deal economics panel",
      "Pitch deck (5-slide generator)",
      "Decision synthesis",
      "Confidence-gated output (research gaps flagged)",
    ],
    receives: ["All upstream data", "conceptsData", "transformations", "ConfidenceAssessment"],
  },
];

const EDGE_FUNCTIONS = [
  "structural-decomposition",
  "strategic-synthesis",
  "transformation-engine",
  "concept-architecture",
  "critical-validation",
  "generate-pitch-deck",
  "business-model-analysis",
  "generate-product-visual",
  "compute-analytics-insights",
  "generate-opportunity-vectors",
  "analyze-business-structure",
  "research-competitive-positioning",
  "industry-benchmarks",
  "scrape-products",
  "analyze-products",
  "photo-analysis",
  "scrape-market-news",
  "geo-market-data",
  "help-assistant",
  "api-proxy",
  "fire-webhook",
];

export function PipelineDiagram() {
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ref.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#0f1219",
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = "market-disruptor-pipeline.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Full Intelligence Pipeline</h2>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{ background: "hsl(var(--primary))", color: "white" }}
        >
          <Download size={14} /> Download as PNG
        </button>
      </div>

      <div
        ref={ref}
        className="p-8 rounded-2xl space-y-6"
        style={{ background: "#0f1219", minWidth: 900 }}
      >
        {/* Title */}
        <div className="text-center space-y-1 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#fff" }}>
            Market Disruptor OS — 4-Phase Discovery Pipeline
          </h1>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            Data flow architecture · Confidence-gated intelligence · Updated March 2026
          </p>
        </div>

        {/* Pipeline steps */}
        <div className="space-y-4">
          {STEPS.map((s, idx) => (
            <div key={String(s.step)} className="relative">
              {/* Incoming data arrows */}
              {s.receives && (
                <div className="mb-2 ml-12 flex flex-wrap gap-1.5">
                  {s.receives.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      ← {r}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`rounded-xl p-5 relative overflow-hidden ${(s as any).crossCutting ? "ring-1 ring-amber-500/30" : ""}`}
                style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
              >
                {/* Step number + label */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                    style={{ background: s.color, color: "#fff" }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-wide" style={{ color: s.color }}>
                      {s.label}
                    </h3>
                    {(s as any).subtitle && (
                      <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {(s as any).subtitle}
                      </p>
                    )}
                  </div>
                  {s.outputLabel && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                      outputs → {s.outputLabel}
                    </span>
                  )}
                  {(s as any).crossCutting && (
                    <span className="ml-2 text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 50%)" }}>
                      CROSS-CUTTING
                    </span>
                  )}
                </div>

                {/* Items */}
                {s.items && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 ml-11">
                    {s.items.map((item) => (
                      <p key={item} className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                        • {item}
                      </p>
                    ))}
                  </div>
                )}

                {/* Subsections */}
                {(s as any).subsections && (
                  <div className="ml-11 space-y-3">
                    {(s as any).subsections.map((sub: any) => (
                      <div key={sub.name}>
                        <p className="text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>
                          {sub.name}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5">
                          {sub.items.map((item: string) => (
                            <p key={item} className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                              • {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detailed receives */}
                {s.receivesDetail && (
                  <div className="mt-3 ml-11 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Exact data fields received
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {s.receivesDetail.map((d) => (
                        <code key={d} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: s.color }}>
                          {d}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Connector arrow */}
              {idx < STEPS.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-[2px] h-4" style={{ background: "rgba(255,255,255,0.15)" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Edge Functions Registry */}
        <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Edge Functions Registry ({EDGE_FUNCTIONS.length} deployed)
          </p>
          <div className="flex flex-wrap gap-1">
            {EDGE_FUNCTIONS.map((fn) => (
              <code key={fn} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                {fn}
              </code>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
            SGP Capital · Market Disruptor OS · Pipeline Architecture v4.0 · Confidence-Gated
          </p>
        </div>
      </div>
    </div>
  );
}
