import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Play, Pause, Square, Maximize, Minimize,
  RotateCcw, Eye, Zap, GitBranch, Layers, Target, Shield,
  Volume2, VolumeX,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DEMO SECTION — 6-scene interactive walkthrough with voiceover
   ═══════════════════════════════════════════════════════════════ */

const NARRATION: Record<string, string> = {
  limitation: "Most analysis tools optimize symptoms. They suggest more power, more features, more complexity. But none ask: what is the actual constraint preventing success?",
  engagement: "The system maps every friction, scores each constraint, and proves which one dominates. Here, coverage geometry emerges as the binding constraint — removing it resolves 73% of downstream frictions.",
  flip: "This is the critical insight. Conventional thinking says increase airflow power. Structural reasoning says optimize coverage geometry. The recommendation flips when the real constraint is identified.",
  lens: "Now watch what happens when we toggle to an acquisition lens. The constraint priorities shift. Reliability and risk weigh heavier. The recommended action changes to reflect ownership economics.",
  modes: "Same hand dryer. Three modes. Product mode finds design geometry leverage. Service mode finds placement and workflow leverage. Business model mode finds install footprint leverage.",
  synthesis: "The chain is complete. From objective, to binding constraint, to leverage point, to decision. Improvement follows constraint relief. This is decision-grade intelligence.",
};

interface SceneConfig {
  id: string;
  title: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  duration: number;
  subtitle: string;
}

const SCENES: SceneConfig[] = [
  { id: "limitation", title: "The Limitation", icon: Eye, duration: 8000, subtitle: "Conventional tools optimize symptoms — not constraints." },
  { id: "engagement", title: "System Engagement", icon: Zap, duration: 14000, subtitle: "Governed reasoning maps frictions, scores constraints, proves dominance." },
  { id: "flip", title: "First-Principles Flip", icon: GitBranch, duration: 12000, subtitle: "The recommendation flips when the binding constraint is identified." },
  { id: "lens", title: "Lens Adaptation", icon: Layers, duration: 12000, subtitle: "Toggle ETA Acquisition Lens — watch reasoning restructure." },
  { id: "modes", title: "Mode Adaptation", icon: Target, duration: 10000, subtitle: "Same object, three modes — three leverage points." },
  { id: "synthesis", title: "Decision Synthesis", icon: Shield, duration: 12000, subtitle: "Improvement follows constraint relief." },
];

const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

/* ── Voice Engine (Web SpeechSynthesis) ── */
function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!("speechSynthesis" in window)) return null;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1.0;
  utter.volume = 0.85;
  // Prefer calm English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes("Daniel") || v.name.includes("Google UK English Male") || v.name.includes("Samantha"));
  if (preferred) utter.voice = preferred;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
  return utter;
}

function cancelSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function pauseSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.pause();
}

function resumeSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.resume();
}

