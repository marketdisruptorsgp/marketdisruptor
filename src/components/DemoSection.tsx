import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Pause, RotateCcw, Eye, Zap, GitBranch, Layers, Target, Shield } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DEMO SECTION — Embeddable 6-scene interactive walkthrough
   ═══════════════════════════════════════════════════════════════ */

const SCENES = [
  { id: "limitation", title: "The Limitation", icon: Eye, duration: 6000, subtitle: "Conventional tools optimize symptoms — not constraints." },
  { id: "engagement", title: "System Engagement", icon: Zap, duration: 12000, subtitle: "Governed reasoning maps frictions, scores constraints, proves dominance." },
  { id: "flip", title: "First-Principles Flip", icon: GitBranch, duration: 12000, subtitle: "The recommendation flips when the binding constraint is identified." },
  { id: "lens", title: "Lens Adaptation", icon: Layers, duration: 10000, subtitle: "Toggle ETA Acquisition Lens — watch reasoning restructure." },
  { id: "modes", title: "Mode Adaptation", icon: Target, duration: 10000, subtitle: "Same object, three modes — three leverage points." },
  { id: "synthesis", title: "Decision Synthesis", icon: Shield, duration: 10000, subtitle: "Improvement follows constraint relief." },
];

const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

function SceneLimitation() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))", opacity: 0.6 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Conventional Output</p>
        {["Increase motor wattage", "Add HEPA filter", "Reduce noise"].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.25 }}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg mb-1" style={{ background: "hsl(var(--background))" }}>
            <div className="w-1 h-1 rounded-full" style={{ background: "hsl(var(--muted-foreground) / 0.3)" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s}</span>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="text-center text-xs font-medium" style={{ color: "hsl(var(--destructive))" }}>
        No constraint identification. No causal chain.
      </motion.p>
    </div>
  );
}

function SceneEngagement() {
  const steps = [
    { label: "Objective Definition", detail: "Maximize hand-drying completion rate", delay: 0 },
    { label: "Friction Mapping", detail: "5 frictions across physical, temporal, cognitive", delay: 0.4 },
    { label: "Constraint Scoring", detail: "Coverage geometry — highest binding score (8.4)", delay: 0.8, binding: true },
    { label: "Dominance Proof", detail: "Removing coverage shifts 73% of downstream frictions", delay: 1.2 },
    { label: "Causal Chain", detail: "coverage_gap → incomplete_drying → abandonment", delay: 1.6 },
  ];
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: step.delay, duration: 0.4 }} className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
            style={{ background: step.binding ? "hsl(var(--primary))" : "hsl(var(--muted))", color: step.binding ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
            {i + 1}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>{step.label}</p>
            <p className="text-[11px]" style={{ color: step.binding ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>{step.detail}</p>
          </div>
          {step.binding && (
            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>BINDING</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function SceneFlip() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 0.6, x: 0 }} transition={{ duration: 0.4 }}
        className="rounded-xl p-3 border" style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Conventional</p>
        <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground) / 0.6)" }}>Increase airflow power</p>
        <div className="mt-2 h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
          <div className="h-full rounded-full w-[35%]" style={{ background: "hsl(var(--muted-foreground) / 0.3)" }} />
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>35% impact</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-xl p-3 border-2" style={{ background: "hsl(var(--primary) / 0.04)", borderColor: "hsl(var(--primary) / 0.3)" }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--primary))" }}>Structural</p>
        <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>Optimize coverage geometry</p>
        <div className="mt-2 h-1 rounded-full" style={{ background: "hsl(var(--primary) / 0.15)" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: "73%" }} transition={{ delay: 1, duration: 0.6 }}
            className="h-full rounded-full" style={{ background: "hsl(var(--primary))" }} />
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--primary))" }}>73% impact</p>
      </motion.div>
    </div>
  );
}

