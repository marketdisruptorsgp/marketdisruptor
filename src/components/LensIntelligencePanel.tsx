/**
 * LENS INTELLIGENCE PANEL
 *
 * Dynamic panel that auto-populates with intelligence tools
 * relevant to the active analysis lens. Displays tool cards
 * and contextual recommendations.
 */

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronRight, X, Sparkles } from "lucide-react";
import {
  getToolsForLenses,
  detectToolTriggers,
  getToolById,
  inferLensesFromMode,
  type LensId,
  type LensTool,
  type ToolTrigger,
} from "@/lib/lensToolkitRegistry";

/* ── Tool Card ── */
function ToolCard({
  tool,
  recommended,
  reason,
  onOpen,
}: {
  tool: LensTool;
  recommended?: boolean;
  reason?: string;
  onOpen: (tool: LensTool) => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={() => onOpen(tool)}
      className="w-full text-left rounded-xl p-4 border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm active:scale-[0.99] min-h-[88px]"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${tool.accentColor}12` }}
        >
          <Icon size={16} style={{ color: tool.accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground leading-snug">{tool.title}</p>
            {recommended && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                <Sparkles size={8} /> Suggested
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {tool.description}
          </p>
          {reason && (
            <p className="text-[10px] font-semibold mt-1" style={{ color: tool.accentColor }}>
              {reason}
            </p>
          )}
        </div>
        <ChevronRight size={14} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

/* ── Tool Drawer ── */
function ToolDrawer({
  tool,
  onClose,
}: {
  tool: LensTool;
  onClose: () => void;
}) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-[420px] max-w-full z-50 border-l border-border bg-background shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${tool.accentColor}12` }}
        >
          <Icon size={18} style={{ color: tool.accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-foreground">{tool.title}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {tool.category.replace("_", " ")} · {tool.interactionType}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <p className="text-sm text-foreground leading-relaxed">{tool.description}</p>

        <div className="rounded-xl p-4 bg-muted/50 border border-border">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Available In
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tool.stages.map(s => (
              <span
                key={s}
                className="px-2 py-1 rounded-md text-[10px] font-bold bg-background border border-border text-foreground capitalize"
              >
                {s.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 bg-muted/50 border border-border">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Signal Triggers
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tool.triggerPatterns.map(p => (
              <span
                key={p}
                className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background border border-border text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Placeholder for interactive tool content */}
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-muted mb-3">
            <Icon size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Interactive {tool.interactionType}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Full {tool.title.toLowerCase()} module coming soon.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Panel ── */
interface LensIntelligencePanelProps {
  analysisMode: string;
  /** Keywords extracted from analysis signals for contextual recommendations */
  signalKeywords?: string[];
  /** Override active lenses */
  activeLenses?: LensId[];
}

export const LensIntelligencePanel = memo(function LensIntelligencePanel({
  analysisMode,
  signalKeywords = [],
  activeLenses: overrideLenses,
}: LensIntelligencePanelProps) {
  const [openTool, setOpenTool] = useState<LensTool | null>(null);

  const lenses = useMemo(
    () => overrideLenses ?? inferLensesFromMode(analysisMode),
    [analysisMode, overrideLenses]
  );

  const tools = useMemo(() => getToolsForLenses(lenses), [lenses]);

  const triggers = useMemo(
    () => detectToolTriggers(signalKeywords, lenses),
    [signalKeywords, lenses]
  );

  const triggeredToolIds = useMemo(
    () => new Set(triggers.map(t => t.toolId)),
    [triggers]
  );

  const triggerReasons = useMemo(() => {
    const map: Record<string, string> = {};
    triggers.forEach(t => { map[t.toolId] = t.reason; });
    return map;
  }, [triggers]);

  // Sort: recommended first, then alphabetical
  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => {
      const aRec = triggeredToolIds.has(a.id) ? 0 : 1;
      const bRec = triggeredToolIds.has(b.id) ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;
      return a.title.localeCompare(b.title);
    });
  }, [tools, triggeredToolIds]);

  if (tools.length === 0) return null;

  const lensLabel = lenses.map(l => l.toUpperCase().replace("_", " ")).join(" · ");

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
              <Compass size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
                Lens Intelligence
              </p>
              <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                {lensLabel} · {tools.length} tools
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {triggers.length > 0 && (
          <div className="px-5 py-3 border-b border-border bg-primary/[0.03]">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
              <Sparkles size={9} /> Contextual Recommendations
            </p>
            <div className="space-y-2">
              {triggers.slice(0, 3).map(trigger => {
                const tool = getToolById(trigger.toolId);
                if (!tool) return null;
                return (
                  <button
                    key={trigger.toolId}
                    onClick={() => setOpenTool(tool)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <tool.icon size={12} style={{ color: tool.accentColor }} />
                    <span className="text-[11px] font-bold text-foreground flex-1">{tool.title}</span>
                    <span className="text-[9px] text-muted-foreground">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tool Grid */}
        <div className="p-4 space-y-2.5">
          {sortedTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              recommended={triggeredToolIds.has(tool.id)}
              reason={triggerReasons[tool.id]}
              onOpen={setOpenTool}
            />
          ))}
        </div>
      </motion.div>

      {/* Drawer */}
      <AnimatePresence>
        {openTool && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setOpenTool(null)}
            />
            <ToolDrawer
              key="drawer"
              tool={openTool}
              onClose={() => setOpenTool(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
});
