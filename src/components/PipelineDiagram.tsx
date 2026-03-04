import { Download } from "lucide-react";
import { useRef } from "react";

const STEPS = [
  {
    step: 1,
    label: "REPORT",
    color: "hsl(217 91% 60%)",
    bg: "hsl(217 91% 60% / 0.12)",
    border: "hsl(217 91% 60% / 0.4)",
    items: [
      "Product Scraping (name, specs, era)",
      "Pricing Intel (market price, resale, trend)",
      "Supply Chain (suppliers, mfrs, distributors)",
      "Community Insights (sentiment, complaints, requests)",
      "Patent Landscape (total, expired, key players, gaps)",
      "User Workflow (steps, friction, cognitive load)",
      "Competitor Analysis (gaps, positioning)",
      "Trend Analysis (cultural/tech shifts)",
      "Reviews (positive/negative sentiment)",
    ],
    outputLabel: "product object",
  },
  {
    step: 2,
    label: "INTEL REPORT",
    color: "hsl(173 80% 40%)",
    bg: "hsl(173 80% 40% / 0.12)",
    border: "hsl(173 80% 40% / 0.4)",
    items: [
      "Signal Matrix (8 adaptive quadrants)",
      "Observed Signals (strengths, complaints, friction)",
      "Friction Dimensions (primary + 6 sub-dimensions)",
      "Patent Treemap (by category/assignee)",
      "Regulatory Landscape (agencies, rulings)",
      "Market News (scraped headlines)",
      "Trend Signals (Google Trends velocity)",
    ],
    outputLabel: "intel digest",
    receives: ["product object"],
  },
  {
    step: 3,
    label: "DISRUPT",
    color: "hsl(271 81% 56%)",
    bg: "hsl(271 81% 56% / 0.12)",
    border: "hsl(271 81% 56% / 0.4)",
    items: [
      "Hidden Assumptions (5+ min, leverage scores)",
      "Flipped Logic (4+ min, bold alternatives)",
      "Core Reality (true problem, actual usage, hacks)",
      "Friction Analysis (gaps, opportunities)",
      "Smart Tech Analysis (missed opportunities)",
      "Current Strengths (what works, keep vs adapt)",
      "User Workflow (current journey + friction map)",
    ],
    outputLabel: "disruptContext",
    receives: ["product object", "upstreamIntel"],
    receivesDetail: [
      "upstreamIntel.pricingIntel",
      "upstreamIntel.supplyChain",
      "upstreamIntel.communityInsights",
      "upstreamIntel.userWorkflow",
      "upstreamIntel.patentLandscape",
    ],
  },
  {
    step: 4,
    label: "REDESIGN",
    color: "hsl(38 92% 50%)",
    bg: "hsl(38 92% 50% / 0.12)",
    border: "hsl(38 92% 50% / 0.4)",
    subsections: [
      {
        name: "Flip the Logic",
        items: [
          "Assumption → Bold Alternative cards",
          "Leverage scores (dot-bar)",
          "Impact scenarios",
          "Include in Pitch toggle",
        ],
      },
      {
        name: "Flipped Ideas (generate-flip-ideas)",
        items: [
          "Product concept cards (name, description)",
          "AI visual mockups (auto-generated)",
          "Scores: feasibility, desirability, profitability, novelty",
          "Unit economics (BOM → retail → margin)",
          "3-phase action plan + revenue projection",
          "Risk/capital badges",
          "Constraint linkage to upstream assumption",
        ],
      },
      {
        name: "Redesigned Concept",
        items: [
          "Concept name + tagline",
          "Core insight + radical differences",
          "Physical description + materials",
          "Smart features",
          "Friction eliminated",
          "Manufacturing path + price point",
        ],
      },
    ],
    receives: [
      "product object",
      "upstreamIntel (full bundle)",
      "disruptContext.hiddenAssumptions",
      "disruptContext.flippedLogic",
    ],
    receivesDetail: [
      "upstreamIntel.pricingIntel",
      "upstreamIntel.supplyChain",
      "upstreamIntel.communityInsights",
      "upstreamIntel.userWorkflow",
      "upstreamIntel.patentLandscape",
      "disruptContext.hiddenAssumptions[]",
      "disruptContext.flippedLogic[]",
      "insightPreferences (user curation)",
      "steeringText (user guidance)",
      "activeBranch (hypothesis isolation)",
      "governedContext (reasoning synopsis)",
    ],
  },
  {
    step: 5,
    label: "STRESS TEST + PITCH",
    color: "hsl(0 70% 50%)",
    bg: "hsl(0 70% 50% / 0.12)",
    border: "hsl(0 70% 50% / 0.4)",
    items: [
      "Red/Green team critical validation",
      "Business model analysis",
      "Deal economics panel",
      "Pitch deck (5-slide generator)",
      "Decision synthesis",
    ],
    receives: ["All upstream data", "redesignData", "flippedIdeas"],
  },
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
            Market Disruptor OS — Full Intelligence Pipeline
          </h1>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            Data flow architecture · What feeds each step · Updated March 2026
          </p>
        </div>

        {/* Pipeline steps */}
        <div className="space-y-4">
          {STEPS.map((s, idx) => (
            <div key={s.step} className="relative">
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
                className="rounded-xl p-5 relative overflow-hidden"
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
                  <h3 className="text-base font-black tracking-wide" style={{ color: s.color }}>
                    {s.label}
                  </h3>
                  {s.outputLabel && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                      outputs → {s.outputLabel}
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

                {/* Subsections (for Redesign) */}
                {s.subsections && (
                  <div className="ml-11 space-y-3">
                    {s.subsections.map((sub) => (
                      <div key={sub.name}>
                        <p className="text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>
                          {sub.name}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5">
                          {sub.items.map((item) => (
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

        {/* Footer */}
        <div className="text-center pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
            SGP Capital · Market Disruptor OS · Pipeline Architecture v3.2
          </p>
        </div>
      </div>
    </div>
  );
}
