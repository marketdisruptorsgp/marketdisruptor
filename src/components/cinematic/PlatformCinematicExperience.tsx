import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, Subtitles } from "lucide-react";
import { renderFrame } from "./canvasEngine";
import { buildSceneFrame, getActiveScene, SCENE_TIMELINE, type DataBindings } from "./sceneDefinitions";

/* ═══════════════════════════════════════════════════════════
   VOICEOVER SCRIPT — exact lines for subtitle sync
   ═══════════════════════════════════════════════════════════ */
const SCRIPT_LINES = [
  "Most people don't fail because they lack ideas.",
  "They fail because they're solving the wrong problem.",
  "They add features. They lower prices. They copy competitors.",
  "They work harder…",
  "But they're building on assumptions they never questioned.",
  "And when the foundation is wrong, nothing on top of it works.",
  "This platform does something different.",
  "It takes any product, service, or business and breaks it down to what actually drives results.",
  "It strips away opinions. Challenges every assumption.",
  "Finds the real constraint holding growth back.",
  "Then it rebuilds the strategy from the ground up.",
  "Not just ideas — clear, creative solutions tied to real causes.",
  "Every strategy is stress-tested before you act.",
  "Every recommendation becomes an execution path.",
  "Every opportunity becomes decision-ready.",
  "Most tools help you improve what exists.",
  "This shows you what shouldn't exist at all.",
  "Stop optimizing symptoms. Start fixing what actually matters.",
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
  const [muted, setMuted] = useState(true);
  const autoplayTriggered = useRef(false);
  const [subtitle, setSubtitle] = useState("");
  const [audioFailed, setAudioFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef(false);

  const bindings: DataBindings = {
    bindingConstraintStrength: 0.85,
    confidenceScore: 0.78,
    signalDensity: 0.72,
    decisionGrade: 0.91,
    lensWeight: 0.65,
    ...dataBindings,
  };

  const activeScene = getActiveScene(progress);

  /* ── Canvas resize ── */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
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

  /* ── Draw single frame ── */
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
    if (pct >= 0.999) { setState("ended"); setProgress(1); return; }
    drawFrame(pct, audio.currentTime);
    rafRef.current = requestAnimationFrame(renderLoopAudio);
  }, [drawFrame]);

  /* ── Render loop (fallback 60s timer) ── */
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

  /* ── Start playback ── */
  const startPlayback = useCallback(async () => {
    setState("loading");
    startTimeRef.current = performance.now();
    setAudioFailed(false);

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
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("audio")) throw new Error("Non-audio response");
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audio.src = audioUrl;
      audio.muted = muted;
      audio.addEventListener("ended", () => { setState("ended"); setProgress(1); });
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

  /* ── Pause/resume ── */
  const togglePause = useCallback(() => {
    if (state === "playing") {
      if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
      if (fallbackRef.current) { fallbackRef.current = false; pausedAtRef.current = performance.now(); }
      cancelAnimationFrame(rafRef.current);
      setState("paused");
    } else if (state === "paused") {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
        setState("playing");
        rafRef.current = requestAnimationFrame(renderLoopAudio);
      } else {
        startTimeRef.current += performance.now() - pausedAtRef.current;
        setState("playing");
        fallbackRef.current = true;
        startFallbackLoop();
      }
    }
  }, [state, renderLoopAudio, startFallbackLoop]);

  /* ── Replay ── */
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

  /* ── Mute sync ── */
  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  /* ── Fullscreen ── */
  const toggleFullscreen = useCallback(async () => {
    const el = sectionRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* ── Autoplay on mute ── */
  useEffect(() => {
    if (autoplayTriggered.current) return;
    autoplayTriggered.current = true;
    // Small delay to let canvas mount
    const t = setTimeout(() => {
      setMuted(true);
      startPlayback();
    }, 600);
    return () => clearTimeout(t);
  }, [startPlayback]);

  /* ── Cleanup ── */
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

  /* ── Idle ambient animation ── */
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
      // Gentle breathing animation on problem scene
      const breathe = 0.25 + Math.sin(t * 0.4) * 0.05;
      const frame = buildSceneFrame("problem", breathe, t, bindings);
      renderFrame(ctx, w, h, frame, t);
      requestAnimationFrame(idleLoop);
    };
    requestAnimationFrame(idleLoop);
    return () => { running = false; };
  }, [state, bindings]);

  /* ── Seek ── */
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
      setProgress(pct);
      setSubtitle(getSubtitle(pct));
    } else if (fallbackRef.current || state === "paused") {
      // For fallback mode, adjust start time
      const duration = 60;
      startTimeRef.current = performance.now() - pct * duration * 1000;
      setProgress(pct);
      setSubtitle(getSubtitle(pct));
    }
  }, [state]);

  const isActive = state === "playing" || state === "paused" || state === "ended";
  const showControls = hovered || state === "paused" || state === "ended";

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={isFullscreen ? { background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center" } : undefined}
    >
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          paddingBottom: "56.25%",
          background: "#f8f9fc",
          boxShadow: "0 8px 60px rgba(75,104,245,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: "1.5px solid rgba(75,104,245,0.12)",
          borderRadius: 20,
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ═══ IDLE / LOADING OVERLAY ═══ */}
        <AnimatePresence>
          {(state === "idle" || state === "loading") && (
            <motion.div
              key="idle"
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "rgba(248,249,252,0.82)", backdropFilter: "blur(8px)" }}
            >
              <p
                className="text-[10px] font-bold tracking-[0.25em] uppercase"
                style={{ color: "rgba(30,31,46,0.4)" }}
              >
                Watch the Demo
              </p>

              <button
                onClick={startPlayback}
                disabled={state === "loading"}
                className="group relative flex items-center justify-center transition-all duration-300 disabled:opacity-50"
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "rgba(75,104,245,0.06)",
                  border: "1.5px solid rgba(75,104,245,0.2)",
                }}
              >
                {state === "loading" ? (
                  <motion.div
                    className="rounded-full"
                    style={{ width: 28, height: 28, border: "2.5px solid rgba(75,104,245,0.15)", borderTopColor: "#4b68f5" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Play size={30} fill="#4b68f5" color="#4b68f5" className="ml-1" />
                )}
                {state === "idle" && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: "1.5px solid rgba(75,104,245,0.15)" }}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </button>

              <p className="text-[11px] font-medium" style={{ color: "rgba(30,31,46,0.35)" }}>
                {muted ? "🔇 Tap to unmute" : "60-second overview"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ CENTER PAUSE CONTROL ═══ */}
        <AnimatePresence>
          {((state === "playing" && hovered) || state === "paused") && (
            <motion.button
              key="center-ctl"
              onClick={togglePause}
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ background: "rgba(248,249,252,0.18)" }}
            >
              <div
                className="flex items-center justify-center transition-transform duration-200 hover:scale-105"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}
              >
                {state === "paused" ? (
                  <Play size={26} fill="#4b68f5" color="#4b68f5" className="ml-0.5" />
                ) : (
                  <Pause size={26} color="#1a1f2e" />
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ═══ ENDED OVERLAY ═══ */}
        <AnimatePresence>
          {state === "ended" && (
            <motion.div
              key="ended"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ background: "rgba(248,249,252,0.85)", backdropFilter: "blur(8px)" }}
            >
              <button
                onClick={replay}
                className="flex items-center justify-center transition-all hover:scale-105"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(75,104,245,0.06)",
                  border: "1.5px solid rgba(75,104,245,0.2)",
                }}
              >
                <RotateCcw size={24} color="#4b68f5" />
              </button>
              <p className="text-xs font-medium" style={{ color: "rgba(30,31,46,0.4)" }}>
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
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 4 }}
            transition={{ duration: 0.25 }}
            style={{ background: "linear-gradient(transparent, rgba(248,249,252,0.96) 40%)" }}
          >
            {/* Timeline */}
            <div
              className="w-full cursor-pointer group"
              style={{ height: 22, paddingTop: 10, paddingLeft: 14, paddingRight: 14 }}
              onClick={handleTimelineClick}
            >
              <div className="w-full relative" style={{ height: 3, borderRadius: 2, background: "rgba(0,0,0,0.06)" }}>
                {/* Scene markers */}
                {SCENE_TIMELINE.slice(1).map((s, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px"
                    style={{ left: `${s.startPct * 100}%`, background: "rgba(0,0,0,0.08)" }}
                  />
                ))}
                {/* Filled progress */}
                <div
                  className="absolute top-0 left-0 h-full transition-[width] duration-75"
                  style={{ width: `${progress * 100}%`, borderRadius: 2, background: "#4b68f5" }}
                />
                {/* Scrubber dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{
                    left: `${progress * 100}%`, transform: "translate(-50%, -50%)",
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#4b68f5", border: "2px solid white",
                    boxShadow: "0 1px 6px rgba(75,104,245,0.3)",
                  }}
                />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePause}
                  className="flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 8 }}
                >
                  {state === "playing" ? (
                    <Pause size={16} color="#1a1f2e" />
                  ) : (
                    <Play size={16} fill="#1a1f2e" color="#1a1f2e" className="ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => setMuted(m => !m)}
                  className="flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 8 }}
                >
                  {muted || audioFailed ? (
                    <VolumeX size={16} color="#8892a8" />
                  ) : (
                    <Volume2 size={16} color="#1a1f2e" />
                  )}
                </button>

                <span className="text-[11px] tabular-nums ml-1" style={{ color: "rgba(30,31,46,0.35)" }}>
                  {formatTime(progress * 60)} / 1:00
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className="text-[9px] font-bold tracking-[0.15em] uppercase hidden sm:inline mr-1"
                  style={{ color: "rgba(30,31,46,0.25)" }}
                >
                  {activeScene.label}
                </span>

                {/* CC toggle */}
                <button
                  onClick={() => setCcEnabled(c => !c)}
                  className="flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    ...(ccEnabled ? { background: "rgba(75,104,245,0.08)" } : {}),
                  }}
                  aria-label={ccEnabled ? "Disable captions" : "Enable captions"}
                  title={ccEnabled ? "Captions on" : "Captions off"}
                >
                  <Subtitles size={14} color={ccEnabled ? "#4b68f5" : "#8892a8"} />
                </button>

                {/* Restart */}
                <button
                  onClick={replay}
                  className="flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 8 }}
                  aria-label="Restart"
                  title="Restart"
                >
                  <RotateCcw size={14} color="#8892a8" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                  style={{ width: 32, height: 32, borderRadius: 8 }}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize size={14} color="#1a1f2e" />
                  ) : (
                    <Maximize size={14} color="#1a1f2e" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ SUBTITLE ═══ */}
        {(state === "playing" || state === "paused") && subtitle && ccEnabled && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center px-6 z-10"
            style={{ bottom: 58 }}
            key={subtitle}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-[11px] sm:text-[13px] font-medium px-5 py-2 rounded-lg max-w-lg text-center leading-relaxed"
              style={{
                color: "#1a1f2e",
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
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
