import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Zap, ChevronDown, ChevronUp,
  Layers, Activity, Database, ArrowDown, RefreshCw, Eye, Shield,
  Loader2, Link2, Search, X, ChevronRight, Copy, Check
} from "lucide-react";
import { format } from "date-fns";
import { PlatformNav } from "@/components/PlatformNav";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { STEP_CONTRACTS } from "@/utils/pipelineValidation";
import { detectSignals } from "@/lib/signalDetection";
import { extractAndRankSignals } from "@/lib/signalRanking";
import { validatePipelineCheckpoints } from "@/utils/checkpointGate";
import { countOpportunities, deriveInnovationOpportunities } from "@/lib/innovationEngine";
import {
  computeSystemHealth,
  checkRetroactiveInvalidation,
  GOVERNED_ARTIFACT_KEYS,
} from "@/lib/governedPersistence";
import { buildEvidenceRegistry } from "@/lib/evidenceRegistry";
import type { SourceType } from "@/lib/evidenceRegistry";
import { JsonTree } from "@/components/JsonTree";

/* ─── Types ─── */
interface PickerAnalysis {
  id: string;
  title: string;
  category: string;
  era: string;
  analysis_type?: string;
  is_favorite?: boolean;
  avg_revival_score?: number;
  created_at: string;
  product_count?: number;
}

interface PipelineStep {
  id: string;
  label: string;
  layer: string;
  status: "active" | "complete" | "empty" | "outdated" | "error";
  inputSources: string[];
  outputKeys: string[];
  dataSize: number;
  governedArtifacts: string[];
  executionNotes: string[];
}

/* ─── Layer definitions matching the 8 methodology layers ─── */
const METHODOLOGY_LAYERS = [
  { id: "assumptions", label: "Assumption Extraction", description: "Hidden assumptions, viability assumptions, evidence status tagging" },
  { id: "reasoning", label: "Reasoning Application", description: "9-step constraint-driven reasoning framework (reasoningFramework.ts)" },
  { id: "frameworks", label: "Framework Application", description: "Governed schema enforcement, friction tiers, constraint mapping" },
  { id: "mode_specific", label: "Mode-Specific Analysis", description: "Mode enforcement, dimension weighting, input filtering" },
  { id: "insight_synthesis", label: "Insight Synthesis", description: "Signal detection, signal ranking, visual ontology classification" },
  { id: "structural_diagnosis", label: "Structural Diagnosis", description: "Market failure identification: value chain, pricing distortions, trust failures" },
  { id: "strategic_signals", label: "Strategic Signal Generation", description: "Strategic OS archetypes, hypothesis branching, dominance scoring" },
  { id: "metrics", label: "Metrics Intelligence", description: "Confidence computation, scoring calibration, evidence governance" },
  { id: "narrative", label: "Narrative Output", description: "Pitch deck generation, action plans, visual specs" },
  { id: "eta_analysis", label: "ETA Analysis", description: "Acquisition viability, SBA modeling, DSCR, owner dependency" },
  { id: "financial_modeling", label: "Financial Modeling", description: "Deterministic SBA loan calc, valuation, scenario engine" },
  { id: "innovation_engine", label: "Innovation Engine", description: "Structural leverage, pricing shifts, automation opportunities" },
  { id: "data_provenance", label: "Data Provenance", description: "Provenance tracking for all numeric outputs (SOURCE/USER_INPUT/MODELED)" },
] as const;

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: PipelineStep["status"] }) {
  const config = {
    active: { color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)", text: "ACTIVE", Icon: Activity },
    complete: { color: "hsl(142 70% 35%)", bg: "hsl(142 70% 35% / 0.1)", text: "COMPLETE", Icon: CheckCircle2 },
    empty: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.5)", text: "EMPTY", Icon: Clock },
    outdated: { color: "hsl(38 92% 42%)", bg: "hsl(38 92% 42% / 0.1)", text: "OUTDATED", Icon: AlertTriangle },
    error: { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)", text: "ERROR", Icon: XCircle },
  }[status];
  const { Icon } = config;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-extrabold tracking-wider" style={{ color: config.color, background: config.bg }}>
      <Icon className="w-3 h-3" /> {config.text}
    </span>
  );
}

