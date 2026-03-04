import { useState } from "react";
import { Zap, Brain, Sparkles, Swords, Presentation, ChevronRight, X, Building2, Calculator, Calendar } from "lucide-react";

interface EvolutionNode {
  key: string;
  label: string;
  icon: typeof Zap;
  color: string;
  completed: boolean;
  summary?: string;
}

interface EvolutionViewProps {
  analysisData: Record<string, unknown> | null;
  productName?: string;
  accentColor?: string;
  analysisType?: string;
}

function getSummary(data: Record<string, unknown> | null, key: string): string | undefined {
  if (!data) return undefined;
  const step = data[key] as Record<string, unknown> | undefined;
  if (!step) return undefined;

  if (key === "disrupt") {
    const ideas = (step as any)?.flippedIdeas || (step as any)?.ideas;
    if (Array.isArray(ideas)) return `${ideas.length} disruption concepts generated`;
    return "Assumptions challenged";
  }
  if (key === "redesign") {
    const name = (step as any)?.concept || (step as any)?.name;
    if (typeof name === "string") return name;
    return "Concept redesigned";
  }
  if (key === "stressTest") {
    const risks = (step as any)?.risks;
    if (Array.isArray(risks)) {
      const high = risks.filter((r: any) => r.severity === "high").length;
      return `${risks.length} risks (${high} critical)`;
    }
    return "Validated under pressure";
  }
  if (key === "pitchDeck") {
    const pitch = (step as any)?.elevatorPitch;
    if (typeof pitch === "string") return pitch.slice(0, 100) + (pitch.length > 100 ? "…" : "");
    return "Investor deck ready";
  }
  return undefined;
}

export function EvolutionView({ analysisData, productName, accentColor = "hsl(var(--primary))", analysisType }: EvolutionViewProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const isBusinessModel = analysisType === "business_model";

  const productNodes: EvolutionNode[] = [
    {
      key: "original",
      label: "Original Idea",
      icon: Zap,
      color: accentColor,
      completed: true,
      summary: productName || "Analysis started",
    },
    {
      key: "disrupt",
      label: "Deconstruct",
      icon: Brain,
      color: accentColor,
      completed: !!(analysisData?.disrupt || analysisData?.firstPrinciples),
      summary: getSummary(analysisData, "disrupt"),
    },
    {
      key: "redesign",
      label: "Redesign",
      icon: Sparkles,
      color: accentColor,
      completed: !!(analysisData?.redesign || (analysisData?.disrupt as any)?.redesignedConcept || analysisData?.productVisuals),
      summary: getSummary(analysisData, "redesign"),
    },
    {
      key: "stressTest",
      label: "Stress Test",
      icon: Swords,
      color: accentColor,
      completed: !!(analysisData?.stressTest || analysisData?.criticalValidation),
      summary: getSummary(analysisData, "stressTest"),
    },
    {
      key: "pitchDeck",
      label: "Pitch",
      icon: Presentation,
      color: accentColor,
      completed: !!(analysisData?.pitchDeck || analysisData?.pitch),
      summary: getSummary(analysisData, "pitchDeck"),
    },
  ];

  const businessNodes: EvolutionNode[] = [
    {
      key: "original",
      label: "Business",
      icon: Building2,
      color: accentColor,
      completed: true,
      summary: productName || "Business analyzed",
    },
    {
      key: "operations",
      label: "Operations",
      icon: Brain,
      color: accentColor,
      completed: !!(analysisData?.operationalAudit),
      summary: analysisData?.operationalAudit ? "Operations audited" : undefined,
    },
    {
      key: "dealEconomics",
      label: "Deal Math",
      icon: Calculator,
      color: accentColor,
      completed: !!(analysisData?.ownerDependencyAssessment),
      summary: analysisData?.ownerDependencyAssessment ? `Risk: ${(analysisData.ownerDependencyAssessment as any)?.transitionRiskScore}/10` : undefined,
    },
    {
      key: "playbook",
      label: "Playbook",
      icon: Calendar,
      color: accentColor,
      completed: !!(analysisData?.ownershipPlaybook),
      summary: analysisData?.ownershipPlaybook ? "100-day plan ready" : undefined,
    },
    {
      key: "reinvented",
      label: "Reinvented",
      icon: Sparkles,
      color: accentColor,
      completed: !!(analysisData?.reinventedModel),
      summary: (analysisData?.reinventedModel as any)?.modelName || undefined,
    },
  ];

  const nodes = isBusinessModel ? businessNodes : productNodes;

  return (
    <div className="space-y-3">
      {/* Horizontal pipeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const Icon = node.icon;
          const isLast = i === nodes.length - 1;
          const isExpanded = expandedNode === node.key;

          return (
            <div key={node.key} className="flex items-center flex-shrink-0">
              <button
                onClick={() => node.completed ? setExpandedNode(isExpanded ? null : node.key) : undefined}
                className="flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg transition-all"
                style={{
                  background: isExpanded ? `${node.color}14` : "transparent",
                  border: isExpanded ? `1.5px solid ${node.color}40` : "1.5px solid transparent",
                  cursor: node.completed ? "pointer" : "default",
                  opacity: node.completed ? 1 : 0.4,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: node.completed ? node.color : "hsl(var(--muted))",
                  }}
                >
                  <Icon size={14} style={{ color: node.completed ? "white" : "hsl(var(--muted-foreground))" }} />
                </div>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: node.completed ? node.color : "hsl(var(--muted-foreground))" }}
                >
                  {node.label}
                </span>
              </button>

              {!isLast && (
                <ChevronRight
                  size={14}
                  className="flex-shrink-0 mx-0.5"
                  style={{
                    color: nodes[i + 1]?.completed ? nodes[i + 1].color : "hsl(var(--border))",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded summary card */}
      {expandedNode && (() => {
        const node = nodes.find(n => n.key === expandedNode);
        if (!node || !node.summary) return null;
        return (
          <div
            className="p-3 rounded-lg relative"
            style={{
              background: `${node.color}08`,
              border: `1px solid ${node.color}25`,
            }}
          >
            <button
              onClick={() => setExpandedNode(null)}
              className="absolute top-2 right-2 p-0.5 rounded hover:bg-muted"
            >
              <X size={12} className="text-muted-foreground" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: node.color }}>
              {node.label}
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed pr-6">{node.summary}</p>
          </div>
        );
      })()}
    </div>
  );
}
