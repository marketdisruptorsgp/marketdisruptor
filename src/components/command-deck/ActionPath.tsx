/**
 * Zone 5 — Action Path
 * "What should I explore next?" — large clickable tiles for next steps.
 */

import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Crosshair, DollarSign, GitBranch, Lightbulb, FlaskConical, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ActionPathProps {
  analysisId: string;
  completedSteps: Set<string>;
  mode: "product" | "service" | "business";
}

interface ActionTile {
  label: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  priority: number;
}

const ALL_ACTIONS: (ActionTile & { stepKey?: string; alwaysShow?: boolean })[] = [
  {
    label: "Challenge the assumptions",
    description: "See which beliefs are holding the business back — and what happens if you flip them",
    icon: Layers,
    route: "disrupt",
    color: "hsl(var(--primary))",
    priority: 1,
    stepKey: "disrupt",
  },
  {
    label: "Explore reinvention ideas",
    description: "Concrete ways to restructure the business model based on what we found",
    icon: Crosshair,
    route: "redesign",
    color: "hsl(142 70% 35%)",
    priority: 2,
    stepKey: "redesign",
  },
  {
    label: "Stress test the strategy",
    description: "Run scenarios against pricing, competition, and market shifts",
    icon: AlertTriangle,
    route: "stress-test",
    color: "hsl(38 92% 42%)",
    priority: 3,
    stepKey: "stress-test",
  },
  {
    label: "Read the full intelligence report",
    description: "All the evidence, data sources, and reasoning behind our analysis",
    icon: Lightbulb,
    route: "report",
    color: "hsl(271 81% 55%)",
    priority: 4,
    stepKey: "report",
  },
  {
    label: "See the reasoning map",
    description: "Visual map of how constraints, opportunities, and evidence connect",
    icon: GitBranch,
    route: "insight-graph",
    color: "hsl(172 66% 50%)",
    priority: 5,
    alwaysShow: true,
  },
];

export const ActionPath = memo(function ActionPath({
  analysisId,
  completedSteps,
  mode,
}: ActionPathProps) {
  const navigate = useNavigate();
  const baseUrl = `/analysis/${analysisId}`;

  const tiles = useMemo(() => {
    // Prioritize incomplete steps, then always-show items
    return ALL_ACTIONS
      .filter(a => a.alwaysShow || !completedSteps.has(a.stepKey || ""))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 4);
  }, [completedSteps]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 px-1">
        <FlaskConical size={14} className="text-muted-foreground" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">What should you explore next?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.button
              key={tile.route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + i * 0.05 }}
              onClick={() => navigate(`${baseUrl}/${tile.route}`)}
              className="group rounded-xl p-5 flex items-start gap-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[88px]"
              style={{
                background: "hsl(var(--card))",
                border: "1.5px solid hsl(var(--border))",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: `${tile.color}12` }}
              >
                <Icon size={18} style={{ color: tile.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug">{tile.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{tile.description}</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
});
