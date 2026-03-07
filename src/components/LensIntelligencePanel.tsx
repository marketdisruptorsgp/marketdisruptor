/**
 * LENS INTELLIGENCE PANEL
 *
 * Dynamic panel that auto-populates with intelligence tools
 * relevant to the active analysis lens. Tools open interactive
 * calculators in a right-side drawer.
 */

import { memo, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronRight, X, Sparkles } from "lucide-react";
import {
  getToolsForLenses,
  getToolById,
  inferLensesFromMode,
  type LensId,
  type LensTool,
} from "@/lib/lensToolkitRegistry";
import type { Insight } from "@/lib/insightLayer";
import type { ToolScenario } from "@/lib/scenarioEngine";
import { SBALoanCalculator } from "@/components/tools/SBALoanCalculator";
import { DealStructureSimulator } from "@/components/tools/DealStructureSimulator";
import { TAMCalculator } from "@/components/tools/TAMCalculator";
import { RevenueModelSimulator } from "@/components/tools/RevenueModelSimulator";
import { ValueChainAnalyzer } from "@/components/tools/ValueChainAnalyzer";
import { AcquisitionROIModel } from "@/components/tools/AcquisitionROIModel";
import { CashFlowQualityAnalyzer } from "@/components/tools/CashFlowQualityAnalyzer";
import { UnitEconomicsModel } from "@/components/tools/UnitEconomicsModel";
import { CompetitiveMoatAnalyzer } from "@/components/tools/CompetitiveMoatAnalyzer";
import { SellerMotivationScanner } from "@/components/tools/SellerMotivationScanner";
import { DealRiskScanner } from "@/components/tools/DealRiskScanner";
import { IndustryFragmentationDetector } from "@/components/tools/IndustryFragmentationDetector";
import { DSCRCalculator } from "@/components/tools/DSCRCalculator";
import { InnovationPathwayMapper } from "@/components/tools/InnovationPathwayMapper";
import { AssumptionStressTester } from "@/components/tools/AssumptionStressTester";

