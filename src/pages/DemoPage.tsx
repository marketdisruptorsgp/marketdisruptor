import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Pause, RotateCcw, Zap, Eye, Layers, Target, GitBranch, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC PRODUCT DEMO — Interactive 6-Scene Walkthrough
   Hand Dryer Analysis: constraint-driven reasoning demo
   ═══════════════════════════════════════════════════════════════ */

const SCENES = [
  {
    id: "limitation",
    title: "The Limitation",
    icon: Eye,
    duration: 6000,
    subtitle: "Conventional tools optimize symptoms — not constraints.",
  },
  {
    id: "engagement",
    title: "System Engagement",
    icon: Zap,
    duration: 12000,
    subtitle: "Governed reasoning maps frictions, scores constraints, proves dominance.",
  },
  {
    id: "flip",
    title: "First-Principles Flip",
    icon: GitBranch,
    duration: 12000,
    subtitle: "The recommendation flips when the binding constraint is identified.",
  },
  {
    id: "lens",
    title: "Lens Adaptation",
    icon: Layers,
    duration: 10000,
    subtitle: "Toggle ETA Acquisition Lens — watch reasoning restructure.",
  },
  {
    id: "modes",
    title: "Mode Adaptation",
    icon: Target,
    duration: 10000,
    subtitle: "Same object, three modes — three leverage points.",
  },
  {
    id: "synthesis",
    title: "Decision Synthesis",
    icon: Shield,
    duration: 10000,
    subtitle: "Improvement follows constraint relief.",
  },
];

const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

/* ── Scene 1: Conventional ── */
function SceneLimitation() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.6 }}
        className="rounded-xl p-6 border"
        style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
          Conventional Analysis Output
        </p>
        <div className="space-y-2">
          {["Increase motor wattage for faster drying", "Add HEPA filter for hygiene claims", "Reduce noise with acoustic dampening"].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.3 }}
              className="flex items-center gap-2 py-2 px-3 rounded-lg"
              style={{ background: "hsl(var(--background))" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--muted-foreground) / 0.3)" }} />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{s}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center text-sm font-medium"
        style={{ color: "hsl(var(--destructive))" }}
      >
        No structural reasoning. No constraint identification. No causal chain.
      </motion.p>
    </div>
  );
}

