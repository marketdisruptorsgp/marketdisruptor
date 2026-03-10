/**
 * 90-Day Post-Close Playbook
 * 
 * Prioritized action plan based on constraints and leverage points
 * extracted from the analysis. Three phases: Week 1-2, Month 1, Month 2-3.
 */

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, ChevronDown, ChevronUp, Zap, Shield, TrendingUp,
  AlertTriangle, Users, Wrench, Target,
} from "lucide-react";
import { extractFinancialInputs } from "@/lib/etaScoringEngine";
import { ProvenanceBadge, type ProvenanceSource } from "./ProvenanceBadge";

interface PostClosePlaybookProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
}

interface PlaybookAction {
  action: string;
  why: string;
  icon: typeof Zap;
  priority: "critical" | "high" | "medium";
  source: ProvenanceSource;
}

interface PlaybookPhase {
  label: string;
  timeframe: string;
  theme: string;
  actions: PlaybookAction[];
}

function buildPlaybook(
  inputs: ReturnType<typeof extractFinancialInputs>,
  bi: Record<string, any> | null,
): PlaybookPhase[] {
  const constraints = Array.isArray(bi?.constraints) ? bi.constraints : [];
  const leveragePoints = Array.isArray(bi?.leverage_points) ? bi.leverage_points : [];
  const phases: PlaybookPhase[] = [];

  // ── PHASE 1: Week 1-2 — Stabilize ──
  const phase1: PlaybookAction[] = [
    { action: "Meet every employee 1-on-1", why: "Assess talent, build trust, identify flight risks", icon: Users, priority: "critical", source: "modeled" },
    { action: "Lock in key customer relationships", why: "Introduce yourself, confirm ongoing commitments", icon: Shield, priority: "critical", source: "modeled" },
  ];

  if (inputs.ownerDependency === "dependent" || inputs.ownerDependency === "owner_critical") {
    phase1.unshift({
      action: "Shadow the owner daily — document every process they touch",
      why: "Owner dependency is high. Every undocumented process is a risk",
      icon: AlertTriangle, priority: "critical", source: "cim",
    });
  }

  if (inputs.customerConcentration && inputs.customerConcentration > 0.15) {
    phase1.push({
      action: `Visit top customer in person (${(inputs.customerConcentration * 100).toFixed(0)}% of revenue)`,
      why: "This single relationship is a critical revenue dependency",
      icon: Target, priority: "critical", source: "cim",
    });
  }

  if (inputs.employeeCount && inputs.employeeCount <= 5) {
    phase1.push({
      action: "Offer retention bonuses to key employees",
      why: "Micro-team — losing one person could halt operations",
      icon: Users, priority: "critical", source: "cim",
    });
  }

  phase1.push({ action: "Audit all vendor contracts, leases, and insurance policies", why: "Identify upcoming renewals, unfavorable terms, or gaps", icon: Shield, priority: "high", source: "modeled" });

  phases.push({ label: "Stabilize", timeframe: "Week 1–2", theme: "Don't break anything. Build trust. Learn the real business.", actions: phase1 });

  // ── PHASE 2: Month 1 — Optimize ──
  const phase2: PlaybookAction[] = [];

  // Constraint-driven actions
  constraints.forEach((c: any) => {
    const label = typeof c === "string" ? c : c?.label || c?.constraint || "";
    if (!label) return;
    const lower = label.toLowerCase();
    if (lower.includes("capacity") || lower.includes("production") || lower.includes("bottleneck")) {
      phase2.push({
        action: `Address capacity constraint: ${label.slice(0, 80)}`,
        why: "This is capping revenue growth — quantify the ceiling and plan the fix",
        icon: Wrench, priority: "high", source: "cim",
      });
    }
    if (lower.includes("marketing") || lower.includes("sales") || lower.includes("lead")) {
      phase2.push({
        action: `Fix lead generation gap: ${label.slice(0, 80)}`,
        why: "Quick win — even basic marketing can drive immediate growth",
        icon: TrendingUp, priority: "high", source: "cim",
      });
    }
    if (lower.includes("pricing") || lower.includes("underpriced") || lower.includes("margin")) {
      phase2.push({
        action: `Review and adjust pricing: ${label.slice(0, 80)}`,
        why: "Pricing is the fastest path to margin improvement",
        icon: Zap, priority: "high", source: "cim",
      });
    }
  });

  // Leverage-driven actions
  leveragePoints.slice(0, 3).forEach((lp: any) => {
    const label = typeof lp === "string" ? lp : lp?.label || lp?.point || "";
    if (!label) return;
    phase2.push({
      action: `Activate leverage: ${label.slice(0, 80)}`,
      why: "Identified strength to amplify for immediate impact",
      icon: Zap, priority: "medium", source: "cim",
    });
  });

  if (inputs.sdeMargin != null && inputs.sdeMargin < 0.20) {
    phase2.push({
      action: "Line-item cost audit — cut non-essential overhead",
      why: `SDE margin is ${(inputs.sdeMargin * 100).toFixed(0)}%. Need room for debt service`,
      icon: Wrench, priority: "high", source: "cim",
    });
  }

  if (phase2.length === 0) {
    phase2.push({ action: "Implement basic KPI dashboard (revenue, margin, pipeline)", why: "You can't improve what you don't measure", icon: TrendingUp, priority: "high", source: "modeled" });
    phase2.push({ action: "Document all standard operating procedures", why: "Reduces key-person risk and enables delegation", icon: Shield, priority: "medium", source: "modeled" });
  }

  phases.push({ label: "Optimize", timeframe: "Month 1", theme: "Fix the obvious. Measure everything. Quick wins only.", actions: phase2 });

  // ── PHASE 3: Month 2-3 — Grow ──
  const phase3: PlaybookAction[] = [];

  if (inputs.recurringRevenuePct != null && inputs.recurringRevenuePct < 0.30) {
    phase3.push({
      action: "Launch a recurring revenue offering (maintenance plan, retainer, subscription)",
      why: `Only ${(inputs.recurringRevenuePct * 100).toFixed(0)}% recurring — predictability is critical for growth`,
      icon: TrendingUp, priority: "high", source: "cim",
    });
  }

  phase3.push({ action: "Hire or promote an operations manager", why: "Free yourself from daily operations to focus on growth", icon: Users, priority: "high", source: "modeled" });
  phase3.push({ action: "Build a 12-month growth roadmap with specific revenue targets", why: "Align team around concrete milestones", icon: Target, priority: "medium", source: "modeled" });

  if (inputs.revenueGrowthPct != null && inputs.revenueGrowthPct < 5) {
    phase3.push({
      action: "Launch new customer acquisition channel (digital, referral, or partnerships)",
      why: `Growth is ${inputs.revenueGrowthPct >= 0 ? "flat" : "declining"} — need new revenue sources`,
      icon: Zap, priority: "high", source: "cim",
    });
  }

  phases.push({ label: "Grow", timeframe: "Month 2–3", theme: "Now build. Add systems, people, and revenue streams.", actions: phase3 });

  return phases;
}