/* ── Scene Components ── */
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
  useEffect(() => { const t = setTimeout(() => setLens("eta"), 2500); return () => clearTimeout(t); }, []);
  const d = lens === "default"
    ? { priority: "Adoption · Scale · Risk (equal)", action: "Redesign nozzle geometry", threshold: "0.3" }
    : { priority: "Reliability (1.4) · Risk (1.3) · Cost (1.3)", action: "Retrofit for acquisition durability", threshold: "0.5" };
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 justify-center">
        {(["default", "eta"] as const).map((l) => (
          <button key={l} onClick={() => setLens(l)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
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

/* ── Control Button ── */
function ControlBtn({ onClick, icon: Icon, label, active, size = "default" }: {
  onClick: () => void;
  icon: React.FC<{ className?: string }>;
  label: string;
  active?: boolean;
  size?: "default" | "large";
}) {
  const sz = size === "large" ? "w-10 h-10" : "w-8 h-8";
  const iconSz = size === "large" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`${sz} rounded-xl flex items-center justify-center transition-all hover:scale-105`}
      style={{
        background: active ? "hsl(var(--primary))" : "hsl(var(--muted))",
        color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
      }}
    >
      <Icon className={iconSz} />
    </button>
  );
}

/* ── Main Demo Section ── */
export default function DemoSection() {
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSpokenScene = useRef(-1);

  const scene = SCENES[activeScene];
  const SceneComponent = SCENE_COMPONENTS[scene.id];

  // Voiceover — speak when scene changes and playing
  useEffect(() => {
    if (!playing || muted) { cancelSpeech(); return; }
    if (lastSpokenScene.current === activeScene) return;
    lastSpokenScene.current = activeScene;
    const text = NARRATION[scene.id];
    if (text) speakText(text);
    return () => cancelSpeech();
  }, [activeScene, playing, muted, scene.id]);

  // Auto-advance timer
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
            cancelSpeech();
            return scene.duration;
          }
        }
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, activeScene, scene.duration]);

  // Pause/resume speech with play state
  useEffect(() => {
    if (playing && !muted) resumeSpeech();
    else pauseSpeech();
  }, [playing, muted]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.key === "m") {
        setMuted(m => !m);
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const goToScene = useCallback((i: number) => {
    cancelSpeech();
    lastSpokenScene.current = -1;
    setActiveScene(i);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const handleStop = useCallback(() => {
    cancelSpeech();
    lastSpokenScene.current = -1;
    setPlaying(false);
    setActiveScene(0);
    setElapsed(0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const sceneStartMs = SCENES.slice(0, activeScene).reduce((s, sc) => s + sc.duration, 0);
  const globalProgress = ((sceneStartMs + elapsed) / TOTAL_DURATION) * 100;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-border bg-card overflow-hidden transition-all ${isFullscreen ? "flex flex-col" : ""}`}
      style={isFullscreen ? { background: "hsl(var(--background))", borderRadius: 0 } : undefined}
    >
      {/* Header + Controls */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
          Interactive Demo
        </p>
        <div className="flex items-center gap-1.5">
          {/* Play / Pause */}
          <ControlBtn
            onClick={() => { if (!playing) { lastSpokenScene.current = -1; } setPlaying(p => !p); }}
            icon={playing ? Pause : Play}
            label={playing ? "Pause (Space)" : "Play (Space)"}
            active={playing}
            size="large"
          />
          {/* Stop */}
          <ControlBtn onClick={handleStop} icon={Square} label="Stop" />
          {/* Restart */}
          <ControlBtn
            onClick={() => { cancelSpeech(); lastSpokenScene.current = -1; setActiveScene(0); setElapsed(0); setPlaying(true); }}
            icon={RotateCcw}
            label="Restart"
          />
          {/* Mute / Unmute */}
          <ControlBtn
            onClick={() => { setMuted(m => !m); if (!muted) cancelSpeech(); }}
            icon={muted ? VolumeX : Volume2}
            label={muted ? "Unmute (M)" : "Mute (M)"}
          />
          {/* Fullscreen */}
          <ControlBtn
            onClick={toggleFullscreen}
            icon={isFullscreen ? Minimize : Maximize}
            label={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
          />
        </div>
      </div>

      {/* Global progress bar */}
      <div className="h-1" style={{ background: "hsl(var(--border))" }}>
        <motion.div
          className="h-full"
          style={{ background: "hsl(var(--primary))", width: `${globalProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Scene nav pills */}
      <div className="flex items-center gap-0.5 px-3 py-2 overflow-x-auto">
        {SCENES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === activeScene;
          const isPast = i < activeScene;
          return (
            <button key={i} onClick={() => goToScene(i)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
              style={{
                background: isActive ? "hsl(var(--primary) / 0.1)" : "transparent",
                color: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--foreground) / 0.5)" : "hsl(var(--muted-foreground) / 0.4)",
              }}>
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Scene content */}
      <div className={`px-4 sm:px-6 pb-6 pt-2 ${isFullscreen ? "flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div key={activeScene} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: "hsl(var(--primary))" }}>
              Scene {activeScene + 1} of {SCENES.length}
            </p>
            <h3 className={`font-extrabold mb-1 ${isFullscreen ? "text-2xl" : "text-base"}`} style={{ color: "hsl(var(--foreground))" }}>
              {scene.title}
            </h3>
            <p className={`mb-4 ${isFullscreen ? "text-sm" : "text-xs"}`} style={{ color: "hsl(var(--muted-foreground))" }}>
              {scene.subtitle}
            </p>
            <SceneComponent />
            {/* Scene progress */}
            <div className="mt-4 h-0.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
              <div className="h-full rounded-full transition-all" style={{ background: "hsl(var(--primary) / 0.3)", width: `${(elapsed / scene.duration) * 100}%` }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hint */}
      <div className="px-4 pb-3 flex items-center justify-center gap-3">
        {[
          { key: "Space", label: "Play/Pause" },
          { key: "M", label: "Mute" },
          { key: "F", label: "Fullscreen" },
        ].map((h) => (
          <span key={h.key} className="text-[9px]" style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}>
            <kbd className="px-1 py-0.5 rounded border text-[8px] font-mono" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}>{h.key}</kbd>
            {" "}{h.label}
          </span>
        ))}
      </div>
    </div>
  );
}
