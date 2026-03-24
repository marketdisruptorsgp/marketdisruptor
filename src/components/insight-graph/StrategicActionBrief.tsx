/**
 * Strategic Action Brief — "What should I do, in what order, and why?"
 * Replaces the graph/node visualization with a decision-ready brief.
 */

import { memo, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingUp, ChevronDown, ArrowRight, GitBranch, Grid2x2, Map, Network } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { OPPORTUNITY_NODE_TYPES, getInsightChain } from "@/lib/insightGraph";
import { CytoscapeReasoningMap } from "./CytoscapeReasoningMap";
import { OpportunityMatrix } from "./OpportunityMatrix";
import { ConstraintMap } from "./ConstraintMap";
import { PrimaryBlockerCallout } from "./PrimaryBlockerCallout";

// ═══════════════════════════════════════════════════════════════
//  TYPES & CONFIG
// ═══════════════════════════════════════════════════════════════

type UserRole = "buyer" | "founder" | "investor";

interface StrategicActionBriefProps {
  graph: InsightGraph;
  activeMode?: string;
  entityName?: string;
}

const ROLE_OPTIONS: { id: UserRole; label: string }[] = [
  { id: "buyer", label: "Buyer" },
  { id: "founder", label: "Founder" },
  { id: "investor", label: "Investor" },
];

function modeToDefaultRole(mode?: string): UserRole {
  if (mode === "business") return "buyer";
  if (mode === "service") return "investor";
  if (mode === "custom" || mode === "product") return "buyer";
  return "founder";
}

function isProductMode(mode?: string): boolean {
  return mode === "custom" || mode === "product";
}

function getActionPrefix(mode: string | undefined, role: UserRole): string {
  if (isProductMode(mode)) return "Priority:";
  return `As a ${role}:`;
}

// ═══════════════════════════════════════════════════════════════
//  ROLE-SPECIFIC ACTION LINES
// ═══════════════════════════════════════════════════════════════

function getConstraintAction(node: InsightGraphNode, role: UserRole): string {
  const name = node.label.toLowerCase();
  const templates: Record<UserRole, string[]> = {
    buyer: [
      `Negotiate a price reduction based on the cost to fix "${node.label}".`,
      `Build a 90-day remediation plan for "${node.label}" before closing.`,
      `Factor "${node.label}" into your post-acquisition budget — this will need investment.`,
    ],
    founder: [
      `Fix "${node.label}" before it limits your next stage of growth.`,
      `Hire or partner to close the gap on "${node.label}" — this is holding you back.`,
      `Stop working around "${node.label}" and address it directly this quarter.`,
    ],
    investor: [
      `Factor "${node.label}" into your valuation — it's a real cost to fix.`,
      `Require a remediation plan for "${node.label}" as a condition of investment.`,
      `"${node.label}" is a risk — make sure the team has a credible plan to address it.`,
    ],
  };
  const idx = Math.abs(hashStr(node.id)) % templates[role].length;
  return templates[role][idx];
}