/* ── Compact Tool Card (grid-optimized) ── */
function ToolCard({
  tool, recommended, onOpen,
}: {
  tool: LensTool; recommended?: boolean; onOpen: (tool: LensTool) => void;
}) {
  const Icon = tool.icon;
  return (
    <button onClick={() => onOpen(tool)}
      className="text-left rounded-lg p-3 border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.99]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${tool.accentColor}12` }}>
          <Icon size={14} style={{ color: tool.accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground leading-snug truncate">{tool.title}</p>
          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">{tool.description}</p>
        </div>
        {recommended && <Sparkles size={10} className="text-primary flex-shrink-0" />}
        <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}

/* ── Interactive Tool Content ── */
function InteractiveToolContent({ tool, analysisId, onScenarioSaved }: {
  tool: LensTool; analysisId: string; onScenarioSaved?: (s: ToolScenario) => void;
}) {
  switch (tool.id) {
    case "sba-loan-calculator":
      return <SBALoanCalculator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "deal-structure-simulator":
      return <DealStructureSimulator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "tam-calculator":
      return <TAMCalculator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "revenue-model-simulator":
      return <RevenueModelSimulator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "value-chain-analyzer":
      return <ValueChainAnalyzer analysisId={analysisId} />;
    case "acquisition-roi-model":
      return <AcquisitionROIModel analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "cash-flow-quality":
      return <CashFlowQualityAnalyzer analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "unit-economics-model":
      return <UnitEconomicsModel analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "competitive-moat-analyzer":
      return <CompetitiveMoatAnalyzer analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "seller-motivation-signals":
      return <SellerMotivationScanner analysisId={analysisId} />;
    case "deal-risk-scanner":
      return <DealRiskScanner analysisId={analysisId} />;
    case "industry-fragmentation-detector":
      return <IndustryFragmentationDetector analysisId={analysisId} />;
    case "dscr-calculator":
      return <DSCRCalculator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "innovation-pathway-mapper":
      return <InnovationPathwayMapper analysisId={analysisId} />;
    case "assumption-stress-tester":
      return <AssumptionStressTester analysisId={analysisId} />;
    default:
      return (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-muted mb-3">
            <tool.icon size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Interactive {tool.interactionType}</p>
          <p className="text-xs text-muted-foreground mt-1">Full {tool.title.toLowerCase()} module coming soon.</p>
        </div>
      );
  }
}

/* ── Tool Drawer ── */
function ToolDrawer({ tool, analysisId, onClose, onScenarioSaved }: {
  tool: LensTool; analysisId: string; onClose: () => void; onScenarioSaved?: (s: ToolScenario) => void;
}) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-[420px] max-w-full z-50 border-l border-border bg-background shadow-2xl flex flex-col"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tool.accentColor}12` }}>
          <Icon size={18} style={{ color: tool.accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-foreground">{tool.title}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {tool.category.replace("_", " ")} · {tool.interactionType}
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <InteractiveToolContent tool={tool} analysisId={analysisId} onScenarioSaved={onScenarioSaved} />
      </div>
    </motion.div>
  );
}

/* ── Main Panel ── */
interface LensIntelligencePanelProps {
  analysisMode: string;
  signalKeywords?: string[];
  activeLenses?: LensId[];
  analysisId?: string;
  /** Reasoning-driven tool recommendations from insights */
  recommendedToolIds?: string[];
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

export const LensIntelligencePanel = memo(function LensIntelligencePanel({
  analysisMode, signalKeywords = [], activeLenses: overrideLenses,
  analysisId = "", recommendedToolIds = [], onScenarioSaved,
}: LensIntelligencePanelProps) {
  const [openTool, setOpenTool] = useState<LensTool | null>(null);

  const lenses = useMemo(() => overrideLenses ?? inferLensesFromMode(analysisMode), [analysisMode, overrideLenses]);
  const tools = useMemo(() => getToolsForLenses(lenses), [lenses]);

  // Reasoning-driven recommendations (from insight layer)
  const reasoningRecommended = useMemo(() => new Set(recommendedToolIds), [recommendedToolIds]);

  // Sort: reasoning-recommended first, then alphabetical
  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => {
      const aRec = reasoningRecommended.has(a.id) ? 0 : 1;
      const bRec = reasoningRecommended.has(b.id) ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;
      return a.title.localeCompare(b.title);
    });
  }, [tools, reasoningRecommended]);

  if (tools.length === 0) return null;

  const lensLabel = lenses.map(l => l.toUpperCase().replace("_", " ")).join(" · ");
  const recCount = sortedTools.filter(t => reasoningRecommended.has(t.id)).length;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
              <Compass size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Lens Intelligence</p>
              <p className="text-[9px] font-bold text-muted-foreground mt-0.5">{lensLabel} · {tools.length} tools</p>
            </div>
          </div>
        </div>

        {recCount > 0 && (
          <div className="px-5 py-3 border-b border-border bg-primary/[0.03]">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
              <Sparkles size={9} /> Reasoning Recommendations ({recCount})
            </p>
            <div className="space-y-2">
              {sortedTools.filter(t => reasoningRecommended.has(t.id)).slice(0, 3).map(tool => (
                <button key={tool.id} onClick={() => setOpenTool(tool)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <tool.icon size={12} style={{ color: tool.accentColor }} />
                  <span className="text-[11px] font-bold text-foreground flex-1">{tool.title}</span>
                  <span className="text-[9px] text-muted-foreground">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedTools.map(tool => (
            <ToolCard key={tool.id} tool={tool}
              recommended={reasoningRecommended.has(tool.id)}
              onOpen={setOpenTool} />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {openTool && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpenTool(null)} />
            <ToolDrawer key="drawer" tool={openTool} analysisId={analysisId}
              onClose={() => setOpenTool(null)} onScenarioSaved={onScenarioSaved} />
          </>
        )}
      </AnimatePresence>
    </>
  );
});
