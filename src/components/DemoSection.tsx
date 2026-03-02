import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Play, Pause, Square, Maximize, Minimize,
  RotateCcw, Volume2, VolumeX, AlertTriangle, Search,
  TrendingUp, Crosshair, BarChart3, Zap, CheckCircle2,
  XCircle, ArrowDown, Layers, Target, Shield, GitBranch,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC DEMO — Secret Weapon Storytelling Engine
   No stock images. Every visual is code-built using design tokens.
   ═══════════════════════════════════════════════════════════════ */

const NARRATION: Record<string, string> = {
  hook: "You've optimised, iterated, benchmarked. Yet the same problems keep coming back. What if the issue isn't your execution — it's your analysis?",
  blind: "Conventional tools give you the same generic recommendations everyone else gets. More features, more power, more complexity. They optimise symptoms. They never find the real constraint.",
  reveal: "Our system maps every friction, scores each constraint, and mathematically proves which one dominates. Here, coverage geometry emerges as the binding constraint — removing it resolves seventy-three percent of downstream problems.",
  flip: "This is where everything changes. Conventional thinking says increase power. Structural reasoning says fix coverage geometry. The entire recommendation flips when the real constraint is identified. This is your unfair advantage.",
  adapt: "Now watch the system adapt in real-time. Toggle the lens — priorities restructure. Switch modes — new leverage points emerge. Same product, completely different strategic insights.",
  weapon: "From objective, to binding constraint, to leverage point, to decision. While competitors chase symptoms, you act on structure. This is decision-grade intelligence. This is your secret weapon.",
};

interface Act {
  id: string;
  title: string;
  tagline: string;
  duration: number;
}

const ACTS: Act[] = [
  { id: "hook", title: "Stuck in the Loop", tagline: "You iterate. You optimise. Nothing changes.", duration: 8000 },
  { id: "blind", title: "The Blind Spot", tagline: "Every tool gives you the same answer. None find the real problem.", duration: 10000 },
  { id: "reveal", title: "The Structural Reveal", tagline: "Watch the system find what everyone else misses.", duration: 14000 },
  { id: "flip", title: "The Flip", tagline: "The recommendation inverts. Your advantage emerges.", duration: 12000 },
  { id: "adapt", title: "Adaptive Intelligence", tagline: "One product. Three lenses. Three leverage points.", duration: 12000 },
  { id: "weapon", title: "Your Secret Weapon", tagline: "Decide on structure. Act on leverage. Win.", duration: 10000 },
];

const TOTAL_DURATION = ACTS.reduce((s, a) => s + a.duration, 0);

/* ── Voice Engine (ElevenLabs TTS with cache) ── */
const audioCache = new Map<string, string>(); // actId → blob URL
let currentAudio: HTMLAudioElement | null = null;

async function fetchTTSAudio(actId: string, text: string): Promise<string | null> {
  if (audioCache.has(actId)) return audioCache.get(actId)!;
  try {
    const res = await supabase.functions.invoke("demo-tts", {
      body: { text, actId },
    });
    if (res.error || !res.data) {
      console.warn("TTS fetch failed, falling back to silence:", res.error);
      return null;
    }
    // res.data is a Blob when responseType is not set
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    audioCache.set(actId, url);
    return url;
  } catch (err) {
    console.warn("TTS fetch error:", err);
    return null;
  }
}

function playAudio(url: string) {
  stopAudio();
  currentAudio = new Audio(url);
  currentAudio.play().catch(() => {});
}

function pauseAudio() {
  if (currentAudio && !currentAudio.paused) currentAudio.pause();
}

function resumeAudio() {
  if (currentAudio && currentAudio.paused) currentAudio.play().catch(() => {});
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/* ════════════════════════════════════════════════════════════════
   CUSTOM VISUAL SCENES — all code-built, design-token-driven
   ════════════════════════════════════════════════════════════════ */

/* ── ACT 1: The Loop ── */
function VisualHook() {
  const cycles = ["Iterate", "Optimise", "Launch", "Stall", "Repeat"];
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular loop visualization */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        {cycles.map((label, i) => {
          const angle = (i / cycles.length) * Math.PI * 2 - Math.PI / 2;
          const r = 85;
          const x = 50 + (r * Math.cos(angle)) / 1.12;
          const y = 50 + (r * Math.sin(angle)) / 1.12;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.3, type: "spring", stiffness: 200 }}
              className="absolute flex items-center justify-center"
              style={{
                left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="px-3 py-1.5 rounded-xl text-xs font-bold border"
                style={{
                  background: i === 3 ? "hsl(var(--destructive) / 0.08)" : "hsl(var(--muted))",
                  borderColor: i === 3 ? "hsl(var(--destructive) / 0.3)" : "hsl(var(--border))",
                  color: i === 3 ? "hsl(var(--destructive))" : "hsl(var(--foreground))",
                }}
              >
                {label}
              </div>
            </motion.div>
          );
        })}
        {/* Center frustration icon */}
        <motion.div
          initial={{ opacity: 0, rotate: -180 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
            <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--destructive))" }} />
          </div>
        </motion.div>
        {/* Rotating dashed ring */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 200"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="6 4" />
        </motion.svg>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-center text-sm font-semibold max-w-xs"
        style={{ color: "hsl(var(--destructive))" }}
      >
        Sound familiar?
      </motion.p>
    </div>
  );
}

