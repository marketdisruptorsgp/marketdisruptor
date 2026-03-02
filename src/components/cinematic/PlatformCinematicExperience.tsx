import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   VOICEOVER SCRIPT — timestamped scene markers (seconds)
   Total ~60s at controlled pace
   ═══════════════════════════════════════════════════════════ */

const SCRIPT_LINES = [
  "Most tools describe what exists.",
  "They do not explain why outcomes happen.",
  "So decisions are made on surface signals,",
  "not structural truth.",
  "This platform analyzes products, services, and business models",
  "through governed reasoning.",
  "It identifies friction,",
  "proves the binding constraint,",
  "and models the causal chain shaping outcomes.",
  "Instead of incremental improvement,",
  "it reveals structural redesign.",
  "Every recommendation is stress-tested.",
  "Every conclusion is evidence-bounded.",
  "Every decision is traceable.",
  "This is not analysis as description.",
  "This is analysis as understanding.",
];

const FULL_SCRIPT = SCRIPT_LINES.join(" ");

/* Scene boundaries keyed to approximate voiceover timestamps */
interface SceneConfig {
  id: string;
  label: string;
  startPct: number; // 0-1 percentage of total duration
  endPct: number;
}

const SCENES: SceneConfig[] = [
  { id: "problem", label: "The Problem", startPct: 0, endPct: 0.17 },
  { id: "intro", label: "Platform Introduction", startPct: 0.17, endPct: 0.33 },
  { id: "reasoning", label: "How It Thinks", startPct: 0.33, endPct: 0.67 },
  { id: "flip", label: "The Flipped Insight", startPct: 0.67, endPct: 0.92 },
  { id: "resolution", label: "Resolution", startPct: 0.92, endPct: 1 },
];

/* Subtitle segments matched to script lines with relative timing */
const SUBTITLE_SEGMENTS = SCRIPT_LINES.map((text, i) => ({
  text,
  startPct: i / SCRIPT_LINES.length,
  endPct: (i + 1) / SCRIPT_LINES.length,
}));

function getActiveScene(pct: number): SceneConfig {
  return SCENES.find(s => pct >= s.startPct && pct < s.endPct) || SCENES[SCENES.length - 1];
}

function getActiveSubtitle(pct: number): string {
  const seg = SUBTITLE_SEGMENTS.find(s => pct >= s.startPct && pct < s.endPct);
  return seg?.text || "";
}

/* ═══════════════════════════════════════════════════════════
   CINEMATIC VISUAL SCENES
   ═══════════════════════════════════════════════════════════ */

