/**
 * Strategic X-Ray — Interactive reasoning chain visualization
 *
 * Exposes the engine's reasoning: Evidence → Constraint → Driver →
 * Leverage → Opportunity → Strategic Move. Each node is clickable
 * to reveal underlying evidence and supports "Challenge" mode.
 */

import { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Search, Target, Brain,
  Lightbulb, TrendingUp, Route, X, Pencil, RotateCcw,
} from "lucide-react";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import { humanizeLabel } from "@/lib/humanize";

interface XRayNode {
  stage: string;
  label: string;
  description: string;
  icon: typeof Search;
  color: string;
  bgColor: string;
  insight: StrategicInsight | null;
  evidenceIds: string[];
}

interface StrategicXRayProps {
  narrative: StrategicNarrative | null;
  insights: StrategicInsight[];
  flatEvidence: Evidence[];
  onChallenge?: (nodeStage: string, currentValue: string) => void;
  onRecompute?: () => void;
}

const STAGE_CONFIG = [
  { stage: "evidence", label: "Evidence", icon: Search, color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted))" },
  { stage: "constraint", label: "Constraint", icon: Target, color: "hsl(var(--destructive))", bgColor: "hsl(var(--destructive) / 0.08)" },
  { stage: "driver", label: "Driver", icon: Brain, color: "hsl(var(--warning))", bgColor: "hsl(var(--warning) / 0.08)" },
  { stage: "leverage", label: "Leverage", icon: Lightbulb, color: "hsl(var(--primary))", bgColor: "hsl(var(--primary) / 0.08)" },
  { stage: "opportunity", label: "Opportunity", icon: TrendingUp, color: "hsl(var(--success))", bgColor: "hsl(var(--success) / 0.08)" },
  { stage: "move", label: "Strategic Move", icon: Route, color: "hsl(var(--primary))", bgColor: "hsl(var(--primary) / 0.12)" },
] as const;

function findTopInsight(insights: StrategicInsight[], type: string): StrategicInsight | null {
  return insights
    .filter(i => i.insightType === type)
    .sort((a, b) => b.impact - a.impact)[0] ?? null;
}