/* ── ACT 2: Blind Spot ── */
function VisualBlind() {
  const generic = [
    { text: "Add more features", icon: XCircle },
    { text: "Increase motor power", icon: XCircle },
    { text: "Reduce price point", icon: XCircle },
    { text: "Improve marketing", icon: XCircle },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4 border" style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--muted-foreground) / 0.1)" }}>
            <Search className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            Every other tool says…
          </p>
        </div>
        {generic.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 0.6, x: 0 }}
            transition={{ delay: 0.3 + i * 0.25 }}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg mb-1"
            style={{ background: "hsl(var(--background))" }}
          >
            <g.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--destructive) / 0.4)" }} />
            <span className="text-xs line-through" style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}>{g.text}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center"
      >
        <p className="text-xs font-medium" style={{ color: "hsl(var(--destructive))" }}>
          No constraint identification • No causal chain • No structural reasoning
        </p>
      </motion.div>
    </div>
  );
}

/* ── ACT 3: Structural Reveal ── */
function VisualReveal() {
  const steps = [
    { label: "Objective Locked", detail: "Maximize drying completion rate", pct: 100, binding: false },
    { label: "5 Frictions Mapped", detail: "Physical · Temporal · Cognitive", pct: 100, binding: false },
    { label: "Constraint Scored", detail: "Coverage geometry — binding score 8.4 / 10", pct: 84, binding: true },
    { label: "Dominance Proved", detail: "Resolves 73% of downstream frictions", pct: 73, binding: true },
  ];
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.5, duration: 0.4 }}
          className="rounded-xl p-3 border"
          style={{
            borderColor: s.binding ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
            background: s.binding ? "hsl(var(--primary) / 0.04)" : "hsl(var(--muted) / 0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: s.binding ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: s.binding ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                }}
              >
                {i + 1}
              </div>
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>{s.label}</p>
            </div>
            {s.binding && (
              <span
                className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
              >
                BINDING
              </span>
            )}
          </div>
          <p className="text-[11px] mb-2" style={{ color: s.binding ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
            {s.detail}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ delay: i * 0.5 + 0.3, duration: 0.6 }}
              className="h-full rounded-full"
              style={{ background: s.binding ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.25)" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── ACT 4: The Flip ── */
function VisualFlip() {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFlipped(true), 2000); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Conventional */}
        <motion.div
          animate={{ opacity: flipped ? 0.4 : 1, scale: flipped ? 0.97 : 1 }}
          className="rounded-xl p-4 border relative overflow-hidden"
          style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Everyone else
          </p>
          <p className="text-sm font-bold mb-1" style={{ color: "hsl(var(--foreground) / 0.6)" }}>
            "Increase airflow power"
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
              <div className="h-full rounded-full w-[35%]" style={{ background: "hsl(var(--muted-foreground) / 0.3)" }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>35%</span>
          </div>
          {flipped && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "hsl(var(--background) / 0.6)" }}
            >
              <XCircle className="w-8 h-8" style={{ color: "hsl(var(--destructive) / 0.5)" }} />
            </motion.div>
          )}
        </motion.div>

        {/* Structural */}
        <motion.div
          animate={{
            scale: flipped ? 1.02 : 0.97,
            opacity: flipped ? 1 : 0.5,
          }}
          className="rounded-xl p-4 border-2 relative"
          style={{
            background: flipped ? "hsl(var(--primary) / 0.04)" : "hsl(var(--muted) / 0.5)",
            borderColor: flipped ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
          }}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>
            Your advantage
          </p>
          <p className="text-sm font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>
            "Fix coverage geometry"
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--primary) / 0.15)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: flipped ? "73%" : "0%" }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-full rounded-full"
                style={{ background: "hsl(var(--primary))" }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: flipped ? 1 : 0 }}
              className="text-[10px] font-bold"
              style={{ color: "hsl(var(--primary))" }}
            >
              73%
            </motion.span>
          </div>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(var(--primary-foreground))" }} />
            </motion.div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 6 }}
        transition={{ delay: 0.8 }}
        className="text-center rounded-xl py-2 px-4"
        style={{ background: "hsl(var(--primary) / 0.06)" }}
      >
        <p className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
          2.1× more impact from structural reasoning
        </p>
      </motion.div>
    </div>
  );
}