function getLeverAction(node: InsightGraphNode, role: UserRole): string {
  const templates: Record<UserRole, string[]> = {
    buyer: [
      `This is your Day 1 value creation play — "${node.label}" can be activated immediately.`,
      `"${node.label}" is the fastest path to ROI after closing. Prioritize it.`,
      `Build your integration plan around "${node.label}" — it's the highest-leverage move.`,
    ],
    founder: [
      `Double down on "${node.label}" — it's your competitive edge.`,
      `"${node.label}" is what makes you hard to copy. Invest more here.`,
      `Make "${node.label}" the centerpiece of your next funding pitch.`,
    ],
    investor: [
      `This is the thesis — "${node.label}" is what makes this opportunity work.`,
      `"${node.label}" is the moat. Fund it and protect it.`,
      `"${node.label}" is the value driver — make sure the team is focused on it.`,
    ],
  };
  const idx = Math.abs(hashStr(node.id)) % templates[role].length;
  return templates[role][idx];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ═══════════════════════════════════════════════════════════════
//  TIMING BADGES
// ═══════════════════════════════════════════════════════════════

function getTimingBadge(node: InsightGraphNode, role: UserRole, isConstraint: boolean): { label: string; color: string } {
  if (node.confidence === "low") return { label: "Validate first", color: "hsl(var(--muted-foreground))" };
  if (isConstraint && node.impact > 0.7) {
    return role === "buyer"
      ? { label: "Before close", color: "hsl(0 72% 52%)" }
      : { label: "This quarter", color: "hsl(0 72% 52%)" };
  }
  if ((node.feasibilityScore ?? 0) > 0.6) return { label: "Month 1", color: "hsl(199 89% 48%)" };
  return { label: "Year 1", color: "hsl(152 60% 44%)" };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const StrategicActionBrief = memo(function StrategicActionBrief({
  graph,
  activeMode,
  entityName,
}: StrategicActionBriefProps) {
  const [role, setRole] = useState<UserRole>(modeToDefaultRole(activeMode));
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [explorationTab, setExplorationTab] = useState<"reasoning" | "opportunity" | "constraints" | null>(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  // Derive top constraints
  const topConstraints = useMemo(() => {
    return graph.nodes
      .filter(n => n.type === "constraint" || n.type === "friction" || n.type === "risk")
      .sort((a, b) => (b.impact * b.influence) - (a.impact * a.influence))
      .slice(0, 3);
  }, [graph.nodes]);

  // Derive top levers/opportunities
  const topLevers = useMemo(() => {
    return graph.nodes
      .filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type) || n.type === "leverage_point" || n.type === "driver")
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);
  }, [graph.nodes]);

  // Build verdict from topNodes
  const verdict = useMemo(() => {
    const c = graph.topNodes.primaryConstraint;
    const o = graph.topNodes.breakthroughOpportunity;
    const name = entityName || "This business";

    const constraintPart = c
      ? `but is constrained by ${c.label.toLowerCase()}`
      : "with no critical blockers identified";
    const opportunityPart = o
      ? `The biggest upside is ${o.label.toLowerCase()}.`
      : "Further analysis may reveal additional opportunities.";

    const driver = graph.topNodes.keyDriver;
    const driverPart = driver
      ? `${name} has strength in ${driver.label.toLowerCase()}`
      : `${name} has a viable foundation`;

    return `${driverPart}, ${constraintPart}. ${opportunityPart}`;
  }, [graph.topNodes, entityName]);

  // Build action plan — ordered items from constraints + levers
  const actionPlan = useMemo(() => {
    const items: { label: string; timing: { label: string; color: string }; source: string }[] = [];

    // Urgent constraints first
    topConstraints.forEach(n => {
      if (n.impact > 0.5) {
        items.push({
          label: `Address "${n.label}" — ${getNodeSummary(n)}`,
          timing: getTimingBadge(n, role, true),
          source: "blocker",
        });
      }
    });

    // Then quick-win levers
    topLevers.forEach(n => {
      items.push({
        label: `Activate "${n.label}" — ${getNodeSummary(n)}`,
        timing: getTimingBadge(n, role, false),
        source: "lever",
      });
    });

    // Add remaining constraints
    topConstraints.forEach(n => {
      if (n.impact <= 0.5) {
        items.push({
          label: `Monitor "${n.label}" — ${getNodeSummary(n)}`,
          timing: getTimingBadge(n, role, true),
          source: "blocker",
        });
      }
    });

    return items.slice(0, 5);
  }, [topConstraints, topLevers, role]);

  // Build reasoning chains for collapsible
  const reasoningChains = useMemo(() => {
    const keyNodes = [...topConstraints.slice(0, 2), ...topLevers.slice(0, 2)];
    return keyNodes.map(node => {
      const chain = getInsightChain(graph, node.id);
      return {
        conclusion: node.label,
        steps: chain.map(n => ({ label: n.label, type: n.type })),
      };
    }).filter(c => c.steps.length > 1);
  }, [graph, topConstraints, topLevers]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-muted border border-border gap-3">
        <p className="text-sm text-muted-foreground">Run the analysis to generate the strategic brief.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
      {/* User context toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Reading as:</span>
        {ROLE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setRole(opt.id)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-[32px]"
            style={{
              background: role === opt.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
              color: role === opt.id ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              border: role === opt.id ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Section 1 — The Verdict */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <p className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
          {verdict}
        </p>
      </motion.section>

      {/* Section 2 — What's Blocking the Value */}
      {topConstraints.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-destructive" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">What's Blocking the Value</h2>
          </div>
          <div className="flex flex-col gap-3">
            {topConstraints.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="rounded-xl bg-card border border-border p-4"
                style={{ borderLeft: "4px solid hsl(0 72% 52%)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-[13px] font-bold text-foreground leading-snug">{node.label}</h3>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 whitespace-nowrap" style={{ color: "hsl(0 72% 52%)", borderColor: "hsl(0 72% 52% / 0.3)" }}>
                    Impact {Math.round((node.impact / 10) * 100)}%
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {getNodeBody(node)}
                </p>
                <p className="text-[11px] font-semibold text-foreground leading-relaxed" style={{ color: "hsl(var(--primary))" }}>
                  {getActionPrefix(activeMode, role)} {getConstraintAction(node, role)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Section 3 — Where the Upside Is */}
      {topLevers.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Where the Upside Is</h2>
          </div>
          <div className="flex flex-col gap-3">
            {topLevers.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="rounded-xl bg-card border border-border p-4"
                style={{ borderLeft: "4px solid hsl(152 60% 44%)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-[13px] font-bold text-foreground leading-snug">{node.label}</h3>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 whitespace-nowrap" style={{ color: "hsl(152 60% 44%)", borderColor: "hsl(152 60% 44% / 0.3)" }}>
                    Impact {Math.round((node.impact / 10) * 100)}%
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {getNodeBody(node)}
                </p>
                <p className="text-[11px] font-semibold leading-relaxed" style={{ color: "hsl(152 60% 44%)" }}>
                  {getActionPrefix(activeMode, role)} {getLeverAction(node, role)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Section 4 — What to Do in Order */}
      {actionPlan.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">What to Do in Order</h2>
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {actionPlan.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{
                    background: item.source === "blocker" ? "hsl(0 72% 52% / 0.12)" : "hsl(152 60% 44% / 0.12)",
                    color: item.source === "blocker" ? "hsl(0 72% 52%)" : "hsl(152 60% 44%)",
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground leading-snug">{item.label}</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] flex-shrink-0 whitespace-nowrap"
                  style={{ color: item.timing.color, borderColor: `${item.timing.color}40` }}
                >
                  {item.timing.label}
                </Badge>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Explore the Data — tabbed graph views */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Explore the Data</h2>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {([
            { id: "reasoning" as const, label: "Reasoning Map", icon: Network },
            { id: "opportunity" as const, label: "Opportunity Matrix", icon: Grid2x2 },
            { id: "constraints" as const, label: "Constraint Map", icon: Map },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setExplorationTab(prev => prev === tab.id ? null : tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[36px] flex-shrink-0"
              style={{
                background: explorationTab === tab.id ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                color: explorationTab === tab.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: explorationTab === tab.id ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Graph panels */}
        {explorationTab === "reasoning" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ height: "500px" }}>
            <CytoscapeReasoningMap
              graph={graph}
              onSelectNode={setSelectedGraphNodeId}
              selectedNodeId={selectedGraphNodeId}
            />
          </div>
        )}

        {explorationTab === "opportunity" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <OpportunityMatrix graph={graph} onSelectNode={setSelectedGraphNodeId} />
          </div>
        )}

        {explorationTab === "constraints" && (
          <div className="flex flex-col gap-2">
            <PrimaryBlockerCallout graph={graph} />
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <ConstraintMap graph={graph} onSelectNode={setSelectedGraphNodeId} />
            </div>
          </div>
        )}
      </motion.section>

      {/* Collapsible — How we reasoned */}
      {reasoningChains.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <Collapsible open={reasoningOpen} onOpenChange={setReasoningOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full py-2">
              <ChevronDown
                size={14}
                className="transition-transform"
                style={{ transform: reasoningOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
              How we reasoned
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col gap-3 pt-2">
                {reasoningChains.map((chain, i) => (
                  <div key={i} className="rounded-lg bg-muted/50 border border-border p-3">
                    <p className="text-[11px] font-semibold text-foreground mb-2">{chain.conclusion}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      {chain.steps.map((step, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: "hsl(var(--muted))",
                              color: "hsl(var(--muted-foreground))",
                              border: "1px solid hsl(var(--border))",
                            }}
                          >
                            {step.label.length > 40 ? step.label.slice(0, 40) + "…" : step.label}
                          </span>
                          {j < chain.steps.length - 1 && (
                            <ArrowRight size={10} className="text-muted-foreground flex-shrink-0" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.section>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function getNodeBody(node: InsightGraphNode): string {
  const text = node.detail || node.reasoning || "";
  if (!text) return node.label;
  // Take first two sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length >= 2) return sentences.slice(0, 2).join(" ").trim();
  if (sentences && sentences.length === 1) return sentences[0].trim();
  return text.length > 200 ? text.slice(0, 197) + "…" : text;
}

function getNodeSummary(node: InsightGraphNode): string {
  const text = node.detail || node.reasoning || node.label;
  const first = text.match(/[^.!?]+[.!?]+/);
  if (first) {
    const s = first[0].trim();
    return s.length > 80 ? s.slice(0, 77) + "…" : s;
  }
  return text.length > 80 ? text.slice(0, 77) + "…" : text;
}
