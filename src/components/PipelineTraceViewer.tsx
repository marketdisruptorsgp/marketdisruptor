import { useState } from "react";
import type { PipelineTrace, EdgeFunctionTrace } from "@/lib/pipelineTrace";
import { AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, Clock, Zap, Database, Brain } from "lucide-react";

// ── Edge response summariser ──────────────────────────────────────────────────

function summarizeEdgeResponse(fn: string, data: any): string {
  if (!data) return "no response data";

  if (fn === "scrape-products") {
    const stats = data.stats;
    const sources = Array.isArray(data.sources) ? data.sources.length : 0;
    if (stats) {
      return `pages=${stats.totalPages ?? "?"}, communityPosts=${stats.communityPosts ?? "?"}, complaintSignals=${stats.complaintSignals ?? "?"}, sources=${sources}`;
    }
    return `sources=${sources}`;
  }

  if (fn === "scrape-market-news") {
    const items = Array.isArray(data.news) ? data.news : Array.isArray(data.items) ? data.items : [];
    const dates = items.map((x: any) => x.published_at).filter(Boolean).sort();
    const dateRange = dates.length >= 2 ? ` (${dates[0]?.slice(0, 10)} – ${dates[dates.length - 1]?.slice(0, 10)})` : "";
    return `${items.length} news items${dateRange}`;
  }

  if (fn === "scrape-trend-intel") {
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data.results) ? data.results : [];
    return `${items.length} trend signals`;
  }

  if (fn === "scrape-patent-intel") {
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data.results) ? data.results : [];
    return `${items.length} patent records`;
  }

  if (fn === "research-pricing-intel") {
    const rows = Array.isArray(data.rows) ? data.rows.length : 0;
    const competitors = Array.isArray(data.competitors) ? data.competitors.length : 0;
    return `pricingRows=${rows}, competitors=${competitors}`;
  }

  if (fn === "geo-market-data") {
    const topCount =
      data.geoData?.us?.topStates?.length ??
      data.geoData?.topMarkets?.length ??
      0;
    const reg = data.geoData?.regulatoryProfile?.regulatoryRelevance ?? "none";
    return `topMarkets=${topCount}, regulatory=${reg}`;
  }

  if (fn === "industry-benchmarks") {
    const b = data.benchmarks;
    const naics = b?.naicsCode ?? b?.naics_code ?? "n/a";
    const year = b?.year ?? "n/a";
    const src = b?.source ?? "unknown";
    return `NAICS=${naics}, year=${year}, source=${src}`;
  }

  // Governed artifact functions
  const governed = data?.governed ?? data?.data?.governed;
  if (governed && typeof governed === "object") {
    const keys = Object.keys(governed);
    const preview = keys.slice(0, 4).join(", ");
    return `${keys.length} governed artifact${keys.length !== 1 ? "s" : ""}: ${preview}${keys.length > 4 ? ", …" : ""}`;
  }

  // Fallback: list top-level keys
  const keys = Object.keys(data);
  return `keys=[${keys.slice(0, 5).join(", ")}${keys.length > 5 ? "…" : ""}]`;
}