/* ── Scene 2: System Engagement ── */
function SceneEngagement() {
  const steps = [
    { label: "Objective Definition", detail: "Maximize hand-drying completion rate", delay: 0 },
    { label: "Friction Mapping", detail: "5 frictions identified across physical, temporal, cognitive", delay: 1.5 },
    { label: "Constraint Scoring", detail: "Coverage geometry scores 8.4 — highest binding score", delay: 3 },
    { label: "Dominance Proof", detail: "Removing coverage constraint shifts 73% of downstream frictions", delay: 5 },
    { label: "Causal Chain", detail: "coverage_gap → incomplete_drying → user_abandonment → dissatisfaction", delay: 7 },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: step.delay * 0.3, duration: 0.5 }}
          className="flex items-start gap-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: step.delay * 0.3 + 0.2, type: "spring", stiffness: 300 }}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
            style={{
              background: i === 3 ? "hsl(var(--primary))" : "hsl(var(--muted))",
              color: i === 3 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
            }}
          >
            {i + 1}
          </motion.div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{step.label}</p>
            <p className="text-xs mt-0.5" style={{ color: i === 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
              {step.detail}
            </p>
          </div>
          {i === 3 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: step.delay * 0.3 + 0.4 }}
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              BINDING
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ── Scene 3: First-Principles Flip ── */
function SceneFlip() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Conventional */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.6, x: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-5 border"
        style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
          Conventional Action
        </p>
        <p className="text-base font-semibold" style={{ color: "hsl(var(--foreground) / 0.6)" }}>
          Increase airflow power
        </p>
        <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          Addresses symptom (slow drying) without identifying structural cause
        </p>
        <div className="mt-3 h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
          <div className="h-full rounded-full w-[35%]" style={{ background: "hsl(var(--muted-foreground) / 0.3)" }} />
        </div>
        <p className="text-[10px] mt-1" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>Impact: 35%</p>
      </motion.div>

      {/* Structural */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl p-5 border-2"
        style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.3)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary))" }}>
          Structural Action
        </p>
        <p className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          Optimize coverage geometry &amp; usage completion
        </p>
        <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          Constraint → Mechanism → Outcome: coverage_gap → redesign_nozzle_spread → 73% friction reduction
        </p>
        <div className="mt-3 h-1 rounded-full" style={{ background: "hsl(var(--primary) / 0.15)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "73%" }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: "hsl(var(--primary))" }}
          />
        </div>
        <p className="text-[10px] mt-1" style={{ color: "hsl(var(--primary))" }}>Impact: 73%</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="md:col-span-2 text-center"
      >
        <p className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
          The recommendation flips when the binding constraint is correctly identified.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Scene 4: Lens Adaptation ── */
function SceneLens() {
  const [lens, setLens] = useState<"default" | "eta">("default");

  useEffect(() => {
    const t = setTimeout(() => setLens("eta"), 2500);
    return () => clearTimeout(t);
  }, []);

  const data = {
    default: {
      priority: "Adoption (1.0) · Scale (1.0) · Risk (1.0)",
      action: "Redesign nozzle geometry for faster completion",
      rationale: "Maximize usage satisfaction across high-traffic environments",
      threshold: "0.3",
    },
    eta: {
      priority: "Reliability (1.4) · Risk (1.3) · Cost (1.3)",
      action: "Retrofit coverage system for acquisition durability",
      rationale: "Reduce maintenance cost while preserving value under ownership",
      threshold: "0.5",
    },
  };

  const d = data[lens];

  return (
    <div className="space-y-4">
      {/* Lens toggle */}
      <div className="flex items-center gap-2 justify-center">
        {(["default", "eta"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLens(l)}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: lens === l ? "hsl(var(--primary))" : "hsl(var(--muted))",
              color: lens === l ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            {l === "default" ? "Default Lens" : "ETA Acquisition"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={lens}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl p-5 border space-y-3"
          style={{
            background: lens === "eta" ? "hsl(38 92% 50% / 0.04)" : "hsl(var(--muted) / 0.5)",
            borderColor: lens === "eta" ? "hsl(38 92% 50% / 0.2)" : "hsl(var(--border))",
          }}
        >
          {[
            { label: "Constraint Priority", value: d.priority },
            { label: "Recommended Action", value: d.action },
            { label: "Decision Rationale", value: d.rationale },
            { label: "Evidence Threshold", value: d.threshold },
          ].map((row, i) => (
            <div key={i}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>
                {row.label}
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "hsl(var(--foreground))" }}>{row.value}</p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="text-center text-xs"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Same analysis object. Different decision lens. Different action.
      </motion.p>
    </div>
  );
}

/* ── Scene 5: Mode Adaptation ── */
function SceneModes() {
  const modes = [
    { mode: "Product", color: "hsl(229 89% 63%)", leverage: "Design geometry", detail: "Nozzle coverage angle → completion rate" },
    { mode: "Service", color: "hsl(340 65% 55%)", leverage: "Placement & workflow", detail: "Unit position → usage accessibility → throughput" },
    { mode: "Business", color: "hsl(271 70% 55%)", leverage: "Install footprint", detail: "Coverage/unit ratio → cost-per-dry metric" },
  ];

  return (
    <div className="space-y-3">
      {modes.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.6, duration: 0.4 }}
          className="rounded-xl p-4 border flex items-start gap-3"
          style={{ borderColor: `${m.color}30`, background: `${m.color}06` }}
        >
          <div className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0" style={{ background: m.color }} />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: m.color }}>{m.mode} Mode</p>
            <p className="text-sm font-semibold mt-1" style={{ color: "hsl(var(--foreground))" }}>{m.leverage}</p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{m.detail}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Scene 6: Decision Synthesis ── */
function SceneSynthesis() {
  const chain = [
    { label: "Objective", value: "Maximize hand-drying completion" },
    { label: "Binding Constraint", value: "Coverage geometry gap" },
    { label: "Leverage", value: "Nozzle spread redesign" },
    { label: "Decision", value: "Proceed — 73% friction reduction, conditional on prototype validation" },
  ];

  return (
    <div className="space-y-1">
      {chain.map((step, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.6, duration: 0.4 }}
            className="rounded-xl p-4 border"
            style={{
              background: i === 3 ? "hsl(var(--primary) / 0.06)" : "hsl(var(--muted) / 0.5)",
              borderColor: i === 3 ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))",
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: i === 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)" }}>
              {step.label}
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: "hsl(var(--foreground))" }}>{step.value}</p>
          </motion.div>
          {i < chain.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.6 + 0.3 }}
              className="flex justify-center"
            >
              <ArrowRight className="w-4 h-4 rotate-90" style={{ color: "hsl(var(--muted-foreground) / 0.3)" }} />
            </motion.div>
          )}
        </React.Fragment>
      ))}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="text-center text-xs font-medium pt-3"
        style={{ color: "hsl(var(--primary))" }}
      >
        Improvement follows constraint relief.
      </motion.p>
    </div>
  );
}