/* ── ACT 5: Adaptive Intelligence ── */
function VisualAdapt() {
  const modes = [
    { mode: "Product", cssVar: "--mode-product", leverage: "Design geometry", action: "Redesign nozzle spread", score: "8.4" },
    { mode: "Service", cssVar: "--mode-service", leverage: "Placement & workflow", action: "Reposition at sink height", score: "7.9" },
    { mode: "Business", cssVar: "--mode-business", leverage: "Install footprint", action: "Reduce mounting complexity", score: "8.1" },
  ];
  return (
    <div className="space-y-2">
      {modes.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.6, duration: 0.4 }}
          className="rounded-xl p-3 border flex items-center gap-3"
          style={{ borderColor: `hsl(var(${m.cssVar}) / 0.25)`, background: `hsl(var(${m.cssVar}) / 0.04)` }}
        >
          <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ background: `hsl(var(${m.cssVar}))` }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `hsl(var(${m.cssVar}))` }}>{m.mode}</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `hsl(var(${m.cssVar}) / 0.1)`, color: `hsl(var(${m.cssVar}))` }}>
                {m.score}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>{m.leverage}</p>
            <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{m.action}</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.6 + 0.3, type: "spring" }}
          >
            <Crosshair className="w-4 h-4" style={{ color: `hsl(var(${m.cssVar}) / 0.4)` }} />
          </motion.div>
        </motion.div>
      ))}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-center text-[11px] font-medium"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        Same product — three completely different strategic paths
      </motion.p>
    </div>
  );
}

/* ── ACT 6: Secret Weapon ── */
function VisualWeapon() {
  const chain = [
    { icon: Target, label: "Objective", value: "Maximize completion", color: "--muted-foreground" },
    { icon: Search, label: "Constraint", value: "Coverage geometry gap", color: "--primary" },
    { icon: Zap, label: "Leverage", value: "Nozzle spread redesign", color: "--primary" },
    { icon: Shield, label: "Decision", value: "Proceed — 73% friction reduction", color: "--primary" },
  ];
  return (
    <div className="space-y-1">
      {chain.map((s, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.6, duration: 0.4 }}
            className="rounded-xl p-3 border flex items-center gap-3"
            style={{
              background: i === 3 ? "hsl(var(--primary) / 0.06)" : "hsl(var(--muted) / 0.3)",
              borderColor: i === 3 ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: i >= 1 ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
              }}
            >
              <s.icon className="w-4 h-4" style={{ color: `hsl(var(${s.color}))` }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `hsl(var(${s.color}) / 0.6)` }}>{s.label}</p>
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>{s.value}</p>
            </div>
          </motion.div>
          {i < chain.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.6 + 0.3 }}
              className="flex justify-center"
            >
              <ArrowDown className="w-3 h-3" style={{ color: "hsl(var(--primary) / 0.25)" }} />
            </motion.div>
          )}
        </React.Fragment>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.8, duration: 0.4 }}
        className="rounded-xl p-3 mt-2 text-center"
        style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.2)" }}
      >
        <p className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
          While others guess, you act on structure.
        </p>
      </motion.div>
    </div>
  );
}

const ACT_VISUALS: Record<string, React.FC> = {
  hook: VisualHook, blind: VisualBlind, reveal: VisualReveal,
  flip: VisualFlip, adapt: VisualAdapt, weapon: VisualWeapon,
};