function edgeFunctionCategory(fn: string): { label: string; icon: React.ReactNode } {
  if (fn.startsWith("scrape-") || fn === "research-pricing-intel") {
    return { label: "Scraped via Firecrawl / web", icon: <Database size={10} className="text-blue-400" /> };
  }
  if (fn === "geo-market-data" || fn === "industry-benchmarks") {
    return { label: "Public data API (Census/BLS/SBA)", icon: <Database size={10} className="text-emerald-400" /> };
  }
  return { label: "AI computation (Gemini)", icon: <Brain size={10} className="text-violet-400" /> };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{title}</p>
      {note && <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{note}</p>}
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border"
      style={color ? { borderColor: `${color}40`, background: `${color}10`, color } : undefined}
    >
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

// ── Edge functions section ────────────────────────────────────────────────────

function EdgeFunctionRow({ entry }: { entry: EdgeFunctionTrace }) {
  const [expanded, setExpanded] = useState(false);
  const cat = edgeFunctionCategory(entry.functionName);
  const summary = summarizeEdgeResponse(entry.functionName, entry.responseData);

  const statusColor =
    entry.status === "success"
      ? "text-emerald-500"
      : entry.status === "timeout"
        ? "text-amber-500"
        : "text-red-500";
  const StatusIcon =
    entry.status === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-2 px-2.5 py-2 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="mt-0.5 flex-shrink-0">
          {expanded ? <ChevronDown size={11} className="text-muted-foreground" /> : <ChevronRight size={11} className="text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-foreground">{entry.functionName}</span>
            <StatusIcon size={10} className={statusColor} />
            <span className={`text-[9px] font-semibold ${statusColor}`}>{entry.status}</span>
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Clock size={9} /> {entry.durationMs}ms
            </span>
          </div>
          <div className="flex items-center gap-1">
            {cat.icon}
            <span className="text-[9px] text-muted-foreground">{cat.label}</span>
          </div>
          <p className="text-[10px] text-foreground/80 leading-snug">{summary}</p>
          {entry.requestBodyKeys.length > 0 && (
            <p className="text-[9px] text-muted-foreground">
              req keys: {entry.requestBodyKeys.join(", ")}
            </p>
          )}
          {entry.error && (
            <p className="text-[9px] text-red-400">{entry.error}</p>
          )}
        </div>
      </button>
      {expanded && entry.responseData && (
        <div className="px-2.5 pb-2 bg-muted/20 border-t border-border/30">
          <p className="text-[9px] font-semibold text-muted-foreground mb-1 mt-1.5">Response data (truncated):</p>
          <pre className="text-[9px] text-foreground/70 whitespace-pre-wrap break-all leading-relaxed overflow-hidden max-h-40">
            {JSON.stringify(entry.responseData, null, 2).slice(0, 800)}
            {JSON.stringify(entry.responseData, null, 2).length > 800 ? "\n…" : ""}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Evidence extraction section ───────────────────────────────────────────────

function EvidenceSection({ trace }: { trace: PipelineTrace }) {
  const ev = trace.evidenceExtraction;
  if (!ev) return <p className="text-[10px] text-muted-foreground italic">Not yet captured.</p>;

  const typeCounts: Record<string, number> = {};
  const tierCounts: Record<string, number> = {};
  const engineCounts: Record<string, number> = {};
  for (const lbl of ev.evidenceLabels) {
    typeCounts[lbl.type] = (typeCounts[lbl.type] ?? 0) + 1;
    tierCounts[lbl.tier] = (tierCounts[lbl.tier] ?? 0) + 1;
    if (lbl.sourceEngine) engineCounts[lbl.sourceEngine] = (engineCounts[lbl.sourceEngine] ?? 0) + 1;
  }

  return (
    <div className="space-y-3">
      {/* Dedup stats */}
      <div className="flex flex-wrap gap-1.5">
        <Chip label="raw" value={ev.rawTotalBeforeDedup} />
        <Chip label="deduped" value={ev.dedupedTotal} color="#10b981" />
        <Chip label="losses" value={ev.dedupLosses} color="#f59e0b" />
      </div>
      <p className="text-[9px] text-muted-foreground italic leading-relaxed">
        Deduplication merges signals by label+type+mode; `sourceCount` is incremented per duplicate. Confidence scoring
        via `computeConfidenceScores` combines tier, sourceCount, and corroboration — <strong>deterministic, no AI</strong>.
      </p>

      {/* Extractor counts */}
      <div>
        <p className="text-[9px] font-semibold text-muted-foreground mb-1">Extractor breakdown:</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(ev.extractorCounts).map(([k, v]) => (
            <Chip key={k} label={k} value={v} />
          ))}
        </div>
      </div>

      {/* By type */}
      {Object.keys(typeCounts).length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground mb-1">By evidence type:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Chip key={k} label={k} value={v} />
            ))}
          </div>
        </div>
      )}

      {/* By tier */}
      {Object.keys(tierCounts).length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground mb-1">By tier:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(tierCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Chip key={k} label={k} value={v} />
            ))}
          </div>
        </div>
      )}

      {/* By source engine */}
      {Object.keys(engineCounts).length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground mb-1">By source engine:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(engineCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Chip key={k} label={k} value={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Strategic engine section ──────────────────────────────────────────────────

function StrategicSection({ trace }: { trace: PipelineTrace }) {
  const st = trace.strategicStages;
  const diag = trace.pipelineDiagnosticSummary;

  if (!st && !diag) return <p className="text-[10px] text-muted-foreground italic">Not yet captured.</p>;

  const aiGateColor = st?.stage6_aiGatePassed ? "#10b981" : "#f59e0b";
  const modeColor = st?.stage6_mode === "ai" ? "#8b5cf6" : st?.stage6_mode === "deterministic" ? "#3b82f6" : "#9ca3af";
  const engineFailed = st?.stage6_mode === "skipped" && st?.stage6_skipReason?.toLowerCase().includes("failed");

  return (
    <div className="space-y-3">
      <p className="text-[9px] text-muted-foreground italic leading-relaxed">
        Strategic synthesis uses deterministic scoring &amp; reasoning-chain checks through stages 1–5, then
        conditionally uses AI deepening if the quality gate passes (stage 6).
      </p>
      {engineFailed && (
        <div className="flex items-start gap-1.5 text-[9px] text-red-600 bg-red-500/10 rounded px-2 py-1.5 border border-red-500/20">
          <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
          <span><strong>Engine failure:</strong> Both async and sync strategic engines failed. Check the Events &amp; Error Timeline for details.</span>
        </div>
      )}

      {st && (
        <>
          {/* Stages 1–2 */}
          <div className="rounded-lg border border-border/40 px-2.5 py-2 space-y-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Stages 1–2: Normalization</p>
            <div className="flex flex-wrap gap-1">
              <Chip label="raw" value={st.stage1_rawEvidenceCount} />
              <Chip label="normalized" value={st.stage2_normalizedCount} color="#10b981" />
              <Chip label="dedupLosses" value={st.stage2_dedupLosses} color="#f59e0b" />
            </div>
            <p className="text-[9px] text-muted-foreground">
              Facets:{" "}
              {st.stage2b_facetsPopulated ? (
                <span className="text-emerald-500 font-semibold">populated</span>
              ) : (
                <span className="text-amber-500 font-semibold">skipped{st.stage2b_facetSkipReason ? ` — ${st.stage2b_facetSkipReason}` : ""}</span>
              )}
            </p>
          </div>

          {/* Stages 3–4 */}
          <div className="rounded-lg border border-border/40 px-2.5 py-2 space-y-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Stages 3–4: Constraints &amp; Profile</p>
            {st.stage3_constraintHypotheses.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">Constraint hypotheses (detected via deterministic pattern-matching):</p>
                <div className="space-y-0.5">
                  {st.stage3_constraintHypotheses.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px]">
                      <span className="text-foreground font-semibold">{h.name}</span>
                      <span className="text-muted-foreground">evidence={h.evidenceCount}</span>
                    </div>
                  ))}
                  {st.stage3_constraintHypotheses.length > 5 && (
                    <p className="text-[9px] text-muted-foreground">+{st.stage3_constraintHypotheses.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
            {st.stage4_structuralProfile && (
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">Structural profile:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(st.stage4_structuralProfile)
                    .filter(([, v]) => v !== null && v !== undefined)
                    .map(([k, v]) => (
                      <Chip key={k} label={k} value={String(v)} />
                    ))}
                </div>
              </div>
            )}
            {st.stage4_bindingConstraints.length > 0 && (
              <p className="text-[9px] text-muted-foreground">
                Binding constraints: <span className="text-foreground font-semibold">{st.stage4_bindingConstraints.join(", ")}</span>
              </p>
            )}
          </div>

          {/* Stages 5–6 */}
          <div className="rounded-lg border border-border/40 px-2.5 py-2 space-y-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Stages 5–6: Patterns &amp; AI Gate</p>
            {st.stage5_qualifiedPatterns.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">
                  Qualified patterns (score = weighted density of supporting vs conflicting signals; deterministic):
                </p>
                <div className="space-y-0.5">
                  {st.stage5_qualifiedPatterns.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[9px]">
                      <span className="text-foreground font-semibold">{p.name}</span>
                      <span className="text-muted-foreground">density={(p.signalDensity ?? 0).toFixed(2)}</span>
                      <span className="text-emerald-500">+{p.strengthSignals.length}</span>
                      <span className="text-red-400">-{p.weaknessSignals.length}</span>
                    </div>
                  ))}
                  {st.stage5_qualifiedPatterns.length > 5 && (
                    <p className="text-[9px] text-muted-foreground">+{st.stage5_qualifiedPatterns.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[9px] text-muted-foreground">AI gate:</span>
              <span className="text-[9px] font-semibold" style={{ color: aiGateColor }}>
                {st.stage6_aiGatePassed ? "PASSED" : "FAILED"}
              </span>
              <span className="text-[9px] text-muted-foreground">mode:</span>
              <span className="text-[9px] font-semibold" style={{ color: modeColor }}>{st.stage6_mode}</span>
            </div>
            {st.stage6_aiGateDetails && Object.keys(st.stage6_aiGateDetails).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(st.stage6_aiGateDetails).map(([k, v]) => (
                  <Chip key={k} label={k} value={String(v)} />
                ))}
              </div>
            )}
            {st.stage6_deepenedLabels.length > 0 && (
              <p className="text-[9px] text-muted-foreground">
                Thesis labels: <span className="text-foreground">{st.stage6_deepenedLabels.slice(0, 6).join(", ")}{st.stage6_deepenedLabels.length > 6 ? ", …" : ""}</span>
              </p>
            )}
            {st.stage6_skipReason && (
              <p className="text-[9px] text-amber-600 bg-amber-500/10 rounded px-2 py-1 border border-amber-500/20">
                <span className="font-semibold">Skip reason:</span> {st.stage6_skipReason}
              </p>
            )}
          </div>
        </>
      )}

      {/* Reasoning chain badges from pipelineDiagnosticSummary */}
      {diag?.reasoningChain && typeof diag.reasoningChain === "object" && (
        <div className="rounded-lg border border-border/40 px-2.5 py-2 space-y-1.5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Reasoning Chain Health</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(diag.reasoningChain as Record<string, any>).map(([key, val]) => {
              const passed = val?.passed !== false && val?.ok !== false;
              const color = passed ? "#10b981" : "#f59e0b";
              const count = val?.count ?? val?.value ?? "";
              const min = val?.minimum ?? val?.min ?? "";
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border"
                  style={{ borderColor: `${color}40`, background: `${color}10`, color }}
                >
                  {key}{count !== "" ? `: ${count}` : ""}{min !== "" ? ` / ${min} min` : ""}
                  {" "}{passed ? "✓" : "⚠"}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Morphological engine section ──────────────────────────────────────────────

function MorphologicalSection({ trace }: { trace: PipelineTrace }) {
  const m = trace.morphological;
  if (!m) return <p className="text-[10px] text-muted-foreground italic">Not yet captured.</p>;

  const runModeColor = m.runMode === "full" ? "#10b981" : "#f59e0b";

  return (
    <div className="space-y-2">
      <p className="text-[9px] text-muted-foreground italic leading-relaxed">
        All morphological computations are deterministic transforms over evidence and constraints — no AI calls in this layer.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border"
          style={{ borderColor: `${runModeColor}40`, background: `${runModeColor}10`, color: runModeColor }}
        >
          <Zap size={9} /> {m.runMode} mode
        </span>
        {m.degradedConfidence && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-red-400/40 bg-red-400/10 text-red-400">
            <AlertTriangle size={9} /> degraded confidence
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {[
          ["evidence", m.evidenceCount],
          ["full threshold", m.fullThreshold],
          ["limited threshold", m.limitedThreshold],
          ["zones", m.zoneCount],
          ["vectors", m.vectorCount],
          ["constraint inversions", m.constraintInversionCount],
          ["2nd-order unlocks", m.secondOrderUnlockCount],
          ["temporal unlocks", m.temporalUnlockCount],
          ["competitive gaps", m.competitiveGapCount],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded border border-border/40 px-2 py-1.5 bg-muted/20">
            <p className="text-[9px] text-muted-foreground">{label}</p>
            <p className="text-[11px] font-bold text-foreground">{String(val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Events & errors section ───────────────────────────────────────────────────

function EventsSection({ trace }: { trace: PipelineTrace }) {
  const allEntries: { text: string; isError: boolean }[] = [
    ...trace.events.map(e => ({ text: e, isError: false })),
    ...trace.errors.map(e => ({ text: e, isError: true })),
  ].sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: "base" }));

  if (allEntries.length === 0) return <p className="text-[10px] text-muted-foreground italic">No events recorded.</p>;

  return (
    <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg border border-border/30 bg-muted/10 px-2 py-1.5">
      {allEntries.map((entry, i) => (
        <div key={i} className={`flex items-start gap-1.5 text-[9px] leading-snug ${entry.isError ? "text-red-400" : "text-foreground/70"}`}>
          <span className="flex-shrink-0 mt-0.5">{entry.isError ? "✖" : "·"}</span>
          <span className="break-all">{entry.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main viewer ───────────────────────────────────────────────────────────────

export default function PipelineTraceViewer({ trace }: { trace: PipelineTrace }) {
  const [openSection, setOpenSection] = useState<string | null>("edge");

  const toggle = (id: string) => setOpenSection(prev => prev === id ? null : id);

  // Status badge colour + label
  const traceStatus = (trace as any).status ?? (trace.completedAt ? "completed" : "running");
  const isRunning = traceStatus === "running" || !trace.completedAt;
  const runId = (trace as any).runId as string | undefined;

  const sections: { id: string; title: string; note?: string; content: React.ReactNode }[] = [
    {
      id: "edge",
      title: "1. Edge Functions & Data Sources",
      content: (
        <div className="space-y-1.5">
          {trace.edgeFunctions.length === 0
            ? <p className="text-[10px] text-muted-foreground italic">No edge calls recorded.</p>
            : [...trace.edgeFunctions]
                .sort((a, b) => (a.calledAt ?? "").localeCompare(b.calledAt ?? ""))
                .map((entry, i) => <EdgeFunctionRow key={i} entry={entry} />)
          }
        </div>
      ),
    },
    {
      id: "evidence",
      title: "2. Evidence Extraction & Normalization",
      content: <EvidenceSection trace={trace} />,
    },
    {
      id: "strategic",
      title: "3. Strategic Engine (Stages 1–6)",
      content: <StrategicSection trace={trace} />,
    },
    {
      id: "morphological",
      title: "4. Morphological Engine",
      content: <MorphologicalSection trace={trace} />,
    },
    {
      id: "events",
      title: "5. Events & Error Timeline",
      content: <EventsSection trace={trace} />,
    },
  ];

  return (
    <div className="space-y-1.5">
      {/* Trace identity + status header */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-0.5 flex-wrap">
        <span>traceId: <span className="font-mono text-foreground">{trace.traceId}</span></span>
        {runId && <span>runId: <span className="font-mono text-foreground">{runId}</span></span>}
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${
          traceStatus === "completed" ? "bg-emerald-500/15 text-emerald-600" :
          traceStatus === "failed"    ? "bg-red-500/15 text-red-600" :
                                        "bg-amber-500/15 text-amber-600"
        }`}>
          {traceStatus}
        </span>
        {trace.startedAt && <span>started: {new Date(trace.startedAt).toLocaleTimeString()}</span>}
        {trace.completedAt && <span>completed: {new Date(trace.completedAt).toLocaleTimeString()}</span>}
      </div>
      {isRunning && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-500/10 rounded px-2 py-1.5 border border-amber-500/20">
          <AlertTriangle size={10} className="flex-shrink-0" />
          <span>
            <strong>Incomplete trace</strong> — pipeline is still running. Downloading now will produce a partial JSON.
            Wait for the analysis to finish before downloading for complete diagnostics.
          </span>
        </div>
      )}
      {sections.map(({ id, title, note, content }) => (
        <div key={id} className="rounded-lg border border-border/40 overflow-hidden">
          <button
            onClick={() => toggle(id)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-left"
          >
            <SectionHeader title={title} note={note} />
            {openSection === id
              ? <ChevronDown size={12} className="text-muted-foreground flex-shrink-0" />
              : <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
            }
          </button>
          {openSection === id && (
            <div className="px-3 pb-3 border-t border-border/30 pt-2">
              {content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}