const PRIORITY_STYLE = {
  critical: { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.06)", border: "hsl(var(--destructive) / 0.2)", label: "Critical" },
  high: { color: "hsl(38, 92%, 50%)", bg: "hsl(38, 92%, 50% / 0.06)", border: "hsl(38, 92%, 50% / 0.2)", label: "High" },
  medium: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.3)", border: "hsl(var(--border))", label: "Medium" },
};

export const PostClosePlaybook = memo(function PostClosePlaybook({ biExtraction, governedData }: PostClosePlaybookProps) {
  const inputs = useMemo(() => extractFinancialInputs(governedData, biExtraction), [biExtraction, governedData]);
  const phases = useMemo(() => buildPlaybook(inputs, biExtraction), [inputs, biExtraction]);
  const [expanded, setExpanded] = useState(false);

  const totalActions = phases.reduce((s, p) => s + p.actions.length, 0);
  const cimActions = phases.reduce((s, p) => s + p.actions.filter(a => a.source === "cim").length, 0);

  if (totalActions === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(142, 71%, 45% / 0.12)" }}>
            <Calendar size={14} style={{ color: "hsl(142, 71%, 45%)" }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-foreground">90-Day Post-Close Playbook</h3>
            <p className="text-[10px] text-muted-foreground">{totalActions} actions · {cimActions} from your data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProvenanceBadge source={cimActions > 0 ? "cim" : "modeled"} />
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-4 space-y-4"
        >
          {phases.map((phase, pi) => (
            <div key={pi} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{phase.timeframe}</span>
                <span className="text-[11px] font-bold text-foreground">{phase.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">{phase.theme}</p>

              <div className="space-y-1.5">
                {phase.actions.map((action, ai) => {
                  const ps = PRIORITY_STYLE[action.priority];
                  return (
                    <div
                      key={ai}
                      className="rounded-lg p-3 flex items-start gap-2.5"
                      style={{ background: ps.bg, border: `1px solid ${ps.border}` }}
                    >
                      <action.icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: ps.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[11px] font-bold text-foreground">{action.action}</p>
                          <ProvenanceBadge source={action.source} />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{action.why}</p>
                      </div>
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: ps.color, background: `${ps.color}15` }}>
                        {ps.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
});