function SceneProblem({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Fragmented grid — shallow tools */}
      <motion.div
        className="relative w-[80%] max-w-2xl aspect-video"
        animate={{ opacity: 1 - progress * 2 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-lg border border-border/30"
            style={{
              width: `${28 + (i % 3) * 4}%`,
              height: `${20 + (i % 2) * 12}%`,
              left: `${(i % 3) * 34 + 2}%`,
              top: `${Math.floor(i / 3) * 48 + 4}%`,
              background: `hsl(var(--muted) / ${0.3 + i * 0.05})`,
            }}
            animate={{
              y: [0, -3, 0],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            <div className="p-2">
              <div className="h-1.5 rounded-full bg-foreground/10 w-3/4 mb-1.5" />
              <div className="h-1 rounded-full bg-foreground/5 w-1/2" />
            </div>
          </motion.div>
        ))}
        {/* Red X overlay — no causal understanding */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: progress > 0.4 ? 0.7 : 0, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-destructive/40 flex items-center justify-center">
            <span className="text-destructive/60 text-3xl font-light">✕</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SceneIntro({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Platform emergence — interface frame */}
      <motion.div
        className="relative w-[85%] max-w-3xl aspect-video rounded-xl border border-primary/20 overflow-hidden"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "hsl(var(--cin-depth-bg))",
          boxShadow: `0 0 80px -20px hsl(var(--primary) / ${0.15 + progress * 0.15})`,
        }}
      >
        {/* Header bar */}
        <div className="h-8 border-b border-primary/10 flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive/40" />
          <div className="w-2 h-2 rounded-full bg-warning/40" />
          <div className="w-2 h-2 rounded-full bg-success/40" />
          <div className="ml-auto h-1 w-16 rounded-full bg-foreground/10" />
        </div>
        {/* Pipeline flow */}
        <div className="p-6 flex items-center gap-4">
          {["Input", "Decompose", "Constrain", "Model", "Redesign"].map((step, i) => (
            <motion.div
              key={step}
              className="flex-1 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: progress > i * 0.15 ? 1 : 0.2, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
            >
              <div
                className="h-10 rounded-lg border flex items-center justify-center mb-1.5 text-[10px] font-semibold tracking-wider uppercase"
                style={{
                  borderColor: progress > i * 0.15 ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.2)",
                  background: progress > i * 0.15 ? "hsl(var(--primary) / 0.08)" : "transparent",
                  color: progress > i * 0.15 ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.3)",
                }}
              >
                {step}
              </div>
              {i < 4 && (
                <motion.div
                  className="h-0.5 bg-primary/20 mt-1"
                  animate={{ scaleX: progress > (i + 1) * 0.15 ? 1 : 0 }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function SceneReasoning({ progress }: { progress: number }) {
  const constraintNodes = [
    { label: "Unit economics", x: 50, y: 20, role: "system" },
    { label: "Distribution cost", x: 25, y: 45, role: "force" },
    { label: "Customer retention", x: 75, y: 45, role: "force" },
    { label: "Price sensitivity", x: 15, y: 75, role: "mechanism" },
    { label: "Binding constraint", x: 50, y: 70, role: "leverage" },
    { label: "Market structure", x: 85, y: 75, role: "mechanism" },
  ];

  const edges = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5],
  ];

  const roleColor: Record<string, string> = {
    system: "var(--cin-red)",
    force: "var(--primary)",
    mechanism: "var(--cin-amber, 36 80% 52%)",
    leverage: "var(--cin-green)",
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[85%] max-w-3xl aspect-video">
        {/* Causal edges */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {edges.map(([from, to], i) => {
            const a = constraintNodes[from];
            const b = constraintNodes[to];
            return (
              <motion.line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="hsl(var(--primary) / 0.15)"
                strokeWidth="0.3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: progress > i * 0.08 ? 1 : 0,
                  opacity: progress > i * 0.08 ? 0.6 : 0,
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        {/* Constraint nodes */}
        {constraintNodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: progress > i * 0.1 ? 1 : 0,
              scale: progress > i * 0.1 ? 1 : 0.5,
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
              style={{
                background: `hsl(${roleColor[node.role]})`,
                boxShadow: `0 0 20px -4px hsl(${roleColor[node.role]} / 0.5)`,
              }}
            />
            <span
              className="text-[8px] sm:text-[10px] font-semibold mt-1 whitespace-nowrap"
              style={{ color: `hsl(${roleColor[node.role]})` }}
            >
              {node.label}
            </span>
          </motion.div>
        ))}
        {/* Binding constraint pulse */}
        {progress > 0.6 && (
          <motion.div
            className="absolute"
            style={{ left: "50%", top: "70%", transform: "translate(-50%, -50%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full border border-success/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SceneFlip({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex gap-4 sm:gap-8 w-[85%] max-w-3xl">
        {/* Before */}
        <motion.div
          className="flex-1 rounded-xl border p-4 sm:p-6"
          style={{
            borderColor: "hsl(var(--destructive) / 0.3)",
            background: "hsl(var(--destructive) / 0.04)",
          }}
          animate={{ opacity: progress > 0.1 ? 1 : 0, x: progress > 0.1 ? 0 : -30 }}
          transition={{ duration: 1 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/60 mb-3">Before</p>
          <div className="space-y-2">
            {["Surface-level comparison", "Feature checklist", "No causal model", "Incremental tweak"].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-xs text-foreground/50"
                animate={{ opacity: progress > 0.2 + i * 0.1 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="w-1 h-1 rounded-full bg-destructive/40" />
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          className="flex items-center"
          animate={{ opacity: progress > 0.5 ? 1 : 0, scale: progress > 0.5 ? 1 : 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-8 h-0.5 bg-primary/30 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-primary/40 border-y-[4px] border-y-transparent" />
          </div>
        </motion.div>

        {/* After */}
        <motion.div
          className="flex-1 rounded-xl border p-4 sm:p-6"
          style={{
            borderColor: "hsl(var(--success) / 0.3)",
            background: "hsl(var(--success) / 0.04)",
          }}
          animate={{ opacity: progress > 0.5 ? 1 : 0, x: progress > 0.5 ? 0 : 30 }}
          transition={{ duration: 1 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-success/60 mb-3">After</p>
          <div className="space-y-2">
            {["Structural redesign", "Binding constraint identified", "Causal chain modeled", "Decision-grade output"].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-xs text-foreground/70"
                animate={{ opacity: progress > 0.6 + i * 0.08 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success/60" />
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SceneResolution({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6"
          animate={{
            boxShadow: [
              "0 0 0 0 hsl(var(--primary) / 0)",
              "0 0 40px -8px hsl(var(--primary) / 0.3)",
              "0 0 0 0 hsl(var(--primary) / 0)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="w-4 h-4 rounded-sm bg-primary/60" />
        </motion.div>
        <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
          Analysis as understanding.
        </p>
        <p className="text-xs text-muted-foreground mt-2 tracking-wide">
          Structural intelligence for decisions that matter.
        </p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function PlatformCinematicExperience() {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "ended">("idle");
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeScene = getActiveScene(progress);

  /* Scene-local progress (0-1 within current scene) */
  const sceneProgress = activeScene
    ? Math.min(1, Math.max(0, (progress - activeScene.startPct) / (activeScene.endPct - activeScene.startPct)))
    : 0;

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    const pct = audio.currentTime / audio.duration;
    setProgress(pct);
    setSubtitle(getActiveSubtitle(pct));
    if (pct >= 1) {
      setState("ended");
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startPlayback = useCallback(async () => {
    setState("loading");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-tts`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: FULL_SCRIPT }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.muted = muted;
      audioRef.current = audio;
      audio.addEventListener("ended", () => {
        setState("ended");
        setProgress(1);
      });
      await audio.play();
      setState("playing");
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error("Cinematic playback error:", err);
      setState("idle");
    }
  }, [muted, tick]);

  const replay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
    setSubtitle("");
    setState("idle");
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return (
    <section ref={containerRef} className="relative w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border/50"
        style={{
          aspectRatio: "16 / 9",
          background: "hsl(var(--cin-depth-bg))",
        }}
      >
        {/* Scene renderer */}
        <AnimatePresence mode="wait">
          {(state === "idle" || state === "loading") && (
            <motion.div
              key="idle"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm text-foreground/60 font-medium tracking-wide">Platform Intelligence Film</p>
              <button
                onClick={startPlayback}
                disabled={state === "loading"}
                className="group relative w-16 h-16 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-all disabled:opacity-50"
              >
                {state === "loading" ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Play size={20} className="text-primary ml-0.5" />
                )}
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </button>
              <p className="text-[10px] text-muted-foreground">60-second cinematic overview</p>
            </motion.div>
          )}

          {(state === "playing" || state === "ended") && (
            <motion.div
              key="playing"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {activeScene.id === "problem" && <SceneProblem progress={sceneProgress} />}
              {activeScene.id === "intro" && <SceneIntro progress={sceneProgress} />}
              {activeScene.id === "reasoning" && <SceneReasoning progress={sceneProgress} />}
              {activeScene.id === "flip" && <SceneFlip progress={sceneProgress} />}
              {activeScene.id === "resolution" && <SceneResolution progress={sceneProgress} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline progress bar */}
        {(state === "playing" || state === "ended") && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground/5">
            <motion.div
              className="h-full bg-primary/50"
              style={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}

        {/* Subtitle */}
        {state === "playing" && subtitle && (
          <motion.div
            className="absolute bottom-6 left-0 right-0 flex justify-center px-6"
            key={subtitle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs sm:text-sm text-foreground/80 font-medium bg-background/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border/30 max-w-lg text-center">
              {subtitle}
            </p>
          </motion.div>
        )}

        {/* Controls overlay */}
        {(state === "playing" || state === "ended") && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setMuted(m => !m)}
              className="w-7 h-7 rounded-full bg-background/40 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-background/60 transition-colors"
            >
              {muted ? <VolumeX size={12} className="text-foreground/60" /> : <Volume2 size={12} className="text-foreground/60" />}
            </button>
            {state === "ended" && (
              <button
                onClick={replay}
                className="w-7 h-7 rounded-full bg-background/40 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-background/60 transition-colors"
              >
                <RotateCcw size={12} className="text-foreground/60" />
              </button>
            )}
          </div>
        )}

        {/* Scene indicator */}
        {state === "playing" && (
          <div className="absolute top-3 left-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary/50 bg-background/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/20">
              {activeScene.label}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
