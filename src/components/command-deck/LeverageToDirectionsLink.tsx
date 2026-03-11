/**
 * LeverageToDirectionsLink — Shows which leverage primitives unlock which strategic directions.
 * Connects Leverage Analysis data to the DeepenedOpportunities.
 */
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Crosshair, ArrowRight, Lightbulb } from "lucide-react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration/opportunityDeepening";

interface LeverageToDirectionsLinkProps {
  opportunities: DeepenedOpportunity[];
  decompositionData: any;
  modeAccent: string;
}

interface LeverageLink {
  leverageLabel: string;
  leverageScore: number;
  transformation: string;
  linkedOpportunities: { id: string; label: string }[];
}

export const LeverageToDirectionsLink = memo(function LeverageToDirectionsLink({
  opportunities,
  decompositionData,
  modeAccent,
}: LeverageToDirectionsLinkProps) {
  const links = useMemo<LeverageLink[]>(() => {
    const leverage = decompositionData?.leverageAnalysis?.leveragePrimitives;
    if (!leverage?.length || !opportunities?.length) return [];

    return leverage.slice(0, 5).map((lp: any) => {
      // Match leverage primitives to opportunities via constraint resolution
      const linked = opportunities.filter(opp => {
        const constraintMatch = opp.resolvesConstraints?.some(c =>
          c.toLowerCase().includes(lp.primitiveLabel?.toLowerCase()?.slice(0, 15)) ||
          lp.primitiveLabel?.toLowerCase()?.includes(c.toLowerCase()?.slice(0, 15))
        );
        const summaryMatch = opp.summary?.toLowerCase()?.includes(lp.primitiveLabel?.toLowerCase()?.slice(0, 12));
        return constraintMatch || summaryMatch;
      });

      // If no specific match, link to highest-signal opportunity
      const finalLinked = linked.length > 0 ? linked : [opportunities[0]];

      return {
        leverageLabel: lp.primitiveLabel,
        leverageScore: lp.leverageScore,
        transformation: lp.bestTransformation,
        linkedOpportunities: finalLinked.map((o: DeepenedOpportunity) => ({
          id: o.id,
          label: o.reconfigurationLabel || o.label,
        })),
      };
    });
  }, [opportunities, decompositionData]);

  if (links.length === 0) return null;

  const TRANSFORM_COLORS: Record<string, string> = {
    elimination: "hsl(var(--destructive))",
    substitution: "hsl(var(--primary))",
    reordering: "hsl(38 92% 45%)",
    aggregation: "hsl(271 81% 56%)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair size={14} style={{ color: modeAccent }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Leverage → Strategic Directions
          </span>
          <span className="text-xs text-muted-foreground">— What unlocks what</span>
        </div>

        <div className="space-y-2">
          {links.map((link, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg p-3"
              style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
            >
              {/* Leverage primitive */}
              <div className="flex-shrink-0 w-[38%] min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{link.leverageLabel}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{
                      background: `${TRANSFORM_COLORS[link.transformation] || modeAccent}15`,
                      color: TRANSFORM_COLORS[link.transformation] || modeAccent,
                    }}
                  >
                    {link.transformation}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground">
                    Score: {Math.round(link.leverageScore * 10) / 10}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight size={14} style={{ color: modeAccent }} className="flex-shrink-0" />

              {/* Linked opportunities */}
              <div className="flex-1 min-w-0 space-y-1">
                {link.linkedOpportunities.map((opp, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    <Lightbulb size={10} style={{ color: modeAccent }} className="flex-shrink-0" />
                    <p className="text-[11px] font-bold text-foreground truncate">{opp.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
