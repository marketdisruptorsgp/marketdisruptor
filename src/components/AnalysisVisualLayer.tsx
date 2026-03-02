import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { StructuralVisualList, StructuralVisual } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { resolveAdaptiveVisuals } from "@/lib/adaptiveVisualEngine";
import type { AdaptiveVisualResult } from "@/lib/adaptiveVisualEngine";
import type { VisualSpec, ActionPlan } from "@/lib/visualContract";
import { enforceVisualContract } from "@/lib/visualContract";
import { ChevronRight, Layers, Cpu, Target, Eye } from "lucide-react";

// Re-export for backward compatibility
export { enforceVisualContract } from "@/lib/visualContract";
export type { VisualSpec, ActionPlan } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════
   UNIVERSAL VISUAL INTELLIGENCE LAYER
   Premium cinematic rendering with progressive disclosure.
   Visual structure is the output. Text is optional depth.
   
   RENDER ORDER (fixed):
   1) Structural Insight Visual (canonical system model)
   2) Domain Intelligence Panels (ontology specs)
   3) Action Levers (action plans)
   4) Collapsed Text Depth ("Deep Insight")
   ═══════════════════════════════════════════════════════════ */

const TIER_CONFIG = {
  STRUCTURAL_MODEL: { icon: Cpu, label: "Structural Model", color: "hsl(var(--vi-glow-system))" },
  INSIGHT_MAP: { icon: Eye, label: "Insight Map", color: "hsl(var(--vi-glow-leverage))" },
  INTELLIGENCE_SURFACE: { icon: Layers, label: "Intelligence Surface", color: "hsl(var(--muted-foreground))" },
};

function TierIndicator({ tier }: { tier: AdaptiveVisualResult["tier"] }) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${config.color}12` }}>
        <Icon size={11} style={{ color: config.color }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}

function OntologyPanel({ spec }: { spec: VisualSpec }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--vi-surface-elevated))",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-vi-panel)",
      }}
    >
      {spec.title && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            {spec.title}
          </span>
        </div>
      )}
      <div className="px-3 pb-3">
        <StructuralVisual spec={spec} />
      </div>
    </motion.div>
  );
}

function MultiPanelDashboard({ specs }: { specs: VisualSpec[] }) {
  if (specs.length === 0) return null;
  if (specs.length === 1) return <OntologyPanel spec={specs[0]} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {specs.map((spec, i) => (
        <OntologyPanel key={`ontology-${i}`} spec={spec} />
      ))}
    </div>
  );
}

export function AnalysisVisualLayer({
  analysis,
  children,
  suppressText = true,
}: {
  analysis: Record<string, unknown>;
  children: ReactNode;
  suppressText?: boolean;
}) {
  const result = resolveAdaptiveVisuals(analysis);

  const hasCanonical = !!result.canonicalSpec;
  const hasOntologyPanels = result.ontologySpecs.length > 0;
  const hasSurface = result.surfaceSpecs.length > 0;
  const hasVisuals = hasCanonical || hasOntologyPanels || hasSurface;

  return (
    <div className="space-y-5">
      {/* Tier indicator */}
      {hasVisuals && <TierIndicator tier={result.tier} />}

      {/* 1️⃣ STRUCTURAL INSIGHT VISUAL — always first (canonical system model) */}
      {hasCanonical && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <StructuralVisualList specs={[result.canonicalSpec!]} />
        </motion.div>
      )}

      {/* 1b SURFACE / INSIGHT FALLBACK when no canonical */}
      {hasSurface && !hasCanonical && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <MultiPanelDashboard specs={result.surfaceSpecs} />
        </motion.div>
      )}

      {/* 2️⃣ DOMAIN INTELLIGENCE PANELS */}
      {hasOntologyPanels && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <MultiPanelDashboard specs={result.ontologySpecs} />
        </motion.div>
      )}

      {/* 3️⃣ ACTION LEVERS */}
      {result.actionPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <ActionPlanList plans={result.actionPlans} />
        </motion.div>
      )}

      {/* 4️⃣ COLLAPSED TEXT DEPTH — "Deep Insight" */}
      {suppressText && hasVisuals ? (
        <details className="group mt-2">
          <summary className="cursor-pointer select-none inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-muted-foreground/70 transition-all hover:text-foreground hover:bg-muted/50"
            style={{ border: "1px solid transparent" }}
          >
            <ChevronRight size={11} className="transition-transform duration-200 group-open:rotate-90" />
            Deep Insight
            <span className="text-[9px] font-normal opacity-60">Full analysis text</span>
          </summary>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 space-y-4 pl-4"
            style={{ borderLeft: "2px solid hsl(var(--border) / 0.4)" }}
          >
            {children}
          </motion.div>
        </details>
      ) : (
        children
      )}
    </div>
  );
}
