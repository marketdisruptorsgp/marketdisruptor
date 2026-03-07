/**
 * TransformationPaths — Strategic Playbook Comparison Panel
 *
 * Surfaces up to 3 constraint-triggered transformation paths
 * with side-by-side scoring and progressive disclosure.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Route, Sparkles } from "lucide-react";
import type { Evidence, EvidenceMode } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";
import { generatePlaybooks } from "@/lib/playbookEngine";
import { PlaybookCard } from "./PlaybookCard";

interface TransformationPathsProps {
  evidence: Evidence[];
  insights: StrategicInsight[];
  narrative: StrategicNarrative | null;
  mode: "product" | "service" | "business";
}

export const TransformationPaths = memo(function TransformationPaths({
  evidence,
  insights,
  narrative,
  mode,
}: TransformationPathsProps) {
  const evidenceMode: EvidenceMode = mode === "business" ? "business_model" : mode;

  const playbooks = useMemo(
    () => generatePlaybooks(evidence, insights, narrative, evidenceMode),
    [evidence, insights, narrative, evidenceMode],
  );

  if (playbooks.length === 0) {
    return (
      <div
        className="rounded-xl px-5 py-6 text-center"
        style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
      >
        <Route size={20} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-bold text-muted-foreground">
          Transformation Paths will appear once the analysis detects enough structural patterns.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Run more pipeline steps to generate strategic playbooks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles size={16} className="text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
            Transformation Paths
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {playbooks.length} strategic moves detected from your analysis — each triggered by structural constraints.
          </p>
        </div>
      </div>

      {/* Playbook Cards */}
      <div className="space-y-4">
        {playbooks.map((pb, idx) => (
          <PlaybookCard key={pb.id} playbook={pb} rank={idx} />
        ))}
      </div>
    </div>
  );
});
