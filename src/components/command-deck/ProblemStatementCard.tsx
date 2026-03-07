/**
 * ProblemStatementCard — Editable + cyclable problem statement.
 * 
 * Generates multiple candidate problem framings from available data.
 * When local data is insufficient, calls AI to generate relevant
 * problem statements based on the entity being analyzed.
 */

import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair, ChevronLeft, ChevronRight, Pencil, Check, X, RotateCcw,
  TrendingUp, Loader2,
} from "lucide-react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import type { StrategicNarrative } from "@/lib/strategicEngine";

interface ProblemStatementCardProps {
  product: Record<string, any> | null;
  businessData: Record<string, any> | null;
  narrative: StrategicNarrative | null;
  governed: Record<string, any>;
  modeAccent: string;
  evidenceCount: number;
  completedSteps: number;
  totalSteps: number;
  marketSize: string | null;
  trend: string | null;
  mode?: "product" | "service" | "business";
  onProblemLocked?: (statement: string) => void;
}

/** Extract all distinct, non-empty candidate problem framings from the data */
function extractCandidates(
  narrative: StrategicNarrative | null,
  product: Record<string, any>,
  biz: Record<string, any>,
  governed: Record<string, any>,
): string[] {
  const raw: (string | null | undefined)[] = [];

  // Strategic verdict
  if (narrative?.strategicVerdict && narrative.strategicVerdict.length > 20)
    raw.push(narrative.strategicVerdict);

  // Why this matters
  if (narrative?.whyThisMatters && narrative.whyThisMatters.length > 20)
    raw.push(narrative.whyThisMatters);

  // Binding constraint dominance proof
  const cm = governed?.constraint_map || (governed as any)?.governed?.constraint_map;
  if (cm?.dominance_proof && cm.dominance_proof.length > 20)
    raw.push(cm.dominance_proof);

  // Narrative summary
  if (narrative?.narrativeSummary && narrative.narrativeSummary.length > 20)
    raw.push(narrative.narrativeSummary);

  // Key insight from product
  if (product?.keyInsight && product.keyInsight.length > 15)
    raw.push(product.keyInsight);

  // Business overview
  const overview = biz?.summary || biz?.overview;
  if (overview && overview.length > 15) raw.push(overview);

  // Product description fallback
  if (product?.description && product.description.length > 15) {
    const desc = product.description.length > 200
      ? product.description.slice(0, 197) + "…"
      : product.description;
    raw.push(desc);
  }

  // Deduplicate: remove near-duplicates (>60% overlap)
  const unique: string[] = [];
  for (const s of raw) {
    if (!s) continue;
    const trimmed = s.trim();
    if (!trimmed) continue;
    const isDupe = unique.some(u => {
      const shorter = u.length < trimmed.length ? u : trimmed;
      const longer = u.length >= trimmed.length ? u : trimmed;
      return longer.includes(shorter.slice(0, Math.floor(shorter.length * 0.6)));
    });
    if (!isDupe) unique.push(trimmed);
  }

  return unique;
}

