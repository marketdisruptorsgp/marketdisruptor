/**
 * SIMULATION PANEL — Right-side persistent workspace
 * 
 * Tabs: Tool | Scenarios | Evidence Impact
 * Opens tools inline, shows scenario history, tracks evidence feedback.
 */

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FlaskConical, History, Activity, ChevronRight, Trash2, BarChart3, Sparkles } from "lucide-react";
import { type LensTool, getToolById } from "@/lib/lensToolkitRegistry";
import { type ToolScenario, getScenarios, deleteScenario, scenarioToEvidence } from "@/lib/scenarioEngine";
import { SBALoanCalculator } from "@/components/tools/SBALoanCalculator";
import { DealStructureSimulator } from "@/components/tools/DealStructureSimulator";
import { TAMCalculator } from "@/components/tools/TAMCalculator";

type PanelTab = "tool" | "scenarios" | "impact";

function ToolContent({ tool, analysisId, onScenarioSaved }: {
  tool: LensTool; analysisId: string; onScenarioSaved?: (s: ToolScenario) => void;
}) {
  switch (tool.id) {
    case "sba-loan-calculator":
      return <SBALoanCalculator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "deal-structure-simulator":
      return <DealStructureSimulator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    case "tam-calculator":
      return <TAMCalculator analysisId={analysisId} onScenarioSaved={onScenarioSaved} />;
    default:
      return (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-muted mb-3">
            <tool.icon size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">{tool.title}</p>
          <p className="text-xs text-muted-foreground mt-1">Interactive module coming soon.</p>
        </div>
      );
  }
}

function ScenarioCard({ scenario, onDelete }: {
  scenario: ToolScenario; onDelete: () => void;
}) {
  const impactColor = scenario.strategicImpact === "high" ? "hsl(152 60% 44%)"
    : scenario.strategicImpact === "medium" ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";

  const outputs = Object.entries(scenario.outputResults).slice(0, 3);

  return (
    <div className="rounded-xl p-4 border border-border bg-card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{scenario.scenarioName}</p>
          <p className="text-[10px] text-muted-foreground">{scenario.toolId.replace(/-/g, " ")} · {new Date(scenario.timestamp).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
            style={{ background: `${impactColor}15`, color: impactColor }}>
            {scenario.strategicImpact}
          </span>
          <button onClick={onDelete} className="p-1 rounded hover:bg-muted transition-colors">
            <Trash2 size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {outputs.map(([key, val]) => (
          <div key={key} className="text-center px-1.5 py-1 rounded-lg bg-muted/50">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p className="text-xs font-extrabold text-foreground tabular-nums">
              {typeof val === "number" ? val.toLocaleString() : val}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTool: LensTool | null;
  analysisId: string;
  onScenarioSaved?: (s: ToolScenario) => void;
  intelligenceEvents?: string[];
}

export const SimulationPanel = memo(function SimulationPanel({
  isOpen, onClose, activeTool, analysisId, onScenarioSaved, intelligenceEvents = [],
}: SimulationPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>(activeTool ? "tool" : "scenarios");
  const scenarios = useMemo(() => getScenarios(analysisId), [analysisId, intelligenceEvents.length]);

  // Switch to tool tab when a tool is opened
  if (activeTool && activeTab !== "tool") {
    setActiveTab("tool");
  }

  const tabs: { id: PanelTab; label: string; icon: typeof FlaskConical }[] = [
    { id: "tool", label: "Tool", icon: FlaskConical },
    { id: "scenarios", label: `Scenarios (${scenarios.length})`, icon: History },
    { id: "impact", label: "Activity", icon: Activity },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-[440px] max-w-full z-50 border-l border-border bg-background shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
                <FlaskConical size={14} className="text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">Simulation Workspace</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border flex-shrink-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: activeTab === tab.id ? "hsl(var(--primary) / 0.1)" : "transparent",
                  color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}>
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "tool" && (
              activeTool ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <activeTool.icon size={16} style={{ color: activeTool.accentColor }} />
                    <p className="text-sm font-bold text-foreground">{activeTool.title}</p>
                  </div>
                  <ToolContent tool={activeTool} analysisId={analysisId} onScenarioSaved={onScenarioSaved} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <FlaskConical size={24} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-bold text-foreground">No tool selected</p>
                  <p className="text-xs text-muted-foreground mt-1">Click a tool from an insight node or the Lens panel</p>
                </div>
              )
            )}

            {activeTab === "scenarios" && (
              scenarios.length > 0 ? (
                <div className="space-y-3">
                  {scenarios.map(s => (
                    <ScenarioCard key={s.scenarioId} scenario={s}
                      onDelete={() => {
                        deleteScenario(analysisId, s.scenarioId);
                        onScenarioSaved?.(s); // trigger refresh
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History size={24} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-bold text-foreground">No scenarios yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Run a tool and save a scenario to see it here</p>
                </div>
              )
            )}

            {activeTab === "impact" && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Intelligence Activity</p>
                {intelligenceEvents.length > 0 ? (
                  intelligenceEvents.map((evt, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                      <Activity size={12} className="text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-snug">{evt}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity size={24} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-bold text-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Intelligence events appear as analysis runs</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
