/**
 * StrategicScenarioSimulator — "What if we…" Interactive Panel
 *
 * Users select a scenario type, adjust parameters, and see
 * projected strategic outcomes recomputed in real time.
 *
 * Sits in Tier 3 of the Command Deck as the experimentation layer.
 */

import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, TrendingUp, TrendingDown, ArrowRight,
  ChevronDown, ChevronUp, AlertTriangle, Play, X, Minus,
} from "lucide-react";
import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import {
  SCENARIO_TEMPLATES,
  simulateScenario,
  type ScenarioDefinition,
  type ScenarioProjection,
  type ScenarioTemplate,
} from "@/lib/strategicScenarioEngine";

interface StrategicScenarioSimulatorProps {
  evidence: Evidence[];
  narrative: StrategicNarrative | null;
}

function DirectionIcon({ dir }: { dir: "up" | "down" | "neutral" }) {
  if (dir === "up") return <TrendingUp size={13} style={{ color: "hsl(var(--success))" }} />;
  if (dir === "down") return <TrendingDown size={13} style={{ color: "hsl(var(--destructive))" }} />;
  return <Minus size={13} className="text-muted-foreground" />;
}

function confidenceStyle(c: "high" | "moderate" | "low") {
  const map = {
    high: { bg: "hsl(var(--success) / 0.1)", text: "hsl(var(--success))", label: "High confidence" },
    moderate: { bg: "hsl(var(--warning) / 0.1)", text: "hsl(var(--warning))", label: "Moderate confidence" },
    low: { bg: "hsl(var(--muted) / 0.3)", text: "hsl(var(--muted-foreground))", label: "Early estimate" },
  };
  return map[c];
}

export const StrategicScenarioSimulator = memo(function StrategicScenarioSimulator({
  evidence,
  narrative,
}: StrategicScenarioSimulatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(null);
  const [magnitude, setMagnitude] = useState(30);
  const [activeProjection, setActiveProjection] = useState<ScenarioProjection | null>(null);
  const [hypothesis, setHypothesis] = useState("");

  const handleSelectTemplate = useCallback((tmpl: ScenarioTemplate) => {
    setSelectedTemplate(tmpl);
    setMagnitude(tmpl.defaultMagnitude);
    setActiveProjection(null);
    setHypothesis("");
  }, []);

  const handleSimulate = useCallback(() => {
    if (!selectedTemplate) return;
    const scenario: ScenarioDefinition = {
      id: `sim-${Date.now()}`,
      type: selectedTemplate.type,
      label: selectedTemplate.label,
      description: selectedTemplate.description,
      hypothesis: hypothesis || selectedTemplate.description,
      magnitude,
      affectedCategories: selectedTemplate.affectedCategories,
    };
    const result = simulateScenario(scenario, evidence, narrative);
    setActiveProjection(result);
  }, [selectedTemplate, magnitude, hypothesis, evidence, narrative]);

  const handleClose = useCallback(() => {
    setSelectedTemplate(null);
    setActiveProjection(null);
    setHypothesis("");
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <FlaskConical size={14} className="text-primary" />
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Strategy Simulator
            </span>
            <span className="text-[10px] font-bold text-muted-foreground ml-2">
              Test strategic moves before executing
            </span>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={14} className="text-muted-foreground" />
          : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* ═══ Scenario Selector ═══ */}
              {!selectedTemplate && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-3">
                    What strategic move do you want to test?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SCENARIO_TEMPLATES.map(tmpl => (
                      <button
                        key={tmpl.type}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className="rounded-lg p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: "hsl(var(--muted) / 0.3)",
                          border: "1px solid hsl(var(--border))",
                        }}
                      >
                        <span className="text-lg">{tmpl.icon}</span>
                        <p className="text-xs font-bold text-foreground mt-1">{tmpl.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {tmpl.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ Scenario Configuration ═══ */}
              {selectedTemplate && !activeProjection && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedTemplate.icon}</span>
                      <span className="text-sm font-bold text-foreground">{selectedTemplate.label}</span>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded hover:bg-muted/50 transition-colors">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>

                  {/* Magnitude slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        {selectedTemplate.magnitudeLabel}
                      </label>
                      <span className="text-sm font-black text-primary">
                        {magnitude > 0 ? "+" : ""}{magnitude}{selectedTemplate.magnitudeUnit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={selectedTemplate.type === "pricing_change" ? -50 : 5}
                      max={selectedTemplate.type === "pricing_change" ? 100 : 100}
                      step={5}
                      value={magnitude}
                      onChange={e => setMagnitude(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ background: "hsl(var(--muted))" }}
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>{selectedTemplate.type === "pricing_change" ? "-50%" : "5%"}</span>
                      <span>{selectedTemplate.type === "pricing_change" ? "+100%" : "100%"}</span>
                    </div>
                  </div>

                  {/* Hypothesis input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Your hypothesis (optional)
                    </label>
                    <input
                      type="text"
                      value={hypothesis}
                      onChange={e => setHypothesis(e.target.value)}
                      placeholder={`e.g. "What if we ${selectedTemplate.label.toLowerCase()}..."`}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-background text-foreground placeholder:text-muted-foreground"
                      style={{ border: "1px solid hsl(var(--border))" }}
                    />
                  </div>

                  {/* Run button */}
                  <button
                    onClick={handleSimulate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    <Play size={13} />
                    Simulate This Scenario
                  </button>
                </div>
              )}

              {/* ═══ Projection Results ═══ */}
              {activeProjection && selectedTemplate && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedTemplate.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {selectedTemplate.label}: {magnitude > 0 ? "+" : ""}{magnitude}{selectedTemplate.magnitudeUnit}
                        </p>
                        {hypothesis && (
                          <p className="text-[10px] text-muted-foreground italic">"{hypothesis}"</p>
                        )}
                      </div>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded hover:bg-muted/50 transition-colors">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>

                  {/* Projected Metrics Grid */}
                  <div className="rounded-xl p-0.5" style={{ background: "hsl(var(--primary) / 0.08)" }}>
                    <div className="rounded-[10px] p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                        Scenario Outcome Projection
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {activeProjection.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="rounded-lg p-3"
                            style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <DirectionIcon dir={m.direction} />
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                {m.label}
                              </span>
                            </div>
                            <p className="text-base font-black text-foreground">{m.magnitude}</p>
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                              {m.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strategic Implication */}
                  <div
                    className="rounded-lg p-3"
                    style={{ background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border))" }}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1">
                      Strategic Implication
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">
                      {activeProjection.strategicImplication}
                    </p>
                  </div>

                  {/* Confidence + Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Confidence */}
                    <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.2)", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Projection Confidence
                      </p>
                      {(() => {
                        const cs = confidenceStyle(activeProjection.confidence);
                        return (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ background: cs.bg, color: cs.text }}
                          >
                            {cs.label}
                          </span>
                        );
                      })()}
                      <p className="text-[10px] text-muted-foreground leading-snug mt-1.5">
                        {activeProjection.confidenceRationale}
                      </p>
                    </div>

                    {/* Risks */}
                    <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.04)", border: "1px solid hsl(var(--destructive) / 0.1)" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))" }} />
                        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--destructive))" }}>
                          Key Risks
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {activeProjection.risks.map((r, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Try another */}
                  <button
                    onClick={() => { setActiveProjection(null); setSelectedTemplate(null); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-muted/50"
                    style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
                  >
                    <FlaskConical size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Test another scenario</span>
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