function SceneLens() {
  const [lens, setLens] = useState<"default" | "eta">("default");
  useEffect(() => { const t = setTimeout(() => setLens("eta"), 2200); return () => clearTimeout(t); }, []);
  const d = lens === "default"
    ? { priority: "Adoption · Scale · Risk (equal)", action: "Redesign nozzle geometry", threshold: "0.3" }
    : { priority: "Reliability (1.4) · Risk (1.3) · Cost (1.3)", action: "Retrofit for acquisition durability", threshold: "0.5" };
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 justify-center">
        {(["default", "eta"] as const).map((l) => (
          <button key={l} onClick={() => setLens(l)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            style={{ background: lens === l ? "hsl(var(--primary))" : "hsl(var(--muted))", color: lens === l ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}>
            {l === "default" ? "Default" : "ETA Acquisition"}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={lens} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
          className="rounded-xl p-4 border space-y-2" style={{ background: lens === "eta" ? "hsl(38 92% 50% / 0.04)" : "hsl(var(--muted) / 0.5)", borderColor: lens === "eta" ? "hsl(38 92% 50% / 0.2)" : "hsl(var(--border))" }}>
          {[{ l: "Priority", v: d.priority }, { l: "Action", v: d.action }, { l: "Evidence Threshold", v: d.threshold }].map((r, i) => (
            <div key={i}>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>{r.l}</p>
              <p className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>{r.v}</p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SceneModes() {
  const modes = [
    { mode: "Product", color: "hsl(229 89% 63%)", leverage: "Design geometry" },
    { mode: "Service", color: "hsl(340 65% 55%)", leverage: "Placement & workflow" },
    { mode: "Business", color: "hsl(271 70% 55%)", leverage: "Install footprint" },
  ];
  return (
    <div className="space-y-2">
      {modes.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5, duration: 0.3 }}
          className="rounded-xl p-3 border flex items-center gap-3" style={{ borderColor: `${m.color}30`, background: `${m.color}06` }}>
          <div className="w-1.5 h-8 rounded-full" style={{ background: m.color }} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: m.color }}>{m.mode}</p>
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>{m.leverage}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SceneSynthesis() {
  const chain = [
    { label: "Objective", value: "Maximize completion" },
    { label: "Constraint", value: "Coverage geometry gap" },
    { label: "Leverage", value: "Nozzle spread redesign" },
    { label: "Decision", value: "Proceed — 73% friction reduction" },
  ];
  return (
    <div className="space-y-1">
      {chain.map((s, i) => (
        <React.Fragment key={i}>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.5 }}
            className="rounded-xl p-3 border" style={{ background: i === 3 ? "hsl(var(--primary) / 0.06)" : "hsl(var(--muted) / 0.5)", borderColor: i === 3 ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: i === 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)" }}>{s.label}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "hsl(var(--foreground))" }}>{s.value}</p>
          </motion.div>
          {i < chain.length - 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.5 + 0.25 }} className="flex justify-center">
              <ArrowRight className="w-3 h-3 rotate-90" style={{ color: "hsl(var(--muted-foreground) / 0.25)" }} />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const SCENE_COMPONENTS: Record<string, React.FC> = {
  limitation: SceneLimitation, engagement: SceneEngagement, flip: SceneFlip,
  lens: SceneLens, modes: SceneModes, synthesis: SceneSynthesis,
};

export default function DemoSection() {
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scene = SCENES[activeScene];
  const SceneComponent = SCENE_COMPONENTS[scene.id];

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

  const goToScene = useCallback((i: number) => { setActiveScene(i); setElapsed(0); setPlaying(true); }, []);
  const restart = useCallback(() => { setActiveScene(0); setElapsed(0); setPlaying(true); }, []);

  const sceneStartMs = SCENES.slice(0, activeScene).reduce((s, sc) => s + sc.duration, 0);
  const globalProgress = ((sceneStartMs + elapsed) / TOTAL_DURATION) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
          Interactive Demo · Hand Dryer Analysis
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPlaying(!playing)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
            {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button onClick={restart} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full transition-all" style={{ background: "hsl(var(--primary))", width: `${globalProgress}%` }} />
      </div>

      {/* Scene nav */}
      <div className="flex items-center gap-0.5 px-3 py-2 overflow-x-auto">
        {SCENES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === activeScene;
          return (
            <button key={i} onClick={() => goToScene(i)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
              style={{ background: isActive ? "hsl(var(--primary) / 0.1)" : "transparent", color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)" }}>
              <Icon className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Scene content */}
      <div className="px-4 pb-5 pt-2">
        <AnimatePresence mode="wait">
          <motion.div key={activeScene} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "hsl(var(--primary))" }}>
              Scene {activeScene + 1}
            </p>
            <h3 className="text-base font-extrabold mb-1" style={{ color: "hsl(var(--foreground))" }}>{scene.title}</h3>
            <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>{scene.subtitle}</p>
            <SceneComponent />
            {/* Scene progress */}
            <div className="mt-4 h-0.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
              <div className="h-full rounded-full transition-all" style={{ background: "hsl(var(--primary) / 0.3)", width: `${(elapsed / scene.duration) * 100}%` }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