/* ─── Layer status card ─── */
function LayerCard({ layer, status, evidence }: { layer: typeof METHODOLOGY_LAYERS[number]; status: "ACTIVE" | "PARTIALLY IMPLEMENTED" | "VISUAL ONLY" | "MISSING"; evidence: string[] }) {
  const [open, setOpen] = useState(false);
  const color = status === "ACTIVE" ? "hsl(142 70% 35%)" : status === "PARTIALLY IMPLEMENTED" ? "hsl(38 92% 42%)" : "hsl(var(--destructive))";
  return (
    <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <div>
            <p className="text-sm font-bold text-foreground">{layer.label}</p>
            <p className="text-sm text-muted-foreground">{layer.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-wider px-2 py-0.5 rounded" style={{ color, background: `${color}15` }}>{status}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {evidence.map((e, i) => (
                <p key={i} className="text-sm text-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color }} />
                  {e}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pipeline step row ─── */
function StepRow({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
        <div className="w-8 text-center">
          <div className="w-3 h-3 rounded-full mx-auto" style={{
            background: step.status === "complete" ? "hsl(142 70% 35%)" : step.status === "outdated" ? "hsl(38 92% 42%)" : step.status === "active" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"
          }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{step.label}</span>
            <StatusBadge status={step.status} />
            <span className="text-xs text-muted-foreground">{step.layer}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {step.dataSize > 0 && (
            <span className="font-mono">{(step.dataSize / 1024).toFixed(1)}KB</span>
          )}
          <span>{step.governedArtifacts.length} artifacts</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="ml-12 mr-4 mb-3 p-3 rounded-lg bg-muted/30 border border-border space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-foreground mb-1">Inputs</p>
                  {step.inputSources.length > 0 ? step.inputSources.map((s, i) => <p key={i} className="text-muted-foreground">← {s}</p>) : <p className="text-muted-foreground italic">User input only</p>}
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">Outputs</p>
                  {step.outputKeys.map((k, i) => <p key={i} className="text-muted-foreground">→ {k}</p>)}
                </div>
              </div>
              {step.governedArtifacts.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">Governed Artifacts</p>
                  <div className="flex flex-wrap gap-1">
                    {step.governedArtifacts.map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {step.executionNotes.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">Notes</p>
                  {step.executionNotes.map((n, i) => <p key={i} className="text-muted-foreground">{n}</p>)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLast && (
        <div className="flex justify-center py-1">
          <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

/* ─── Collapsible section wrapper ─── */
function CollapsibleSection({
  title, icon: Icon, defaultOpen = true, badge, children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 mb-4 group"
      >
        <Icon className="w-5 h-5 text-primary flex-shrink-0" />
        <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
        {badge && <span className="ml-1">{badge}</span>}
        <span className="ml-auto">
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </span>
      </button>
      {open && children}
    </section>
  );
}

/* ─── System Health Score Panel ─── */
function SystemHealthPanel({ analysisData }: { analysisData: Record<string, unknown> | null }) {
  const health = useMemo(() => computeSystemHealth(analysisData), [analysisData]);
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  const tiles = [
    {
      label: "Governed Persistence",
      value: `${health.artifact_count}/${health.total_required} artifacts`,
      sub: pct(health.governed_persistence_rate),
      bar: health.governed_persistence_rate,
      color: health.governed_persistence_rate >= 0.9 ? "hsl(142 70% 35%)" : health.governed_persistence_rate >= 0.5 ? "hsl(38 92% 42%)" : "hsl(var(--destructive))",
    },
    {
      label: "Schema Validation",
      value: pct(health.schema_validation_pass_rate),
      color: health.schema_validation_pass_rate >= 0.9 ? "hsl(142 70% 35%)" : "hsl(38 92% 42%)",
    },
    {
      label: "Causal Structure",
      value: health.causal_structure_presence_rate > 0 ? "✓" : "✗",
      color: health.causal_structure_presence_rate > 0 ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
    },
    {
      label: "Confidence Computed",
      value: health.confidence_computed ? "✓" : "✗",
      color: health.confidence_computed ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
    },
    {
      label: "Decision Grade",
      value: health.decision_grade_present ? "✓" : "✗",
      color: health.decision_grade_present ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
    },
    {
      label: "Data Traceability",
      value: pct(health.data_traceability_rate),
      color: health.data_traceability_rate >= 0.7 ? "hsl(142 70% 35%)" : "hsl(38 92% 42%)",
    },
    {
      label: "Governed Size",
      value: `${(health.governed_byte_size / 1024).toFixed(1)} KB`,
      color: "hsl(var(--foreground))",
    },
    {
      label: "Market Ready",
      value: health.market_ready ? "READY" : "NOT READY",
      color: health.market_ready ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
      bold: true,
    },
  ];

  return (
    <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-md border border-border p-3 flex flex-col gap-1" style={{ background: "hsl(var(--background))" }}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-tight">{t.label}</p>
            <p
              className={`text-base font-black leading-tight ${t.bold ? "text-lg" : ""}`}
              style={{ color: t.color }}
            >
              {t.value}
            </p>
            {t.sub && <p className="text-xs text-muted-foreground">{t.sub}</p>}
            {t.bar !== undefined && (
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(t.bar * 100)}%`, background: t.color }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Governed Artifact Inspector ─── */
const OPTIONAL_ARTIFACT_KEYS = ["causal_chains", "evidence_registry", "confidence_metrics", "redesign_logic", "reasoning_synopsis"] as const;

function ArtifactCard({ artifactKey, data, required }: { artifactKey: string; data: unknown; required: boolean }) {
  const [open, setOpen] = useState(false);
  const present = data !== null && data !== undefined;
  const byteSize = present ? new Blob([JSON.stringify(data)]).size : 0;

  // Specialized prominent fields
  const isConstraintMap = artifactKey === "constraint_map";
  const isDecisionSynthesis = artifactKey === "decision_synthesis";
  const isFalsification = artifactKey === "falsification";

  const cm = isConstraintMap ? (data as Record<string, unknown>) : null;
  const ds = isDecisionSynthesis ? (data as Record<string, unknown>) : null;
  const fs = isFalsification ? (data as Record<string, unknown>) : null;

  const gradeColor = (grade: string) => {
    if (!grade) return "hsl(var(--muted-foreground))";
    if (grade === "proceed") return "hsl(142 70% 35%)";
    if (grade === "conditional") return "hsl(38 92% 42%)";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="font-mono text-sm font-bold text-foreground flex-1 truncate">{artifactKey}</span>
        <span
          className="text-xs font-extrabold tracking-wider px-2 py-0.5 rounded flex-shrink-0"
          style={{
            color: present ? "hsl(142 70% 35%)" : required ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
            background: present ? "hsl(142 70% 35% / 0.1)" : required ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--muted) / 0.5)",
          }}
        >
          {present ? "PRESENT" : required ? "MISSING" : "ABSENT"}
        </span>
        {present && <span className="text-xs text-muted-foreground flex-shrink-0">{(byteSize / 1024).toFixed(1)}KB</span>}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && present && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {/* Constraint map special fields */}
          {isConstraintMap && cm && (
            <div className="rounded-md border border-border p-3 space-y-2 bg-muted/20">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Key Fields</p>
              {cm.binding_constraint_id && (
                <p className="text-sm"><span className="font-bold text-foreground">Binding Constraint:</span> <span className="text-primary font-mono">{String(cm.binding_constraint_id)}</span></p>
              )}
              {cm.dominance_proof && (
                <p className="text-sm"><span className="font-bold text-foreground">Dominance Proof:</span> <span className="text-muted-foreground">{String(cm.dominance_proof).slice(0, 200)}</span></p>
              )}
              {Array.isArray(cm.root_hypotheses) && (cm.root_hypotheses as unknown[]).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Root Hypotheses ({(cm.root_hypotheses as unknown[]).length})</p>
                  <div className="space-y-2">
                    {(cm.root_hypotheses as Record<string, unknown>[]).slice(0, 5).map((h, i) => (
                      <div key={i} className="pl-3 border-l-2 border-primary/30 text-xs space-y-0.5">
                        {h.hypothesis_statement && <p className="text-foreground">{String(h.hypothesis_statement).slice(0, 120)}</p>}
                        <p className="text-muted-foreground flex gap-3">
                          {h.confidence !== undefined && <span>confidence: <strong>{String(h.confidence)}</strong></span>}
                          {h.leverage_score !== undefined && <span>leverage: <strong>{String(h.leverage_score)}</strong></span>}
                          {h.fragility_score !== undefined && <span>fragility: <strong>{String(h.fragility_score)}</strong></span>}
                        </p>
                        {h.evidence_mix && <p className="text-muted-foreground">evidence: {String(h.evidence_mix)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision synthesis special fields */}
          {isDecisionSynthesis && ds && (
            <div className="rounded-md border border-border p-3 space-y-2 bg-muted/20">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Key Fields</p>
              {ds.decision_grade && (
                <p className="text-sm">
                  <span className="font-bold text-foreground">Decision Grade: </span>
                  <span className="text-base font-black px-2 py-0.5 rounded" style={{ color: gradeColor(String(ds.decision_grade)), background: `${gradeColor(String(ds.decision_grade))}18` }}>
                    {String(ds.decision_grade).toUpperCase()}
                  </span>
                </p>
              )}
              {ds.confidence_score !== undefined && (
                <p className="text-sm">
                  <span className="font-bold text-foreground">Confidence Score: </span>
                  <span style={{ color: Number(ds.confidence_score) >= 70 ? "hsl(142 70% 35%)" : Number(ds.confidence_score) >= 50 ? "hsl(38 92% 42%)" : "hsl(var(--destructive))" }} className="font-black">
                    {String(ds.confidence_score)}
                  </span>
                </p>
              )}
              {Array.isArray(ds.blocking_uncertainties) && (ds.blocking_uncertainties as unknown[]).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Blocking Uncertainties</p>
                  <ul className="space-y-0.5">
                    {(ds.blocking_uncertainties as string[]).map((u, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-destructive" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ds.fastest_validation_experiment && (
                <p className="text-sm"><span className="font-bold text-foreground">Fastest Validation:</span> <span className="text-muted-foreground">{String(ds.fastest_validation_experiment).slice(0, 200)}</span></p>
              )}
            </div>
          )}

          {/* Falsification special fields */}
          {isFalsification && fs && (
            <div className="rounded-md border border-border p-3 space-y-2 bg-muted/20">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Key Fields</p>
              {fs.model_fragility_score !== undefined && (
                <p className="text-sm">
                  <span className="font-bold text-foreground">Model Fragility Score: </span>
                  <span style={{ color: Number(fs.model_fragility_score) > 70 ? "hsl(var(--destructive))" : Number(fs.model_fragility_score) > 40 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)" }} className="font-black">
                    {String(fs.model_fragility_score)}/100
                  </span>
                </p>
              )}
              {Array.isArray(fs.fragility_flags) && (fs.fragility_flags as unknown[]).length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Fragility Flags</p>
                  <ul className="space-y-0.5">
                    {(fs.fragility_flags as string[]).map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(38 92% 42%)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Full JSON */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Content</p>
            <div className="rounded-md border border-border p-3 bg-muted/20 overflow-auto max-h-96">
              <JsonTree data={data} maxDepth={4} showControls />
            </div>
          </div>
        </div>
      )}

      {open && !present && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground italic">
            {required ? "Required artifact not yet generated." : "Optional artifact not present."}
          </p>
        </div>
      )}
    </div>
  );
}

function GovernedArtifactInspector({ governedData }: { governedData: Record<string, unknown> | null }) {
  const governed = governedData || {};
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        {GOVERNED_ARTIFACT_KEYS.filter(k => governed[k] != null).length}/{GOVERNED_ARTIFACT_KEYS.length} required artifacts present
        {OPTIONAL_ARTIFACT_KEYS.some(k => governed[k] != null) && ` + ${OPTIONAL_ARTIFACT_KEYS.filter(k => governed[k] != null).length} optional`}
      </p>
      {(GOVERNED_ARTIFACT_KEYS as readonly string[]).map(key => (
        <ArtifactCard key={key} artifactKey={key} data={governed[key]} required />
      ))}
      {OPTIONAL_ARTIFACT_KEYS.filter(k => governed[k] != null).map(key => (
        <ArtifactCard key={key} artifactKey={key} data={governed[key as keyof typeof governed]} required={false} />
      ))}
    </div>
  );
}

/* ─── Step Data Inspector ─── */
interface StepDataEntry {
  key: string;
  label: string;
  data: unknown;
}

function StepDataCard({ entry }: { entry: StepDataEntry }) {
  const [showJson, setShowJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const dataSize = entry.data ? new Blob([JSON.stringify(entry.data)]).size : 0;

  const itemCounts = useMemo(() => {
    if (!entry.data || typeof entry.data !== "object") return [];
    const counts: string[] = [];
    for (const [k, v] of Object.entries(entry.data as Record<string, unknown>)) {
      if (Array.isArray(v)) counts.push(`${k}: ${v.length} items`);
    }
    return counts.slice(0, 5);
  }, [entry.data]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(entry.data, null, 2)).then(() => {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    });
  }, [entry.data]);

  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{entry.label}</p>
          <p className="text-xs text-muted-foreground flex gap-2 flex-wrap mt-0.5">
            <span className="font-mono">{(dataSize / 1024).toFixed(1)}KB</span>
            {itemCounts.map((c, i) => <span key={i}>{c}</span>)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            {copiedJson ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            {copiedJson ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <Eye className="w-3 h-3" />
            {showJson ? "Hide" : "View Raw JSON"}
          </button>
        </div>
      </div>
      {showJson && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <div className="rounded-md border border-border p-3 bg-muted/20 overflow-auto max-h-96">
            <JsonTree data={entry.data} maxDepth={4} showControls />
          </div>
        </div>
      )}
    </div>
  );
}

function StepDataInspector({
  disruptData, redesignData, stressTestData, pitchDeckData,
  businessAnalysisData, governedData, adaptiveContext,
}: {
  disruptData: unknown; redesignData: unknown; stressTestData: unknown;
  pitchDeckData: unknown; businessAnalysisData: unknown;
  governedData: Record<string, unknown> | null; adaptiveContext: unknown;
}) {
  const entries: StepDataEntry[] = useMemo(() => {
    const all: StepDataEntry[] = [
      { key: "disruptData", label: "Deconstruct (First Principles)", data: disruptData },
      { key: "redesignData", label: "Redesign (Logic Inversion)", data: redesignData },
      { key: "stressTestData", label: "Adversarial Validation (Stress Test)", data: stressTestData },
      { key: "pitchDeckData", label: "Narrative Output (Pitch Deck)", data: pitchDeckData },
      { key: "businessAnalysisData", label: "Business Model Deconstruction", data: businessAnalysisData },
      { key: "governedData", label: "Governed Artifacts (All)", data: governedData },
      { key: "adaptiveContext", label: "Adaptive Context", data: adaptiveContext },
    ];
    return all.filter(e => e.data != null);
  }, [disruptData, redesignData, stressTestData, pitchDeckData, businessAnalysisData, governedData, adaptiveContext]);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center" style={{ background: "hsl(var(--card))" }}>
        <p className="text-sm text-muted-foreground">No step data available. Run an analysis to populate step data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(e => <StepDataCard key={e.key} entry={e} />)}
    </div>
  );
}

/* ─── Evidence Registry Panel ─── */
const SOURCE_TYPE_COLORS: Record<SourceType, { bg: string; text: string }> = {
  verified: { bg: "hsl(142 70% 35% / 0.15)", text: "hsl(142 70% 35%)" },
  scraped: { bg: "hsl(217 91% 60% / 0.15)", text: "hsl(217 91% 60%)" },
  database: { bg: "hsl(217 91% 60% / 0.15)", text: "hsl(217 91% 60%)" },
  modeled: { bg: "hsl(45 93% 47% / 0.15)", text: "hsl(45 93% 47%)" },
  assumed: { bg: "hsl(25 95% 53% / 0.15)", text: "hsl(25 95% 53%)" },
  user_input: { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" },
};

function EvidenceRegistryPanel({ analysisData }: { analysisData: Record<string, unknown> | null }) {
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());
  const registry = useMemo(() => buildEvidenceRegistry(analysisData), [analysisData]);

  if (registry.entries.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6" style={{ background: "hsl(var(--card))" }}>
        <p className="text-sm text-muted-foreground text-center">
          Evidence registry requires a completed analysis with governed artifacts. Run the full pipeline to populate signals.
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">{registry.trace}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-b border-border bg-border">
        {[
          { label: "Total Signals", value: String(registry.entries.length) },
          { label: "Provenance Score", value: `${Math.round(registry.provenance_score * 100)}%` },
          { label: "Stale", value: String(registry.stale_count) },
          { label: "Unverified", value: String(registry.unverified_count) },
        ].map(item => (
          <div key={item.label} className="p-3 text-center" style={{ background: "hsl(var(--card))" }}>
            <p className="text-lg font-black text-foreground">{item.value}</p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Entries table */}
      <div className="divide-y divide-border">
        {registry.entries.map(entry => {
          const isExpanded = expandedClaims.has(entry.signal_id);
          const isLongClaim = entry.supports_which_claim.length > 80;
          const srcColor = SOURCE_TYPE_COLORS[entry.source_type] || SOURCE_TYPE_COLORS.assumed;

          return (
            <div key={entry.signal_id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                <span className="font-mono text-xs text-muted-foreground flex-shrink-0 mt-0.5 w-32 truncate">{entry.signal_id}</span>
                <span
                  className="text-xs font-extrabold tracking-wider px-2 py-0.5 rounded flex-shrink-0"
                  style={{ color: srcColor.text, background: srcColor.bg }}
                >
                  {entry.source_type}
                </span>
                <span className={`text-xs flex-shrink-0 font-bold ${entry.verification_status === "verified" ? "text-green-600" : entry.verification_status === "stale" ? "text-orange-500" : "text-yellow-600"}`}>
                  {entry.verification_status}
                </span>
                <span className="text-xs text-muted-foreground flex-1 min-w-0">
                  {isLongClaim && !isExpanded
                    ? <>{entry.supports_which_claim.slice(0, 80)}…<button onClick={() => setExpandedClaims(s => { const n = new Set(s); n.add(entry.signal_id); return n; })} className="ml-1 text-primary underline">more</button></>
                    : <>{entry.supports_which_claim}{isLongClaim && <button onClick={() => setExpandedClaims(s => { const n = new Set(s); n.delete(entry.signal_id); return n; })} className="ml-1 text-primary underline">less</button>}</>
                  }
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {entry.freshness_hours !== undefined
                    ? entry.freshness_hours > 72 ? <span className="text-orange-500">stale</span> : `${entry.freshness_hours}h ago`
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Retroactive Invalidation Check ─── */
function InvalidationPanel({ governedData }: { governedData: Record<string, unknown> | null }) {
  const result = useMemo(() => {
    if (!governedData?.falsification) return null;
    return checkRetroactiveInvalidation(governedData);
  }, [governedData]);

  if (!result) return null;

  return (
    <div
      className="rounded-lg border p-4 flex items-start gap-3"
      style={{
        borderColor: result.shouldInvalidate ? "hsl(var(--destructive) / 0.4)" : "hsl(142 70% 35% / 0.4)",
        background: result.shouldInvalidate ? "hsl(var(--destructive) / 0.05)" : "hsl(142 70% 35% / 0.05)",
      }}
    >
      {result.shouldInvalidate
        ? <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(38 92% 42%)" }} />
        : <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(142 70% 35%)" }} />
      }
      <div className="flex-1 min-w-0">
        {result.shouldInvalidate ? (
          <>
            <p className="text-sm font-extrabold" style={{ color: "hsl(38 92% 42%)" }}>
              ⚠ Retroactive invalidation triggered
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Model fragility score <strong>{result.fragilityScore}</strong>/100 exceeds threshold (70).
              Confidence downgrade: <strong>-{result.confidenceDowngrade} pts</strong>
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {result.affectedArtifacts.map(a => (
                <span key={a} className="text-xs px-2 py-0.5 rounded font-bold" style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.1)" }}>{a}</span>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-extrabold" style={{ color: "hsl(142 70% 35%)" }}>
              ✓ No invalidation required
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Model fragility score <strong>{result.fragilityScore}</strong>/100 — within acceptable threshold.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PipelineObservabilityPage() {
  const analysis = useAnalysis();
  const { selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, outdatedSteps, mainTab, businessAnalysisData, adaptiveContext, geoData } = analysis;
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get("id");

  // ── Picker state ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnalyses, setPickerAnalyses] = useState<PickerAnalysis[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [loadingById, setLoadingById] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Whether an analysis is already active (from context)
  const hasActiveAnalysis = !!(selectedProduct || businessAnalysisData);
  // Whether to show the picker (no active context, no URL param)
  const showPicker = !hasActiveAnalysis && !urlId && !loadingById;

  // ── Fetch picker list ──
  const fetchPickerList = useCallback(async () => {
    setPickerLoading(true);
    try {
      const { data, error } = await (supabase.from("saved_analyses") as any)
        .select("id, title, category, era, analysis_type, is_favorite, avg_revival_score, created_at, product_count")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setPickerAnalyses(data ?? []);
    } catch (err) {
      console.error("[PipelineObservabilityPage] Failed to fetch analyses:", err);
      // picker will just be empty
    } finally {
      setPickerLoading(false);
    }
  }, []);

  // Open picker and load list
  const openPicker = useCallback(() => {
    setPickerOpen(true);
    if (pickerAnalyses.length === 0) fetchPickerList();
  }, [pickerAnalyses.length, fetchPickerList]);

  // ── Load by ID (shared by picker click and URL param) ──
  const loadById = useCallback(async (id: string) => {
    setLoadingById(true);
    setLoadError(null);
    try {
      const { data, error } = await (supabase.from("saved_analyses") as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) throw new Error(error?.message ?? "Analysis not found");
      await analysis.handleLoadSaved(data);
      setPickerOpen(false);
    } catch (err: any) {
      setLoadError(err?.message ?? "Failed to load analysis");
    } finally {
      setLoadingById(false);
    }
  }, [analysis]);

  // ── Auto-load from URL param on mount ──
  useEffect(() => {
    if (urlId && !hasActiveAnalysis) {
      loadById(urlId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  // ── Auto-open picker when no active analysis and no URL param ──
  useEffect(() => {
    if (showPicker) openPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Direct link copy ──
  const handleCopyLink = useCallback(() => {
    if (!analysis.analysisId) return;
    const url = `${window.location.origin}/admin/pipeline?id=${analysis.analysisId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [analysis.analysisId]);

  // ── Filtered picker list ──
  const filteredAnalyses = useMemo(() => {
    if (!pickerSearch.trim()) return pickerAnalyses;
    const q = pickerSearch.toLowerCase();
    return pickerAnalyses.filter(a => a.title?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q));
  }, [pickerAnalyses, pickerSearch]);

  // Build pipeline steps from current state
  const pipelineSteps = useMemo<PipelineStep[]>(() => {
    const isBusiness = mainTab === "business";
    const steps: PipelineStep[] = [];

    // Helper
    const dataSize = (d: unknown) => d ? JSON.stringify(d).length : 0;
    const governedKeys = (d: Record<string, unknown> | null) => d ? Object.keys(d).filter(k => d[k] != null) : [];
    const stepStatus = (key: string, data: unknown): PipelineStep["status"] => {
      if (outdatedSteps.has(key)) return "outdated";
      if (data) return "complete";
      return "empty";
    };

    // Step 1: Data Collection
    steps.push({
      id: "input",
      label: "Data Collection & Problem Analysis",
      layer: "INPUT",
      status: selectedProduct ? "complete" : "empty",
      inputSources: ["User form input", "URL scraping", "Photo analysis"],
      outputKeys: ["products[]", "selectedProduct", "adaptiveContext"],
      dataSize: dataSize(selectedProduct) + dataSize(adaptiveContext),
      governedArtifacts: [],
      executionNotes: [
        adaptiveContext?.entity ? `Entity: ${adaptiveContext.entity.name} (${adaptiveContext.entity.type})` : "No adaptive context",
        adaptiveContext?.activeModes ? `Active modes: ${adaptiveContext.activeModes.join(", ")}` : "",
        adaptiveContext?.selectedChallenges ? `${adaptiveContext.selectedChallenges.length} strategic challenges selected` : "",
      ].filter(Boolean),
    });

    // Step 2: Intelligence Synthesis
    const intelData = selectedProduct;
    steps.push({
      id: "intelData",
      label: "Intelligence Synthesis",
      layer: "INTEL",
      status: stepStatus("intelData", intelData),
      inputSources: ["scrape-products → analyze-products"],
      outputKeys: ["overview", "pricingIntel", "supplyChain", "communityInsights", "patentData", "userWorkflow"],
      dataSize: dataSize(intelData),
      governedArtifacts: [],
      executionNotes: intelData ? [
        `Product: ${(intelData as any)?.name || "Unknown"}`,
        `Category: ${(intelData as any)?.category || "Unknown"}`,
        `Potential: ${(intelData as any)?.revivalScore >= 8 ? "Strong" : (intelData as any)?.revivalScore >= 5 ? "Moderate" : "Early"}`,
      ] : ["Not yet generated"],
    });

    if (!isBusiness) {
      // Step 3: Deconstruct
      steps.push({
        id: "disrupt",
        label: "Deconstruct (First Principles)",
        layer: "REASONING + FRAMEWORKS",
        status: stepStatus("disrupt", disruptData),
        inputSources: ["selectedProduct", "activeLens", "activeBranch", "adaptiveContext", "upstreamIntel"],
        outputKeys: ["hiddenAssumptions", "flippedLogic", "redesignedConcept", "governed.*"],
        dataSize: dataSize(disruptData),
        governedArtifacts: governedKeys(governedData),
        executionNotes: disruptData ? [
          `${((disruptData as any)?.hiddenAssumptions || []).length} assumptions extracted`,
          `${((disruptData as any)?.flippedLogic || []).length} logic inversions`,
          governedData?.constraint_map ? "Constraint map: ✓ present" : "Constraint map: ✗ missing",
          governedData?.reasoning_synopsis ? "Reasoning synopsis: ✓ present" : "Reasoning synopsis: ✗ missing",
          governedData?.root_hypotheses || (governedData?.constraint_map as any)?.root_hypotheses ? `Root hypotheses: ${((governedData?.constraint_map as any)?.root_hypotheses || []).length} branches` : "Root hypotheses: ✗ missing",
        ] : ["Not yet generated"],
      });

      // Step 4: Redesign
      steps.push({
        id: "redesign",
        label: "Redesign (Logic Inversion)",
        layer: "FRAMEWORK APPLICATION",
        status: stepStatus("redesign", redesignData),
        inputSources: ["disruptData", "upstreamIntel", "flippedIdeas"],
        outputKeys: ["flippedLogic", "flippedIdeas", "redesignedConcept"],
        dataSize: dataSize(redesignData),
        governedArtifacts: [],
        executionNotes: redesignData ? [
          `Concept: ${(redesignData as any)?.redesignedConcept?.conceptName || "Unknown"}`,
        ] : ["Not yet generated"],
      });

      // Step 5: Stress Test
      steps.push({
        id: "stressTest",
        label: "Adversarial Validation (Stress Test)",
        layer: "METRICS + VALIDATION",
        status: stepStatus("stressTest", stressTestData),
        inputSources: ["selectedProduct", "disruptData", "geoData", "regulatoryData", "competitorIntel", "activeBranch"],
        outputKeys: ["redTeam", "blueTeam", "confidenceScores", "governed.falsification", "governed.decision_synthesis"],
        dataSize: dataSize(stressTestData),
        governedArtifacts: [
          governedData?.falsification ? "falsification" : "",
          governedData?.decision_synthesis ? "decision_synthesis" : "",
        ].filter(Boolean),
        executionNotes: stressTestData ? [
          `Overall viability: ${((stressTestData as any)?.confidenceScores?.overallViability?.score || 0) >= 7 ? "Strong" : "Moderate"}`,
          `Counter-examples: ${((stressTestData as any)?.counterExamples || []).length}`,
          governedData?.falsification ? `Fragility score: ${(governedData.falsification as any)?.model_fragility_score || "N/A"}` : "",
          governedData?.decision_synthesis ? `Decision grade: ${(governedData.decision_synthesis as any)?.decision_grade || "N/A"}` : "",
        ].filter(Boolean) : ["Not yet generated"],
      });

      // Step 6: Pitch Deck
      steps.push({
        id: "pitchDeck",
        label: "Narrative Output (Pitch Deck)",
        layer: "NARRATIVE",
        status: stepStatus("pitchDeck", pitchDeckData),
        inputSources: ["selectedProduct", "disruptData", "stressTestData", "redesignData", "userScores", "insightPreferences"],
        outputKeys: ["slides", "elevatorPitch", "keyMetrics", "investmentAsk", "actionPlans", "visualSpecs"],
        dataSize: dataSize(pitchDeckData),
        governedArtifacts: [],
        executionNotes: pitchDeckData ? [
          `Tagline: ${(pitchDeckData as any)?.tagline || "N/A"}`,
          `Action plans: ${((pitchDeckData as any)?.actionPlans || []).length}`,
          `Visual specs: ${((pitchDeckData as any)?.visualSpecs || []).length}`,
        ] : ["Not yet generated"],
      });
    } else {
      // Business mode pipeline
      steps.push({
        id: "businessAnalysis",
        label: "Business Model Deconstruction",
        layer: "REASONING + FRAMEWORKS",
        status: stepStatus("businessAnalysis", businessAnalysisData),
        inputSources: ["businessModelInput", "activeLens", "adaptiveContext"],
        outputKeys: ["summary", "operational", "assumptions", "technology", "revenue", "disruption", "reinvented", "governed.*"],
        dataSize: dataSize(businessAnalysisData),
        governedArtifacts: governedKeys(governedData),
        executionNotes: businessAnalysisData ? [
          `${(businessAnalysisData as any)?.hiddenAssumptions?.length || 0} assumptions`,
          governedData?.constraint_map ? "Constraint map: ✓" : "Constraint map: ✗",
        ] : ["Not yet generated"],
      });

      steps.push({
        id: "businessStressTest",
        label: "Business Stress Test",
        layer: "METRICS + VALIDATION",
        status: stepStatus("businessStressTest", analysis.businessStressTestData),
        inputSources: ["businessAnalysisData", "selectedProduct"],
        outputKeys: ["redTeam", "blueTeam", "confidenceScores", "governed.falsification"],
        dataSize: dataSize(analysis.businessStressTestData),
        governedArtifacts: [],
        executionNotes: [],
      });

      steps.push({
        id: "businessPitchDeck",
        label: "Business Pitch Deck",
        layer: "NARRATIVE",
        status: stepStatus("pitchDeck", pitchDeckData),
        inputSources: ["businessAnalysisData", "businessStressTestData"],
        outputKeys: ["slides", "elevatorPitch", "investmentAsk"],
        dataSize: dataSize(pitchDeckData),
        governedArtifacts: [],
        executionNotes: [],
      });
    }

    return steps;
  }, [selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, outdatedSteps, mainTab, businessAnalysisData, adaptiveContext, analysis.businessStressTestData]);

  // Compute methodology layer statuses
  const layerStatuses = useMemo(() => {
    const product = selectedProduct as unknown as Record<string, unknown> | null;
    const governed = governedData || {};

    return METHODOLOGY_LAYERS.map(layer => {
      switch (layer.id) {
        case "assumptions":
          return {
            layer,
            status: (disruptData && (disruptData as any)?.hiddenAssumptions?.length > 0) || (governed as any)?.first_principles?.viability_assumptions?.length > 0
              ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `hiddenAssumptions: ${(disruptData as any)?.hiddenAssumptions?.length || 0} items`,
              `viability_assumptions: ${(governed as any)?.first_principles?.viability_assumptions?.length || 0} items (governed)`,
              `Evidence status tagging: ${(governed as any)?.first_principles?.viability_assumptions?.some((a: any) => a.evidence_status) ? "✓ verified/modeled/speculative" : "✗ not present"}`,
              "Edge function: first-principles-analysis → governed.first_principles.viability_assumptions",
            ],
          };
        case "reasoning":
          return {
            layer,
            status: (governed as any)?.reasoning_synopsis ? "ACTIVE" as const : disruptData ? "PARTIALLY IMPLEMENTED" as const : "MISSING" as const,
            evidence: [
              `reasoning_synopsis: ${(governed as any)?.reasoning_synopsis ? "✓ present" : "✗ missing"}`,
              "Source: reasoningFramework.ts (265 lines, 9-step protocol)",
              "Injected into: first-principles-analysis, critical-validation, generate-pitch-deck, business-model-analysis",
              `problem_framing: ${(governed as any)?.reasoning_synopsis?.problem_framing ? "✓" : "✗"}`,
              `core_causal_logic: ${(governed as any)?.reasoning_synopsis?.core_causal_logic ? "✓" : "✗"}`,
              `decision_drivers: ${(governed as any)?.reasoning_synopsis?.decision_drivers ? "✓" : "✗"}`,
            ],
          };
        case "frameworks":
          return {
            layer,
            status: (governed as any)?.constraint_map ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `friction_map: ${(governed as any)?.friction_map ? "✓" : "✗"} — ${((governed as any)?.friction_map || []).length} items`,
              `friction_tiers: ${(governed as any)?.friction_tiers ? "✓" : "✗"} — T1: ${((governed as any)?.friction_tiers?.tier_1 || []).length}, T2: ${((governed as any)?.friction_tiers?.tier_2 || []).length}`,
              `constraint_map: ${(governed as any)?.constraint_map ? "✓" : "✗"} — binding: ${(governed as any)?.constraint_map?.binding_constraint_id || "none"}`,
              `leverage_map: ${(governed as any)?.leverage_map ? "✓" : "✗"} — ${((governed as any)?.leverage_map || []).length} levers`,
              `structural_analysis: ${(governed as any)?.structural_analysis ? "✓" : "✗"}`,
              "Source: governedSchema.ts (569 lines, 11 artifact types)",
            ],
          };
        case "mode_specific":
          return {
            layer,
            status: "ACTIVE" as const,
            evidence: [
              `Current mode: ${mainTab}`,
              "modeEnforcement.ts: resolveMode(), filterInputData(), getModeGuardPrompt()",
              "modeWeighting.ts: buildModeWeightingPrompt() — dimension weights per mode",
              "Active in ALL edge functions: first-principles-analysis, critical-validation, generate-pitch-deck",
              `Input filtering: blocks ${mainTab === "business" ? "physical/supply chain" : mainTab === "service" ? "manufacturing/patents" : "none"} domains`,
            ],
          };
        case "insight_synthesis":
          return {
            layer,
            status: product ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Signal detection: ${product ? detectSignals(product).length + " signals detected" : "no product data"}`,
              `Signal ranking: ${product ? extractAndRankSignals(product).length + " signals ranked" : "no data"}`,
              "signalDetection.ts: 11 signal types, 10 visual ontologies",
              "signalRanking.ts: 6 signal roles (driver, constraint, mechanism, assumption, leverage, outcome)",
              mainTab === "business" ? "⚠ Business mode: signal detection uses product-shaped fields — partial coverage" : "Full coverage for product/service mode",
            ],
          };
        case "strategic_signals":
          return {
            layer,
            status: (governed as any)?.constraint_map?.root_hypotheses?.length > 0 ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Root hypotheses: ${((governed as any)?.constraint_map?.root_hypotheses || []).length} branches`,
              `Strategic profile: ${analysis.strategicProfile.archetype}`,
              "strategicOS.ts: 5 archetypes, calculateDominance(), rankWithProfile()",
              "Adaptive drift: 2% profile evolution on user selections",
              `Hypothesis branching: ${analysis.activeBranchId || "combined"} mode`,
            ],
          };
        case "metrics":
          return {
            layer,
            status: (governed as any)?.decision_synthesis || stressTestData ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Decision grade: ${(governed as any)?.decision_synthesis?.decision_grade || "N/A"}`,
              `Confidence score: ${(governed as any)?.decision_synthesis?.confidence_score || "N/A"}`,
              `Falsification score: ${(governed as any)?.falsification?.model_fragility_score || "N/A"}`,
              "confidenceComputation.ts: evidence-weighted confidence with lens threshold",
              "Scoring calibration: 5-6 default, ≥8 requires evidence, 9-10 almost never",
              `Stress test viability: ${(stressTestData as any)?.confidenceScores?.overallViability?.score || "N/A"}/10`,
            ],
          };
        case "narrative":
          return {
            layer,
            status: pitchDeckData ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Pitch deck: ${pitchDeckData ? "✓ generated" : "✗ not generated"}`,
              `Slides: ${pitchDeckData ? "11-slide structure" : "N/A"}`,
              `Action plans: ${((pitchDeckData as any)?.actionPlans || []).length} plans`,
              `Visual specs: ${((pitchDeckData as any)?.visualSpecs || []).length} specs`,
              "generate-pitch-deck: mode-adaptive prompts, truncation recovery, JSON repair",
            ],
          };
        case "structural_diagnosis":
          return {
            layer,
            status: (governed as any)?.constraint_map || (governed as any)?.friction_map?.length > 0 ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `constraint_map: ${(governed as any)?.constraint_map ? "✓ binding constraint identified" : "✗ missing"}`,
              `friction_map: ${((governed as any)?.friction_map || []).length} friction points`,
              `leverage_map: ${((governed as any)?.leverage_map || []).length} leverage points`,
              "Analyzes: value chain inefficiencies, pricing distortions, trust failures, access barriers",
            ],
          };
        case "eta_analysis":
          return {
            layer,
            status: mainTab === "business" ? "ACTIVE" as const : "PARTIALLY IMPLEMENTED" as const,
            evidence: [
              "DealEconomicsPanel: SBA loan modeling, DSCR computation",
              "BusinessModelAnalysis: ETA tabs (Deal Economics, Addback Scrutiny, Stagnation Dx, Owner Risk, 100-Day Playbook)",
              mainTab === "business" ? "✓ Active in current mode" : "Available via ETA lens in non-business modes",
            ],
          };
        case "financial_modeling": {
          return {
            layer,
            status: "ACTIVE" as const,
            evidence: [
              "financialModelingEngine.ts: deterministic SBA loan calc, valuation, scenario engine",
              "All outputs include DataProvenance metadata (SOURCE/USER_INPUT/MODELED)",
              "Formula: P × r / (1 - (1+r)^-n) for monthly payments",
              "Scenario engine: Base, -10%, -20%, -30%, +10%, +20%",
            ],
          };
        }
        case "innovation_engine": {
          const innovOutput = deriveInnovationOpportunities(governed as any, (disruptData || businessAnalysisData) as any, stressTestData as any);
          const total = countOpportunities(innovOutput);
          return {
            layer,
            status: total > 0 ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `${total} innovation opportunities derived`,
              `Structural leverage: ${innovOutput.structural_leverage.length}`,
              `Pricing shifts: ${innovOutput.pricing_model_shifts.length}`,
              `Automation: ${innovOutput.automation_opportunities.length}`,
              "Source: innovationEngine.ts — derives from constraint_map, friction_map, stress test",
            ],
          };
        }
        case "data_provenance":
          return {
            layer,
            status: "ACTIVE" as const,
            evidence: [
              "dataProvenance.ts: ProvenancedValue<T> type with full metadata",
              "financialModelingEngine.ts: all outputs use modeledValue() with provenance",
              "DealEconomicsPanel: ProvenanceBadge UI shows SOURCE/USER_INPUT/MODELED",
              "Types: SOURCE (external data), USER_INPUT (user-provided), MODELED (deterministic formula)",
            ],
          };
        default:
          return { layer, status: "MISSING" as const, evidence: [] };
      }
    });
  }, [selectedProduct, disruptData, stressTestData, pitchDeckData, governedData, mainTab, analysis.strategicProfile, analysis.activeBranchId, businessAnalysisData]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = pipelineSteps.filter(s => s.status === "complete").length;
    const total = pipelineSteps.length;
    const totalDataSize = pipelineSteps.reduce((s, p) => s + p.dataSize, 0);
    const totalArtifacts = pipelineSteps.reduce((s, p) => s + p.governedArtifacts.length, 0);
    const activeLayers = layerStatuses.filter(l => l.status === "ACTIVE").length;
    return { completed, total, totalDataSize, totalArtifacts, activeLayers };
  }, [pipelineSteps, layerStatuses]);

  // Reconstructed analysisData for health/evidence panels
  const analysisData = useMemo<Record<string, unknown> | null>(() => {
    if (!governedData && !disruptData && !stressTestData && !pitchDeckData && !businessAnalysisData) return null;
    return {
      governed: governedData ?? undefined,
      disrupt: disruptData ?? undefined,
      stressTest: stressTestData ?? undefined,
      pitchDeck: pitchDeckData ?? undefined,
      geoOpportunity: geoData ?? undefined,
      intelData: selectedProduct ?? undefined,
    };
  }, [governedData, disruptData, stressTestData, pitchDeckData, businessAnalysisData, geoData, selectedProduct]);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <PlatformNav tier="explorer" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Pipeline Observability Console</h1>
          </div>
          <p className="text-sm text-muted-foreground">Real-time execution status, data flow, and methodology layer verification for the active analysis.</p>
        </div>

        {/* ── Loading spinner (URL param auto-load) ── */}
        {loadingById && (
          <div className="flex items-center justify-center gap-3 py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Loading analysis…</span>
          </div>
        )}

        {/* ── Error state (URL param not found) ── */}
        {loadError && !loadingById && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Failed to load analysis</p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
            </div>
          </div>
        )}

        {/* ── Analysis Picker Panel (Mode 1) ── */}
        {!loadingById && !hasActiveAnalysis && !urlId && (
          <div className="rounded-lg border border-border" style={{ background: "hsl(var(--card))" }}>
            {pickerOpen ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-extrabold text-foreground">Select an Analysis to Inspect</h2>
                  </div>
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                    aria-label="Close picker"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter by title or category…"
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* List */}
                {pickerLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading analyses…</span>
                  </div>
                ) : filteredAnalyses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {pickerSearch ? "No analyses match your search." : "No saved analyses found."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {filteredAnalyses.map(a => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{a.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            {a.analysis_type && (
                              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase text-[10px] tracking-wider">
                                {a.analysis_type.replace(/_/g, " ")}
                              </span>
                            )}
                            <span>{a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : ""}</span>
                            {a.avg_revival_score != null && (
                              <span>Avg score: {a.avg_revival_score.toFixed(1)}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => loadById(a.id)}
                          disabled={loadingById}
                          className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                        >
                          {loadingById ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openPicker}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database className="w-4 h-4" />
                  <span className="text-sm">No analysis loaded — click to pick one</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* ── Loaded banner (analysis is active) ── */}
        {hasActiveAnalysis && (
          <div className="rounded-lg border border-border bg-card flex items-center justify-between px-4 py-2.5 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">
                Loaded: {(selectedProduct as any)?.name || (businessAnalysisData as any)?.business_name || analysis.analysisId || "Active analysis"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {analysis.analysisId && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
                  title="Copy direct link to this analysis"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-green-600" /> : <Link2 className="w-3 h-3" />}
                  {copied ? "Copied!" : "Direct link"}
                </button>
              )}
              <button
                onClick={openPicker}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                <RefreshCw className="w-3 h-3" />
                Change
              </button>
            </div>
          </div>
        )}

        {/* ── Picker when changing analysis (while active) ── */}
        {hasActiveAnalysis && pickerOpen && (
          <div className="rounded-lg border border-border" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-extrabold text-foreground">Switch Analysis</h2>
                </div>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                  aria-label="Close picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by title or category…"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {pickerLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading analyses…</span>
                </div>
              ) : filteredAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {pickerSearch ? "No analyses match your search." : "No saved analyses found."}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredAnalyses.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{a.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                          {a.analysis_type && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase text-[10px] tracking-wider">
                              {a.analysis_type.replace(/_/g, " ")}
                            </span>
                          )}
                          <span>{a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : ""}</span>
                          {a.avg_revival_score != null && (
                            <span>Avg score: {a.avg_revival_score.toFixed(1)}</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => loadById(a.id)}
                        disabled={loadingById}
                        className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                      >
                        {loadingById ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main diagnostics content (only render when not loading) ── */}
        {!loadingById && (
          <>
            {/* System Health Score Panel */}
            {analysisData && (
              <CollapsibleSection title="System Health Score" icon={Shield} defaultOpen>
                <SystemHealthPanel analysisData={analysisData} />
              </CollapsibleSection>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Steps Complete", value: `${stats.completed}/${stats.total}`, icon: CheckCircle2, color: "hsl(142 70% 35%)" },
                { label: "Data Flowing", value: `${(stats.totalDataSize / 1024).toFixed(0)}KB`, icon: Database, color: "hsl(var(--primary))" },
                { label: "Governed Artifacts", value: String(stats.totalArtifacts), icon: Shield, color: "hsl(38 92% 42%)" },
                { label: "Active Layers", value: `${stats.activeLayers}/13`, icon: Layers, color: "hsl(var(--primary))" },
              ].map((card, i) => (
                <div key={i} className="rounded-lg border border-border p-4 flex items-center gap-3" style={{ background: "hsl(var(--card))" }}>
                  <card.icon className="w-5 h-5 flex-shrink-0" style={{ color: card.color }} />
                  <div>
                    <p className="text-lg font-black text-foreground">{card.value}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 1: Methodology Layer Audit */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-extrabold text-foreground">Methodology Layer Audit</h2>
              </div>
              <div className="space-y-2">
                {layerStatuses.map((ls) => (
                  <LayerCard key={ls.layer.id} layer={ls.layer} status={ls.status} evidence={ls.evidence} />
                ))}
              </div>
            </section>

            {/* Section 2: Pipeline Execution Trace */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-extrabold text-foreground">Pipeline Execution Trace</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{mainTab.toUpperCase()} MODE</span>
              </div>
              <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
                {pipelineSteps.map((step, i) => (
                  <StepRow key={step.id} step={step} isLast={i === pipelineSteps.length - 1} />
                ))}
              </div>
            </section>

            {/* Section 3: Data Flow Summary */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-extrabold text-foreground">Data Flow Summary</h2>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
                <div className="text-sm text-foreground space-y-1 font-mono">
                  <p>USER INPUT</p>
                  <p className="text-muted-foreground pl-4">↓ analyze-problem → adaptiveContext</p>
                  <p className="text-muted-foreground pl-4">↓ scrape-products → rawContent</p>
                  <p>INTELLIGENCE SYNTHESIS (analyze-products)</p>
                  <p className="text-muted-foreground pl-4">↓ Product[] + pricingIntel + supplyChain + patents + community</p>
                  <p className="text-muted-foreground pl-4">↓ geo-market-data → geoData [background]</p>
                  <p>{mainTab === "business" ? "BUSINESS MODEL ANALYSIS" : "REASONING ENGINE (first-principles-analysis)"}</p>
                  <p className="text-muted-foreground pl-4">↓ governed: constraint_map, friction_tiers, leverage_map, reasoning_synopsis</p>
                  <p>STRATEGIC OS (rankWithProfile)</p>
                  <p className="text-muted-foreground pl-4">↓ dominance-ranked hypotheses + adaptive drift</p>
                  {mainTab !== "business" && (
                    <>
                      <p>REDESIGN (generate-flip-ideas)</p>
                      <p className="text-muted-foreground pl-4">↓ flippedIdeas, redesignedConcept</p>
                    </>
                  )}
                  <p>ADVERSARIAL VALIDATION (critical-validation)</p>
                  <p className="text-muted-foreground pl-4">↓ redTeam, blueTeam, confidenceScores, governed.falsification</p>
                  <p>OUTPUT GENERATION (generate-pitch-deck)</p>
                  <p className="text-muted-foreground pl-4">↓ 11-slide deck, actionPlans, visualSpecs</p>
                  <p>PERSISTENCE (checkpoint gate → governed extraction → evidence registry → fingerprinting)</p>
                </div>
              </div>
            </section>

            {/* Section 4: Outdated Steps */}
            {outdatedSteps.size > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" style={{ color: "hsl(38 92% 42%)" }} />
                  <h2 className="text-lg font-extrabold text-foreground">Outdated Steps</h2>
                </div>
                <div className="rounded-lg border border-border p-4 space-y-2" style={{ background: "hsl(var(--card))" }}>
                  {[...outdatedSteps].map(step => (
                    <div key={step} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: "hsl(38 92% 42%)" }} />
                      <span className="text-sm font-bold text-foreground">{step}</span>
                      <span className="text-xs text-muted-foreground">— needs regeneration due to upstream changes</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 5: Governed Artifact Inspector */}
            <CollapsibleSection title="Governed Artifact Inspector" icon={Shield} defaultOpen={false}>
              <GovernedArtifactInspector governedData={governedData} />
            </CollapsibleSection>

            {/* Section 6: Step Data Inspector */}
            <CollapsibleSection title="Step Data Inspector" icon={Database} defaultOpen={false}>
              <StepDataInspector
                disruptData={disruptData}
                redesignData={redesignData}
                stressTestData={stressTestData}
                pitchDeckData={pitchDeckData}
                businessAnalysisData={businessAnalysisData}
                governedData={governedData}
                adaptiveContext={adaptiveContext}
              />
            </CollapsibleSection>

            {/* Section 7: Evidence Registry */}
            <CollapsibleSection title="Evidence Registry" icon={Activity} defaultOpen={false}>
              <EvidenceRegistryPanel analysisData={analysisData} />
            </CollapsibleSection>

            {/* Invalidation Check */}
            {governedData?.falsification && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-extrabold text-foreground">Invalidation Check</h2>
                </div>
                <InvalidationPanel governedData={governedData} />
              </section>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Pipeline Observability Console • {new Date().toISOString().split("T")[0]} • {pipelineSteps.length} steps tracked • {stats.activeLayers}/13 methodology layers active
          </p>
        </div>
      </div>
    </div>
  );
}
