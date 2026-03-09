/**
 * SystemMapNodeDetail — Right slide-in panel for node details
 *
 * Tab 1 (Industry Map): Role, Why This Layer Matters, Structure, Strategic Signals
 * Tab 2 (Opportunity Map): Constraint, Structural Insight, Strategic Move, First Move
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Lightbulb, ArrowRight, Target, Zap, Star } from "lucide-react";
import type { AnnotatedNode, OpportunityDetail } from "@/lib/industryOpportunityOverlay";

interface SystemMapNodeDetailProps {
  node: AnnotatedNode | null;
  isOpportunityMode: boolean;
  onClose: () => void;
  modeAccent: string;
}

export const SystemMapNodeDetail = memo(function SystemMapNodeDetail({
  node,
  isOpportunityMode,
  onClose,
  modeAccent,
}: SystemMapNodeDetailProps) {
  if (!node) return null;

  const hasOpportunity = isOpportunityMode && node.opportunityDetail;

  return (
    <AnimatePresence>
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-start justify-between gap-2"
          style={{
            background: node.isUserBusiness
              ? modeAccent
              : node.isStructuralNode
                ? "hsl(38 92% 50% / 0.1)"
                : "hsl(var(--muted) / 0.5)",
          }}
        >
          <div className="min-w-0">
            <p
              className="text-sm font-black leading-tight"
              style={{
                color: node.isUserBusiness ? "white" : "hsl(var(--foreground))",
              }}
            >
              {node.label}
            </p>
            {node.isUserBusiness && (
              <p className="text-[11px] mt-0.5 opacity-80" style={{ color: "white" }}>
                Your business
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-black/10"
          >
            <X size={14} style={{ color: node.isUserBusiness ? "white" : "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Industry Map content */}
          {!hasOpportunity && (
            <>
              <DetailSection
                title="Role in the Industry"
                content={node.roleDescription}
              />
              <DetailSection
                title="Why This Layer Matters"
                content={node.whyItMatters}
              />
              {node.structureNote && (
                <DetailSection
                  title="Industry Structure"
                  content={node.structureNote}
                />
              )}
              {node.strategicSignals.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                    Potential Strategic Signals
                  </p>
                  <ul className="space-y-1.5">
                    {node.strategicSignals.map((signal, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-foreground leading-relaxed">{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Opportunity Map content */}
          {hasOpportunity && node.opportunityDetail && (
            <OpportunityDetailView
              detail={node.opportunityDetail}
              markers={node.markers}
              modeAccent={modeAccent}
            />
          )}

          {/* Constraint markers (in opportunity mode, show on non-opportunity nodes) */}
          {isOpportunityMode && !hasOpportunity && node.markers.length > 0 && (
            <div className="space-y-2">
              {node.markers.map((marker, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg px-3 py-2"
                  style={{
                    background: marker.type === "constraint"
                      ? "hsl(var(--destructive) / 0.08)"
                      : marker.type === "fragmentation"
                        ? "hsl(38 92% 50% / 0.08)"
                        : marker.type === "trend"
                          ? "hsl(var(--primary) / 0.08)"
                          : "hsl(142 71% 45% / 0.08)",
                  }}
                >
                  <span className="text-sm mt-0.5">{marker.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{marker.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {marker.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

// ── Sub-components ──

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
        {title}
      </p>
      <p className="text-xs text-foreground leading-relaxed">{content}</p>
    </div>
  );
}

function OpportunityDetailView({
  detail,
  markers,
  modeAccent,
}: {
  detail: OpportunityDetail;
  markers: { type: string; label: string; icon: string }[];
  modeAccent: string;
}) {
  return (
    <div className="space-y-3">
      {/* Opportunity title */}
      <div className="flex items-center gap-2">
        <Star size={14} style={{ color: "hsl(142 71% 45%)" }} />
        <p className="text-sm font-black text-foreground">{detail.title}</p>
      </div>

      {/* Constraint */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "hsl(var(--destructive) / 0.06)" }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle size={11} className="text-destructive" />
          <p className="text-[10px] font-black uppercase tracking-widest text-destructive">Constraint</p>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{detail.constraint}</p>
      </div>

      {/* Structural Insight */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Target size={11} className="text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Structural Insight</p>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{detail.structuralInsight}</p>
      </div>

      {/* Strategic Move */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: `${modeAccent}08` }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Zap size={11} style={{ color: modeAccent }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: modeAccent }}>Strategic Move</p>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{detail.strategicMove}</p>
      </div>

      {/* First Move */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "hsl(142 71% 45% / 0.06)" }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowRight size={11} style={{ color: "hsl(142 71% 45%)" }} />
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "hsl(142 71% 45%)" }}>First Move</p>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{detail.firstMove}</p>
      </div>

      {/* Strategic Bet */}
      <div className="pt-1 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Strategic Bet</p>
        <p className="text-xs text-foreground italic leading-relaxed">"{detail.strategicBet}"</p>
      </div>
    </div>
  );
}
