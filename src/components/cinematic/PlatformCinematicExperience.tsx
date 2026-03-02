import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { renderFrame } from "./canvasEngine";
import { buildSceneFrame, getActiveScene, SCENE_TIMELINE, type DataBindings } from "./sceneDefinitions";

/* ═══════════════════════════════════════════════════════════
   VOICEOVER
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

function getSubtitle(pct: number): string {
  const idx = Math.floor(pct * SCRIPT_LINES.length);
  return SCRIPT_LINES[Math.min(idx, SCRIPT_LINES.length - 1)] || "";
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

interface Props {
  dataBindings?: Partial<DataBindings>;
}

export default function PlatformCinematicExperience({ dataBindings }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "ended">("idle");
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [subtitle, setSubtitle] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const bindings: DataBindings = {
    bindingConstraintStrength: 0.85,
    confidenceScore: 0.78,
    signalDensity: 0.72,
    decisionGrade: 0.88,
    lensWeight: 0.65,
    ...dataBindings,
  };

  const activeScene = getActiveScene(progress);
  const sceneProgress = activeScene
    ? Math.min(1, Math.max(0, (progress - activeScene.startPct) / (activeScene.endPct - activeScene.startPct)))
    : 0;

  /* ── Canvas resize ── */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  /* ── Render loop ── */
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    let pct = progress;
    if (audio && !audio.paused && audio.duration) {
      pct = audio.currentTime / audio.duration;
      setProgress(pct);
      setSubtitle(getSubtitle(pct));
      if (pct >= 0.999) {
        setState("ended");
        setProgress(1);
        return;
      }
    }

    const scene = getActiveScene(pct);
    const sp = Math.min(1, Math.max(0, (pct - scene.startPct) / (scene.endPct - scene.startPct)));
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const frame = buildSceneFrame(scene.id, sp, elapsed, bindings);

    renderFrame(ctx, w, h, frame, elapsed);
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [progress, bindings]);

  /* ── Playback control ── */
  const startPlayback = useCallback(async () => {
    setState("loading");
    startTimeRef.current = performance.now();

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
      rafRef.current = requestAnimationFrame(renderLoop);
    } catch (err) {
      console.error("Cinematic playback error:", err);
      // Fallback: run visuals without audio
      setState("playing");
      startTimeRef.current = performance.now();
      const duration = 60; // seconds
      const tick = () => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const pct = Math.min(elapsed / duration, 1);
        setProgress(pct);
        setSubtitle(getSubtitle(pct));
        if (pct >= 1) { setState("ended"); return; }

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.width / dpr;
            const h = canvas.height / dpr;
            const scene = getActiveScene(pct);
            const sp = Math.min(1, Math.max(0, (pct - scene.startPct) / (scene.endPct - scene.startPct)));
            const frame = buildSceneFrame(scene.id, sp, elapsed, bindings);
            renderFrame(ctx, w, h, frame, elapsed);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [muted, renderLoop, bindings]);

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
    if (audioRef.current) audioRef.current.muted = muted;
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

  /* ── Idle scene preview render ── */
  useEffect(() => {
    if (state !== "idle") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const idleLoop = () => {
      if (!running) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const t = performance.now() / 1000;
      const frame = buildSceneFrame("emergence", 0.2, t, bindings);
      renderFrame(ctx, w, h, frame, t);
      requestAnimationFrame(idleLoop);
    };
    requestAnimationFrame(idleLoop);
    return () => { running = false; };
  }, [state, bindings]);

  return (
    <section ref={containerRef} className="relative w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border/30"
        style={{ aspectRatio: "16 / 9" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Idle overlay */}
        <AnimatePresence>
          {(state === "idle" || state === "loading") && (
            <motion.div
              key="idle"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-sm text-foreground/50 font-medium tracking-wide font-['Space_Grotesk']">
                Platform Intelligence Film
              </p>
              <button
                onClick={startPlayback}
                disabled={state === "loading"}
                className="group relative w-16 h-16 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-all disabled:opacity-50"
              >
                {state === "loading" ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Play size={20} className="text-primary ml-0.5" />
                )}
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/15"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </button>
              <p className="text-[10px] text-muted-foreground/60">60-second cinematic overview</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        {(state === "playing" || state === "ended") && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground/5 z-10">
            <div className="h-full bg-primary/40 transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* Subtitle */}
        {state === "playing" && subtitle && (
          <motion.div
            className="absolute bottom-6 left-0 right-0 flex justify-center px-6 z-10"
            key={subtitle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full max-w-lg text-center"
              style={{ color: "rgba(200,210,230,0.8)", background: "rgba(10,12,20,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(200,210,230,0.08)" }}
            >
              {subtitle}
            </p>
          </motion.div>
        )}

        {/* Controls */}
        {(state === "playing" || state === "ended") && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={() => setMuted(m => !m)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(10,12,20,0.5)", border: "1px solid rgba(200,210,230,0.1)" }}
            >
              {muted ? <VolumeX size={12} color="rgba(200,210,230,0.6)" /> : <Volume2 size={12} color="rgba(200,210,230,0.6)" />}
            </button>
            {state === "ended" && (
              <button
                onClick={replay}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(10,12,20,0.5)", border: "1px solid rgba(200,210,230,0.1)" }}
              >
                <RotateCcw size={12} color="rgba(200,210,230,0.6)" />
              </button>
            )}
          </div>
        )}

        {/* Scene label */}
        {state === "playing" && (
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full font-['Space_Grotesk']"
              style={{ color: "rgba(200,210,230,0.4)", background: "rgba(10,12,20,0.4)", border: "1px solid rgba(200,210,230,0.06)" }}
            >
              {activeScene.label}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