/* ── Control Button ── */
function CtrlBtn({ onClick, icon: Icon, label, active, large }: {
  onClick: () => void; icon: React.FC<{ className?: string }>; label: string; active?: boolean; large?: boolean;
}) {
  const sz = large ? "w-10 h-10" : "w-8 h-8";
  const ic = large ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className={`${sz} rounded-xl flex items-center justify-center transition-all hover:scale-105`}
      style={{ background: active ? "hsl(var(--primary))" : "hsl(var(--muted))", color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>
      <Icon className={ic} />
    </button>
  );
}

/* ── Main Demo Section ── */
export default function DemoSection() {
  const [activeAct, setActiveAct] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSpoken = useRef(-1);

  const act = ACTS[activeAct];
  const Visual = ACT_VISUALS[act.id];

  // Voiceover — ElevenLabs TTS
  useEffect(() => {
    if (!playing || muted) { stopAudio(); return; }
    if (lastSpoken.current === activeAct) return;
    lastSpoken.current = activeAct;
    const text = NARRATION[act.id];
    if (text) {
      fetchTTSAudio(act.id, text).then(url => {
        if (url) playAudio(url);
      });
    }
    return () => stopAudio();
  }, [activeAct, playing, muted, act.id]);

  // Timer
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        const next = p + 100;
        if (next >= act.duration) {
          if (activeAct < ACTS.length - 1) { setActiveAct(s => s + 1); return 0; }
          else { setPlaying(false); stopAudio(); return act.duration; }
        }
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, activeAct, act.duration]);

  useEffect(() => {
    if (playing && !muted) resumeAudio(); else pauseAudio();
  }, [playing, muted]);

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFs) document.exitFullscreen();
      else if (e.key === " " || e.key === "k") { e.preventDefault(); setPlaying(p => !p); }
      else if (e.key === "m") setMuted(m => !m);
      else if (e.key === "f") toggleFs();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isFs]);

  const goTo = useCallback((i: number) => {
    stopAudio(); lastSpoken.current = -1;
    setActiveAct(i); setElapsed(0); setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    stopAudio(); lastSpoken.current = -1;
    setPlaying(false); setActiveAct(0); setElapsed(0);
  }, []);

  const toggleFs = useCallback(() => {
    if (!containerRef.current) return;
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen();
  }, []);

  const startMs = ACTS.slice(0, activeAct).reduce((s, a) => s + a.duration, 0);
  const globalPct = ((startMs + elapsed) / TOTAL_DURATION) * 100;

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-border bg-card overflow-hidden transition-all ${isFs ? "flex flex-col" : ""}`}
      style={isFs ? { background: "hsl(var(--background))", borderRadius: 0 } : undefined}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <BarChart3 className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--muted-foreground))" }}>
            See it in action
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <CtrlBtn onClick={() => { if (!playing) lastSpoken.current = -1; setPlaying(p => !p); }} icon={playing ? Pause : Play} label={playing ? "Pause" : "Play"} active={playing} large />
          <CtrlBtn onClick={stop} icon={Square} label="Stop" />
          <CtrlBtn onClick={() => { stopAudio(); lastSpoken.current = -1; setActiveAct(0); setElapsed(0); setPlaying(true); }} icon={RotateCcw} label="Restart" />
          <CtrlBtn onClick={() => { setMuted(m => !m); if (!muted) stopAudio(); }} icon={muted ? VolumeX : Volume2} label={muted ? "Unmute" : "Mute"} />
          <CtrlBtn onClick={toggleFs} icon={isFs ? Minimize : Maximize} label={isFs ? "Exit Fullscreen" : "Fullscreen"} />
        </div>
      </div>

      {/* Progress */}
      <div className="h-1" style={{ background: "hsl(var(--border))" }}>
        <motion.div className="h-full" style={{ background: "hsl(var(--primary))", width: `${globalPct}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Act navigation — story beats, not "Scene 1" */}
      <div className="flex items-center gap-0.5 px-3 py-2 overflow-x-auto">
        {ACTS.map((a, i) => {
          const isActive = i === activeAct;
          const isPast = i < activeAct;
          return (
            <button key={i} onClick={() => goTo(i)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
              style={{
                background: isActive ? "hsl(var(--primary) / 0.1)" : "transparent",
                color: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--foreground) / 0.5)" : "hsl(var(--muted-foreground) / 0.4)",
              }}
            >
              {isPast && <CheckCircle2 className="w-3 h-3" />}
              <span className="hidden sm:inline">{a.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`px-4 sm:px-6 pb-6 pt-2 ${isFs ? "flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div key={activeAct} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <h3 className={`font-extrabold mb-1 ${isFs ? "text-2xl" : "text-lg"}`} style={{ color: "hsl(var(--foreground))" }}>
              {act.title}
            </h3>
            <p className={`mb-5 ${isFs ? "text-sm" : "text-xs"}`} style={{ color: "hsl(var(--muted-foreground))" }}>
              {act.tagline}
            </p>
            <Visual />
            {/* Scene progress */}
            <div className="mt-5 h-0.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
              <div className="h-full rounded-full transition-all" style={{ background: "hsl(var(--primary) / 0.3)", width: `${(elapsed / act.duration) * 100}%` }} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hints */}
      <div className="px-4 pb-3 flex items-center justify-center gap-3">
        {[{ key: "Space", label: "Play/Pause" }, { key: "M", label: "Mute" }, { key: "F", label: "Fullscreen" }].map(h => (
          <span key={h.key} className="text-[9px]" style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}>
            <kbd className="px-1 py-0.5 rounded border text-[8px] font-mono" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}>{h.key}</kbd>{" "}{h.label}
          </span>
        ))}
      </div>
    </div>
  );
}
