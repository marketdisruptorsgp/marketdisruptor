/**
 * Strategic Pathway Generator — Command Deck Module 4
 *
 * Auto-generates execution pathways for top opportunities.
 * Each pathway shows numbered steps derived from opportunity context.
 * Appears automatically without user clicks.
 */

import { memo, useMemo } from "react";
import { Route, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import type { Insight } from "@/lib/insightLayer";

interface PathwayGeneratorProps {
  opportunities: AggregatedOpportunity[];
  insights: Insight[];
}

interface Pathway {
  opportunityId: string;
  opportunityLabel: string;
  steps: string[];
  confidence: string;
}

/** Derive execution steps from opportunity context and related insights */
function generatePathway(opp: AggregatedOpportunity, insights: Insight[]): Pathway {
  const steps: string[] = [];
  const label = opp.label.toLowerCase();

  // Generic high-quality steps based on opportunity properties
  // Step 1: Validation
  if ((opp.simulationFeasibility ?? 0) < 3) {
    steps.push(`Validate market assumptions for "${opp.label}" through primary research`);
  } else {
    steps.push(`Confirm structural viability of "${opp.label}" with stakeholder interviews`);
  }

  // Step 2: Constraint resolution
  const relatedConstraints = insights.filter(i =>
    i.insightType === "constraint_cluster" &&
    i.label.toLowerCase().split(" ").some(w => label.includes(w))
  );
  if (relatedConstraints.length > 0) {
    steps.push(`Address constraint: "${relatedConstraints[0].label}"`);
  } else {
    steps.push("Map and resolve blocking constraints");
  }

  // Step 3: Execution
  if ((opp.marketAttractiveness ?? 0) >= 5) {
    steps.push("Build minimum viable offering targeting early adopters");
  } else {
    steps.push("Develop proof-of-concept to test core value proposition");
  }

  // Step 4: Scale
  if ((opp.strategicLeverage ?? 0) >= 5) {
    steps.push("Leverage structural advantage for rapid scaling");
  } else {
    steps.push("Establish operational foundation before scaling");
  }

  // Step 5: Optimize
  if ((opp.simulationCount ?? 0) > 0) {
    steps.push("Optimize based on simulation-validated scenarios");
  } else {
    steps.push("Run financial simulations to optimize execution parameters");
  }

  return {
    opportunityId: opp.id,
    opportunityLabel: opp.label,
    steps,
    confidence: opp.confidence,
  };
}

export const PathwayGenerator = memo(function PathwayGenerator({
  opportunities,
  insights,
}: PathwayGeneratorProps) {
  const pathways = useMemo(() => {
    return opportunities.slice(0, 3).map(opp => generatePathway(opp, insights));
  }, [opportunities, insights]);

  if (pathways.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(172 66% 50% / 0.12)" }}>
          <Route size={13} style={{ color: "hsl(172 66% 50%)" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Strategic Pathways</p>
          <p className="text-[10px] text-muted-foreground">Auto-generated execution plans for top opportunities</p>
        </div>
      </div>

      {/* Pathways */}
      <div className="p-4 space-y-4">
        {pathways.map((pathway, pi) => {
          const confColor = pathway.confidence === "high"
            ? "hsl(var(--success))"
            : pathway.confidence === "medium"
              ? "hsl(var(--warning))"
              : "hsl(var(--muted-foreground))";

          return (
            <motion.div
              key={pathway.opportunityId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: pi * 0.06, duration: 0.3 }}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "hsl(var(--muted) / 0.4)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              {/* Pathway header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs font-extrabold w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(172 66% 50% / 0.12)", color: "hsl(172 66% 50%)" }}
                  >
                    {pi + 1}
                  </span>
                  <p className="text-sm font-bold text-foreground truncate">
                    {pathway.opportunityLabel}
                  </p>
                </div>
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${confColor}12`, color: confColor }}
                >
                  {pathway.confidence}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-0">
                {pathway.steps.map((step, si) => (
                  <div key={si} className="flex items-start gap-3 py-2">
                    {/* Step connector */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold"
                        style={{
                          background: "hsl(172 66% 50% / 0.12)",
                          color: "hsl(172 66% 50%)",
                        }}
                      >
                        {si + 1}
                      </div>
                      {si < pathway.steps.length - 1 && (
                        <div className="w-px h-4 mt-1" style={{ background: "hsl(var(--border))" }} />
                      )}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});