export const StrategicXRay = memo(function StrategicXRay({
  narrative,
  insights,
  flatEvidence,
  onChallenge,
  onRecompute,
}: StrategicXRayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [challengeNode, setChallengeNode] = useState<string | null>(null);
  const [challengeValue, setChallengeValue] = useState("");

  const topConstraint = useMemo(() => findTopInsight(insights, "constraint_cluster"), [insights]);
  const topDriver = useMemo(() => findTopInsight(insights, "driver"), [insights]);
  const topLeverage = useMemo(() => findTopInsight(insights, "leverage_point"), [insights]);
  const topOpp = useMemo(() => findTopInsight(insights, "emerging_opportunity"), [insights]);
  const topPathway = useMemo(() => findTopInsight(insights, "strategic_pathway"), [insights]);

  // Collect evidence IDs for the top constraint
  const constraintEvidenceIds = useMemo(() => {
    if (!topConstraint) return [];
    return topConstraint.evidenceIds || [];
  }, [topConstraint]);

  const nodes: XRayNode[] = useMemo(() => {
    const evidenceForConstraint = flatEvidence.filter(e =>
      constraintEvidenceIds.includes(e.id) ||
      e.type === "constraint" || e.type === "friction"
    ).slice(0, 6);

    return [
      {
        stage: "evidence",
        label: `${evidenceForConstraint.length} supporting signals`,
        description: evidenceForConstraint.map(e => humanizeLabel(e.label)).join("; ") || "No evidence collected yet",
        icon: Search,
        color: "hsl(var(--muted-foreground))",
        bgColor: "hsl(var(--muted))",
        insight: null,
        evidenceIds: evidenceForConstraint.map(e => e.id),
      },
      {
        stage: "constraint",
        label: narrative?.primaryConstraint || "Analyzing constraints…",
        description: topConstraint?.description || "Waiting for sufficient evidence to identify structural barriers.",
        icon: Target,
        color: "hsl(var(--destructive))",
        bgColor: "hsl(var(--destructive) / 0.08)",
        insight: topConstraint,
        evidenceIds: topConstraint?.evidenceIds || [],
      },
      {
        stage: "driver",
        label: narrative?.keyDriver || "Identifying root causes…",
        description: topDriver?.description || "The underlying driver will emerge as more signals are processed.",
        icon: Brain,
        color: "hsl(var(--warning))",
        bgColor: "hsl(var(--warning) / 0.08)",
        insight: topDriver,
        evidenceIds: topDriver?.evidenceIds || [],
      },
      {
        stage: "leverage",
        label: narrative?.leveragePoint || "Calculating intervention points…",
        description: topLeverage?.description || "Leverage points require constraint and driver identification.",
        icon: Lightbulb,
        color: "hsl(var(--primary))",
        bgColor: "hsl(var(--primary) / 0.08)",
        insight: topLeverage,
        evidenceIds: topLeverage?.evidenceIds || [],
      },
      {
        stage: "opportunity",
        label: narrative?.breakthroughOpportunity || "Generating opportunities…",
        description: topOpp?.description || "Opportunities derive from identified leverage points.",
        icon: TrendingUp,
        color: "hsl(var(--success))",
        bgColor: "hsl(var(--success) / 0.08)",
        insight: topOpp,
        evidenceIds: topOpp?.evidenceIds || [],
      },
      {
        stage: "move",
        label: narrative?.strategicVerdict || "Synthesizing strategic move…",
        description: narrative?.verdictRationale || "The full reasoning chain will converge into a directive once all stages have data.",
        icon: Route,
        color: "hsl(var(--primary))",
        bgColor: "hsl(var(--primary) / 0.12)",
        insight: topPathway,
        evidenceIds: topPathway?.evidenceIds || [],
      },
    ];
  }, [narrative, topConstraint, topDriver, topLeverage, topOpp, topPathway, flatEvidence, constraintEvidenceIds]);

  const handleNodeClick = useCallback((stage: string) => {
    setSelectedNode(prev => prev === stage ? null : stage);
    setChallengeNode(null);
  }, []);

  const handleChallenge = useCallback((stage: string, label: string) => {
    setChallengeNode(stage);
    setChallengeValue(label);
  }, []);

  const submitChallenge = useCallback(() => {
    if (challengeNode && challengeValue.trim()) {
      onChallenge?.(challengeNode, challengeValue.trim());
      setChallengeNode(null);
      setChallengeValue("");
      setSelectedNode(null);
    }
  }, [challengeNode, challengeValue, onChallenge]);

  const hasContent = narrative?.primaryConstraint || insights.length > 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-primary" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Strategic X-Ray
          </span>
          <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            Reasoning Chain
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && hasContent && (
            <span className="text-[10px] font-bold text-primary">
              See how the system reasoned →
            </span>
          )}
          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Reasoning Chain */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-0">
              {nodes.map((node, idx) => {
                const isSelected = selectedNode === node.stage;
                const isChallenging = challengeNode === node.stage;
                const NodeIcon = node.icon;
                const hasInsight = !!node.insight;
                const relatedEvidence = flatEvidence.filter(e => node.evidenceIds.includes(e.id));

                return (
                  <div key={node.stage}>
                    {/* Connector */}
                    {idx > 0 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-5" style={{ background: node.color + "40" }} />
                      </div>
                    )}

                    {/* Node */}
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="rounded-lg cursor-pointer transition-all"
                      style={{
                        background: isSelected ? node.bgColor : "transparent",
                        border: isSelected ? `1.5px solid ${node.color}30` : "1.5px solid transparent",
                      }}
                      onClick={() => handleNodeClick(node.stage)}
                    >
                      <div className="px-4 py-3 flex items-start gap-3">
                        {/* Stage indicator */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                          style={{ background: node.bgColor }}
                        >
                          <NodeIcon size={14} style={{ color: node.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: node.color }}>
                              {node.stage === "move" ? "Strategic Move" : node.stage}
                            </span>
                            {hasInsight && (
                              <span className="text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                {(node.insight?.confidence ?? 0) >= 0.7 ? "Strong evidence" : (node.insight?.confidence ?? 0) >= 0.4 ? "Moderate evidence" : "Early signal"}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm font-bold leading-snug ${hasInsight || node.stage === "evidence" ? "text-foreground" : "text-muted-foreground italic"}`}>
                            {node.label}
                          </p>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-2 space-y-2"
                            >
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {node.description}
                              </p>

                              {/* Evidence objects */}
                              {relatedEvidence.length > 0 && node.stage !== "evidence" && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Supporting Evidence ({relatedEvidence.length})
                                  </span>
                                  {relatedEvidence.slice(0, 4).map(ev => (
                                    <div key={ev.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
                                      <Search size={10} className="text-muted-foreground flex-shrink-0" />
                                      <span className="text-[11px] text-foreground truncate">{humanizeLabel(ev.label)}</span>
                                      <span className="text-[9px] text-muted-foreground flex-shrink-0 ml-auto">
                                        {ev.pipelineStep}
                                      </span>
                                    </div>
                                  ))}
                                  {relatedEvidence.length > 4 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{relatedEvidence.length - 4} more signals
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Evidence list for evidence node */}
                              {node.stage === "evidence" && flatEvidence.length > 0 && (
                                <div className="space-y-1">
                                  {flatEvidence.slice(0, 6).map(ev => (
                                    <div key={ev.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))" }} />
                                      <span className="text-[11px] text-foreground truncate">{humanizeLabel(ev.label)}</span>
                                      <span className="text-[9px] text-muted-foreground flex-shrink-0 ml-auto capitalize">
                                        {ev.type?.replace(/_/g, " ")}
                                      </span>
                                    </div>
                                  ))}
                                  {flatEvidence.length > 6 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{flatEvidence.length - 6} more signals in dataset
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Challenge button */}
                              {hasInsight && node.stage !== "evidence" && node.stage !== "move" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChallenge(node.stage, node.label);
                                  }}
                                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-colors hover:bg-muted"
                                  style={{ color: node.color }}
                                >
                                  <Pencil size={10} />
                                  Challenge this assumption
                                </button>
                              )}

                              {/* Challenge input */}
                              {isChallenging && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="space-y-2 pt-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <p className="text-[10px] font-bold text-muted-foreground">
                                    What if this assumption is wrong? Edit and the system will recompute:
                                  </p>
                                  <textarea
                                    value={challengeValue}
                                    onChange={(e) => setChallengeValue(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md text-xs bg-background border border-border text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={submitChallenge}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-bold bg-primary text-primary-foreground hover:opacity-90"
                                    >
                                      <RotateCcw size={10} /> Recompute with change
                                    </button>
                                    <button
                                      onClick={() => setChallengeNode(null)}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-bold text-muted-foreground hover:bg-muted"
                                    >
                                      <X size={10} /> Cancel
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {/* Expand indicator */}
                        <div className="flex-shrink-0 mt-1">
                          {isSelected
                            ? <ChevronUp size={12} className="text-muted-foreground" />
                            : <ChevronDown size={12} className="text-muted-foreground" />
                          }
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