export const ProblemStatementCard = memo(function ProblemStatementCard({
  product, businessData, narrative, governed, modeAccent,
  evidenceCount, completedSteps, totalSteps, marketSize, trend,
  mode,
  onProblemLocked,
}: ProblemStatementCardProps) {
  const p = product || {};
  const biz = businessData || {};

  const localCandidates = useMemo(
    () => extractCandidates(narrative, p, biz, governed),
    [narrative, p, biz, governed],
  );

  // AI-generated fallback candidates
  const [aiCandidates, setAiCandidates] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFetched, setAiFetched] = useState(false);
  const aiRequestRef = useRef<string | null>(null);

  // Determine entity name for AI generation
  const entityName = p.name || p.title || biz?.name || biz?.title || "";
  const entityType = p.category || p.type || biz?.category || biz?.type || "";
  const entityDesc = p.description || biz?.description || biz?.overview || "";

  // When local candidates are empty and we have an entity name, call AI
  useEffect(() => {
    if (localCandidates.length > 0) return; // local data is sufficient
    if (!entityName || entityName.length < 2) return; // no entity to analyze
    if (aiFetched) return; // already tried
    if (aiLoading) return;

    // Prevent duplicate requests for same entity
    const requestKey = `${entityName}-${mode}`;
    if (aiRequestRef.current === requestKey) return;
    aiRequestRef.current = requestKey;

    setAiLoading(true);
    invokeWithTimeout("generate-problem-statements", {
      body: {
        entityName,
        entityType,
        description: entityDesc,
        mode: mode || "product",
      },
    }, 30_000).then(({ data, error }) => {
      if (error) {
        console.warn("AI problem statement generation failed:", error);
      } else if (data?.statements) {
        const stmts = (data.statements as any[])
          .map((s: any) => s.text || s)
          .filter((s: string) => s && s.length > 10);
        if (stmts.length > 0) setAiCandidates(stmts);
      }
      setAiFetched(true);
      setAiLoading(false);
    });
  }, [localCandidates.length, entityName, entityType, entityDesc, mode, aiFetched, aiLoading]);

  // Reset AI state if entity changes
  useEffect(() => {
    const key = `${entityName}-${mode}`;
    if (aiRequestRef.current && aiRequestRef.current !== key) {
      setAiFetched(false);
      setAiCandidates([]);
      aiRequestRef.current = null;
    }
  }, [entityName, mode]);

  // Merge: prefer local, fall back to AI
  const candidates = localCandidates.length > 0 ? localCandidates : aiCandidates;

  const [activeIdx, setActiveIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [customText, setCustomText] = useState("");
  const [lockedStatement, setLockedStatement] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset index if candidates change
  useEffect(() => {
    if (activeIdx >= candidates.length && candidates.length > 0) {
      setActiveIdx(0);
    }
  }, [candidates.length, activeIdx]);

  const currentStatement = lockedStatement
    || (candidates.length > 0 ? candidates[activeIdx] : null);

  const hasCandidates = candidates.length > 0;
  const hasMultiple = candidates.length > 1;
  const isAiSourced = localCandidates.length === 0 && aiCandidates.length > 0;

  const handlePrev = useCallback(() => {
    if (!hasMultiple) return;
    setActiveIdx(i => (i - 1 + candidates.length) % candidates.length);
    setLockedStatement(null);
  }, [hasMultiple, candidates.length]);

  const handleNext = useCallback(() => {
    if (!hasMultiple) return;
    setActiveIdx(i => (i + 1) % candidates.length);
    setLockedStatement(null);
  }, [hasMultiple, candidates.length]);

  const handleStartEdit = useCallback(() => {
    setCustomText(currentStatement || "");
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [currentStatement]);

  const handleConfirmEdit = useCallback(() => {
    const trimmed = customText.trim();
    if (trimmed) {
      setLockedStatement(trimmed);
      onProblemLocked?.(trimmed);
    }
    setIsEditing(false);
  }, [customText, onProblemLocked]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setCustomText("");
  }, []);

  const handleLockIn = useCallback(() => {
    if (currentStatement) {
      setLockedStatement(currentStatement);
      onProblemLocked?.(currentStatement);
    }
  }, [currentStatement, onProblemLocked]);

  const handleReset = useCallback(() => {
    setLockedStatement(null);
    setActiveIdx(0);
  }, []);

  return (
    <div
      className="rounded-lg px-4 py-3"
      style={{ background: "hsl(var(--card))", border: `2px solid ${modeAccent}30` }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <Crosshair size={13} style={{ color: modeAccent }} className="flex-shrink-0" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Problem Statement
        </span>

        {/* Source badge */}
        {isAiSourced && !lockedStatement && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            AI-Generated
          </span>
        )}

        {/* Candidate counter */}
        {hasMultiple && !lockedStatement && !isEditing && (
          <span className="text-[9px] font-bold text-muted-foreground">
            {activeIdx + 1} / {candidates.length}
          </span>
        )}
        {lockedStatement && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${modeAccent}20`, color: modeAccent }}>
            Locked
          </span>
        )}

        <span className="text-[9px] font-bold text-muted-foreground ml-auto">
          {evidenceCount} signals · {completedSteps}/{totalSteps} steps
        </span>
      </div>

      {/* Statement body */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <textarea
              ref={textareaRef}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full text-sm font-bold leading-snug bg-transparent border rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1"
              style={{
                borderColor: modeAccent,
                color: "hsl(var(--foreground))",
                minHeight: 60,
              }}
              rows={3}
              placeholder="Rewrite the core problem in your own words…"
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleConfirmEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={handleConfirmEdit}
                className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md transition-colors"
                style={{ background: modeAccent, color: "white" }}
              >
                <Check size={11} /> Lock In
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
              >
                <X size={11} /> Cancel
              </button>
              <span className="text-[9px] text-muted-foreground ml-auto">⌘+Enter to confirm</span>
            </div>
          </motion.div>
        ) : aiLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-2"
          >
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground italic">
              Generating problem framings for {entityName}…
            </span>
          </motion.div>
        ) : (
          <motion.div
            key={`statement-${activeIdx}-${lockedStatement ? "locked" : ""}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p className={`text-sm sm:text-base font-black leading-snug ${currentStatement ? "text-foreground" : "text-muted-foreground italic"}`}>
              {currentStatement || "Run the analysis to identify the core problem."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market size / trend */}
      {marketSize && !isEditing && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <TrendingUp size={11} style={{ color: modeAccent }} />
          <span className="text-[11px] font-bold text-foreground">
            TAM: {marketSize.replace(/\s*\(source:.*?\)/gi, "").replace(/\s*-\s*(modeled|verified|speculative)\s*$/i, "").trim()}
          </span>
        </div>
      )}
      {trend && !isEditing && !currentStatement?.includes(trend.slice(0, 30)) && (
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{trend}</p>
      )}

      {/* Action bar */}
      {(hasCandidates || aiLoading) && !isEditing && !aiLoading && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
          {/* Cycle arrows */}
          {hasMultiple && !lockedStatement && (
            <>
              <button
                onClick={handlePrev}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Previous framing"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Next framing"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {/* Edit button */}
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            <Pencil size={10} /> Reframe
          </button>

          {/* Lock in (when cycling, not yet locked) */}
          {!lockedStatement && hasMultiple && (
            <button
              onClick={handleLockIn}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ml-auto"
              style={{ color: modeAccent }}
            >
              <Check size={10} /> Lock This
            </button>
          )}

          {/* Reset (when locked) */}
          {lockedStatement && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors ml-auto"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
});