const SCENE_COMPONENTS: Record<string, React.FC> = {
  limitation: SceneLimitation,
  engagement: SceneEngagement,
  flip: SceneFlip,
  lens: SceneLens,
  modes: SceneModes,
  synthesis: SceneSynthesis,
};

export default function DemoPage() {
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const scene = SCENES[activeScene];
  const SceneComponent = SCENE_COMPONENTS[scene.id];

  // Auto-advance
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100;
        if (next >= scene.duration) {
          if (activeScene < SCENES.length - 1) {
            setActiveScene((s) => s + 1);
            return 0;
          } else {
            setPlaying(false);
            return scene.duration;
          }
        }
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, activeScene, scene.duration]);

  const goToScene = useCallback((i: number) => {
    setActiveScene(i);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const restart = useCallback(() => {
    setActiveScene(0);
    setElapsed(0);
    setPlaying(true);
  }, []);

  // Global progress
  const sceneStartMs = SCENES.slice(0, activeScene).reduce((s, sc) => s + sc.duration, 0);
  const globalProgress = ((sceneStartMs + elapsed) / TOTAL_DURATION) * 100;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: "hsl(var(--background) / 0.9)", borderColor: "hsl(var(--border))" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
            ← Back
          </button>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            Product Demo
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying(!playing)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--muted))" }}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={restart}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--muted))" }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {/* Global progress bar */}
        <div className="h-0.5" style={{ background: "hsl(var(--border))" }}>
          <motion.div
            className="h-full"
            style={{ background: "hsl(var(--primary))", width: `${globalProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Scene nav dots */}
        <div className="flex items-center gap-1 justify-center mb-8">
          {SCENES.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === activeScene;
            const isPast = i < activeScene;
            return (
              <button
                key={i}
                onClick={() => goToScene(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: isActive ? "hsl(var(--primary) / 0.1)" : "transparent",
                  color: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--foreground) / 0.5)" : "hsl(var(--muted-foreground) / 0.4)",
                }}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Scene header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="text-center mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "hsl(var(--primary))" }}>
                Scene {activeScene + 1} of {SCENES.length}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
                {scene.title}
              </h2>
              <p className="text-sm mt-2 max-w-lg mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
                {scene.subtitle}
              </p>
            </div>

            {/* Scene content */}
            <div className="max-w-2xl mx-auto">
              <SceneComponent />
            </div>

            {/* Scene progress */}
            <div className="max-w-xs mx-auto mt-6">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "hsl(var(--primary) / 0.4)",
                    width: `${(elapsed / scene.duration) * 100}%`,
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA after completion */}
        {!playing && activeScene === SCENES.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8 space-y-4"
          >
            <p className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
              This system identifies leverage structurally.
            </p>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Recommendations change when reality changes.
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Try it yourself <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
