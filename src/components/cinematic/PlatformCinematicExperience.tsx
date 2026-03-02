import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle } from "lucide-react";
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
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "ended">("idle");
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [audioFailed, setAudioFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const aspectRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef(false);

  const bindings: DataBindings = {
    bindingConstraintStrength: 0.85,
    confidenceScore: 0.78,
    signalDensity: 0.72,
    decisionGrade: 0.88,
    lensWeight: 0.65,
    ...dataBindings,
  };

  const activeScene = getActiveScene(progress);

  /* ── Canvas resize ── */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = aspectRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
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

  /* ── Render a single frame ── */
  const drawFrame = useCallback((pct: number, elapsed: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const scene = getActiveScene(pct);
    const sp = Math.min(1, Math.max(0, (pct - scene.startPct) / (scene.endPct - scene.startPct)));
    const frame = buildSceneFrame(scene.id, sp, elapsed, bindings);
    renderFrame(ctx, w, h, frame, elapsed);
  }, [bindings]);

  /* ── Render loop (audio-synced) ── */
  const renderLoopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    const pct = audio.duration ? audio.currentTime / audio.duration : 0;
    setProgress(pct);
    setSubtitle(getSubtitle(pct));

    if (pct >= 0.999) {
      setState("ended");
      setProgress(1);
      return;
    }

    drawFrame(pct, audio.currentTime);
    rafRef.current = requestAnimationFrame(renderLoopAudio);
  }, [drawFrame]);

  /* ── Render loop (fallback timer) ── */
  const startFallbackLoop = useCallback(() => {
    fallbackRef.current = true;
    const duration = 60;
    const tick = () => {
      if (!fallbackRef.current) return;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      setSubtitle(getSubtitle(pct));
      if (pct >= 1) { setState("ended"); fallbackRef.current = false; return; }
      drawFrame(pct, elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  /* ── Playback control ── */
  const startPlayback = useCallback(async () => {
    setState("loading");
    startTimeRef.current = performance.now();
    setAudioFailed(false);

    // Create Audio element immediately in gesture context (iOS Safari)
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

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

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("audio")) throw new Error("Non-audio response");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audio.src = audioUrl;
      audio.muted = muted;

      audio.addEventListener("ended", () => {
        setState("ended");
        setProgress(1);
      });

      await audio.play();
      setState("playing");
      rafRef.current = requestAnimationFrame(renderLoopAudio);
    } catch (err) {
      console.warn("Cinematic audio unavailable, running visuals-only:", err);
      setAudioFailed(true);
      setState("playing");
      startTimeRef.current = performance.now();
      startFallbackLoop();
    }
  }, [muted, renderLoopAudio, startFallbackLoop]);

  const togglePause = useCallback(() => {
    if (state === "playing") {
      // Pause
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (fallbackRef.current) {
        fallbackRef.current = false;
        pausedAtRef.current = performance.now();
      }
      cancelAnimationFrame(rafRef.current);
      setState("paused");
    } else if (state === "paused") {
      // Resume
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
        setState("playing");
        rafRef.current = requestAnimationFrame(renderLoopAudio);
      } else {
        // Fallback resume
        const pauseDuration = performance.now() - pausedAtRef.current;
        startTimeRef.current += pauseDuration;
        setState("playing");
        fallbackRef.current = true;
        startFallbackLoop();
      }
    }
  }, [state, renderLoopAudio, startFallbackLoop]);

  const replay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    fallbackRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setProgress(0);
    setSubtitle("");
    setAudioFailed(false);
    setState("idle");
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      fallbackRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  /* ── Idle scene preview ── */
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

  /* ── Seek via click on timeline ── */
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
      setProgress(pct);
      setSubtitle(getSubtitle(pct));
    }
  }, []);

  const isActive = state === "playing" || state === "paused" || state === "ended";

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={aspectRef}
        className="relative w-full overflow-hidden rounded-2xl border border-border/30"
        style={{ background: "#060810", paddingBottom: "56.25%" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ═══ IDLE / LOADING OVERLAY ═══ */}
        <AnimatePresence>
          {(state === "idle" || state === "loading") && (
            <motion.div
              key="idle-overlay"
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Title */}
              <p className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "rgba(200,210,230,0.5)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Platform Intelligence Film
              </p>

              {/* Big play button */}
              <button
                onClick={startPlayback}
                disabled={state === "loading"}
                className="group relative flex items-center justify-center transition-all duration-300 disabled:opacity-50"
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(75,104,245,0.15)",
                  border: "2px solid rgba(75,104,245,0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {state === "loading" ? (
                  <motion.div
                    className="rounded-full"
                    style={{ width: 24, height: 24, border: "3px solid rgba(75,104,245,0.3)", borderTopColor: "rgba(75,104,245,0.9)" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Play size={28} fill="rgba(75,104,245,0.9)" color="rgba(75,104,245,0.9)" className="ml-1" />
                )}

                {/* Pulse ring */}
                {state === "idle" && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: "2px solid rgba(75,104,245,0.3)" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
              </button>

              <p style={{ color: "rgba(200,210,230,0.4)", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
                60-second cinematic overview • Click to play
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CENTER PLAY/PAUSE (hover or paused) ═══ */}
        <AnimatePresence>
          {((state === "playing" && hovered) || state === "paused") && (
            <motion.button
              key="center-control"
              onClick={togglePause}
              className="absolute inset-0 flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(10,12,20,0.7)",
                  border: "2px solid rgba(200,210,230,0.2)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {state === "paused" ? (
                  <Play size={28} fill="rgba(200,210,230,0.9)" color="rgba(200,210,230,0.9)" className="ml-1" />
                ) : (
                  <Pause size={28} color="rgba(200,210,230,0.9)" />
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ═══ ENDED OVERLAY ═══ */}
        <AnimatePresence>
          {state === "ended" && (
            <motion.div
              key="ended-overlay"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ background: "rgba(6,8,16,0.7)", backdropFilter: "blur(4px)" }}
            >
              <button
                onClick={replay}
                className="flex items-center justify-center transition-all"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(75,104,245,0.15)",
                  border: "2px solid rgba(75,104,245,0.4)",
                }}
              >
                <RotateCcw size={24} color="rgba(75,104,245,0.9)" />
              </button>
              <p style={{ color: "rgba(200,210,230,0.6)", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
                Replay
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ BOTTOM CONTROL BAR ═══ */}
        {isActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-20"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: hovered || state === "paused" || state === "ended" ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: "linear-gradient(transparent, rgba(6,8,16,0.8))" }}
          >
            {/* Seekable timeline */}
            <div
              className="w-full cursor-pointer group"
              style={{ height: 20, paddingTop: 8 }}
              onClick={handleTimelineClick}
            >
              <div className="w-full relative" style={{ height: 4, borderRadius: 2, background: "rgba(200,210,230,0.15)" }}>
                <div
                  className="absolute top-0 left-0 h-full transition-[width] duration-100"
                  style={{ width: `${progress * 100}%`, borderRadius: 2, background: "rgba(75,104,245,0.8)" }}
                />
                {/* Scrubber dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `${progress * 100}%`, transform: `translate(-50%, -50%)`,
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#4b68f5", border: "2px solid white",
                  }}
                />
              </div>
            </div>

            {/* Button row */}
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-2">
                {/* Play / Pause */}
                <button
                  onClick={togglePause}
                  className="flex items-center justify-center transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 6, background: "transparent" }}
                  title={state === "playing" ? "Pause" : "Play"}
                >
                  {state === "playing" ? (
                    <Pause size={18} color="rgba(200,210,230,0.9)" />
                  ) : (
                    <Play size={18} fill="rgba(200,210,230,0.9)" color="rgba(200,210,230,0.9)" className="ml-0.5" />
                  )}
                </button>

                {/* Volume */}
                <button
                  onClick={() => setMuted(m => !m)}
                  className="flex items-center justify-center transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 6, background: "transparent" }}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted || audioFailed ? (
                    <VolumeX size={18} color="rgba(200,210,230,0.7)" />
                  ) : (
                    <Volume2 size={18} color="rgba(200,210,230,0.7)" />
                  )}
                </button>

                {/* Time */}
                <span style={{ fontSize: 11, color: "rgba(200,210,230,0.5)", fontFamily: "'Inter', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                  {formatTime(progress * 60)} / 1:00
                </span>

                {/* Audio error indicator */}
                {audioFailed && (
                  <span className="flex items-center gap-1" style={{ fontSize: 10, color: "rgba(214,65,116,0.7)" }}>
                    <AlertCircle size={12} />
                    Audio unavailable
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Scene label */}
                <span
                  className="uppercase tracking-widest"
                  style={{ fontSize: 9, fontWeight: 700, color: "rgba(200,210,230,0.35)", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {activeScene.label}
                </span>

                {/* Replay */}
                <button
                  onClick={replay}
                  className="flex items-center justify-center transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 6, background: "transparent" }}
                  title="Replay"
                >
                  <RotateCcw size={16} color="rgba(200,210,230,0.6)" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ SUBTITLE ═══ */}
        {(state === "playing" || state === "paused") && subtitle && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center px-6 z-10"
            style={{ bottom: 56 }}
            key={subtitle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p
              className="text-xs sm:text-sm font-medium px-5 py-2 rounded-lg max-w-lg text-center"
              style={{
                color: "rgba(200,210,230,0.9)",
                background: "rgba(6,8,16,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(200,210,230,0.08)",
              }}
            >
              {subtitle}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
