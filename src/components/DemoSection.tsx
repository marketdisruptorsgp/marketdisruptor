import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward, SkipBack } from "lucide-react";

import SceneLimitation from "./demo/SceneLimitation";
import SceneEngagement from "./demo/SceneEngagement";
import SceneFlip from "./demo/SceneFlip";
import SceneSynthesis from "./demo/SceneSynthesis";
import ScenePositioning from "./demo/ScenePositioning";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC PRODUCT FILM — 60s, 5 scenes
   YouTube/Vimeo-style controls at bottom.
   ═══════════════════════════════════════════════════════════════ */

interface Scene {
  id: string;
  title: string;
  duration: number;
  Component: React.FC;
}

const SCENES: Scene[] = [
  { id: "limitation", title: "Limitation", duration: 8000, Component: SceneLimitation },
  { id: "engagement", title: "Engagement", duration: 12000, Component: SceneEngagement },
  { id: "flip", title: "The Flip", duration: 20000, Component: SceneFlip },
  { id: "synthesis", title: "Clarity", duration: 15000, Component: SceneSynthesis },
  { id: "positioning", title: "Position", duration: 5000, Component: ScenePositioning },
];

const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

const NARRATION: Record<string, string> = {
  limitation:
    "Most analysis improves features. But features aren't the system.",
  engagement:
    "Real performance is determined by structure — and structure is governed by constraint.",
  flip:
    "Instead of optimizing symptoms, the system decomposes the product, maps causality, and identifies what actually limits performance. When the dominant constraint is revealed, the solution isn't chosen — it becomes inevitable.",
  synthesis:
    "Change the structure. The outcome changes with it.",
  positioning:
    "Market Disruptor. See what to change.",
};

/* ── TTS Audio Engine ── */
const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

async function fetchTTSAudio(sceneId: string, text: string): Promise<string | null> {
  if (audioCache.has(sceneId)) return audioCache.get(sceneId)!;
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-tts`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text, actId: sceneId }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    audioCache.set(sceneId, blobUrl);
    return blobUrl;
  } catch {
    return null;
  }
}

function playAudioUrl(url: string) {
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

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Main Component ── */
export default function DemoSection() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [hoveringProgress, setHoveringProgress] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpoken = useRef(-1);
  const progressRef = useRef<HTMLDivElement>(null);

  const scene = SCENES[active];
  const startMs = SCENES.slice(0, active).reduce((s, sc) => s + sc.duration, 0);
  const globalElapsed = startMs + elapsed;
  const globalPct = (globalElapsed / TOTAL_DURATION) * 100;

  // Voiceover
  useEffect(() => {
    if (!playing || muted) {
      stopAudio();
      return;
    }
    if (lastSpoken.current === active) return;
    lastSpoken.current = active;
    const text = NARRATION[scene.id];
    if (text) {
      fetchTTSAudio(scene.id, text).then((url) => {
        if (url) playAudioUrl(url);
      });
    }
    return () => stopAudio();
  }, [active, playing, muted, scene.id]);

  // Timer
  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setElapsed((p) => {
        const next = p + 100;
        if (next >= scene.duration) {
          if (active < SCENES.length - 1) {
            setActive((s) => s + 1);
            return 0;
          } else {
            setPlaying(false);
            stopAudio();
            return scene.duration;
          }
        }
        return next;
      });
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, active, scene.duration]);

  // Sync audio
  useEffect(() => {
    if (playing && !muted) resumeAudio();
    else pauseAudio();
  }, [playing, muted]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m") {
        setMuted((m) => !m);
      } else if (e.key === "ArrowRight") {
        skipForward();
      } else if (e.key === "ArrowLeft") {
        skipBack();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p) lastSpoken.current = -1;
      return !p;
    });
  }, []);

  const skipForward = useCallback(() => {
    if (active < SCENES.length - 1) {
      stopAudio();
      lastSpoken.current = -1;
      setActive((s) => s + 1);
      setElapsed(0);
    }
  }, [active]);

  const skipBack = useCallback(() => {
    stopAudio();
    lastSpoken.current = -1;
    if (elapsed > 1000) {
      setElapsed(0);
    } else if (active > 0) {
      setActive((s) => s - 1);
      setElapsed(0);
    }
  }, [active, elapsed]);

  const restart = useCallback(() => {
    stopAudio();
    lastSpoken.current = -1;
    setActive(0);
    setElapsed(0);
    setPlaying(true);
  }, []);

  // Click on progress bar to seek
  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetMs = pct * TOTAL_DURATION;

      let cumulative = 0;
      for (let i = 0; i < SCENES.length; i++) {
        if (cumulative + SCENES[i].duration > targetMs) {
          stopAudio();
          lastSpoken.current = -1;
          setActive(i);
          setElapsed(targetMs - cumulative);
          return;
        }
        cumulative += SCENES[i].duration;
      }
    },
    []
  );

  // Click on viewport to toggle play (YouTube-style)
  const handleViewportClick = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{
        background: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Scene content — click to play/pause */}
      <div
        className="relative px-4 sm:px-8 py-8 min-h-[360px] flex flex-col cursor-pointer select-none"
        onClick={handleViewportClick}
      >
        {/* Big play overlay when paused */}
        <AnimatePresence>
          {!playing && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "hsl(var(--foreground) / 0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Play
                  className="w-6 h-6 ml-0.5"
                  style={{ color: "hsl(var(--foreground) / 0.7)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            <scene.Component />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom control bar (YouTube/Vimeo style) ── */}
      <div
        className="border-t px-3 py-2 space-y-1.5"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {/* Progress bar — clickable, hoverable */}
        <div
          ref={progressRef}
          className="group relative h-1 rounded-full cursor-pointer"
          style={{ background: "hsl(var(--foreground) / 0.06)" }}
          onClick={handleProgressClick}
          onMouseEnter={() => setHoveringProgress(true)}
          onMouseLeave={() => setHoveringProgress(false)}
        >
          {/* Scene markers */}
          {SCENES.slice(1).map((_, i) => {
            const markerMs = SCENES.slice(0, i + 1).reduce(
              (s, sc) => s + sc.duration,
              0
            );
            const markerPct = (markerMs / TOTAL_DURATION) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${markerPct}%`,
                  background: "hsl(var(--foreground) / 0.1)",
                }}
              />
            );
          })}

          {/* Filled progress */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${globalPct}%`,
              background: "hsl(var(--primary))",
            }}
          />

          {/* Scrubber dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${globalPct}%`,
              marginLeft: -5,
              width: hoveringProgress ? 12 : 0,
              height: hoveringProgress ? 12 : 0,
              background: "hsl(var(--primary))",
              transition: "width 0.15s, height 0.15s",
            }}
          />

          {/* Expand on hover */}
          <div
            className="absolute inset-x-0 transition-all rounded-full"
            style={{
              top: hoveringProgress ? -1 : 0,
              bottom: hoveringProgress ? -1 : 0,
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[hsl(var(--foreground)/0.05)]"
              style={{ color: "hsl(var(--foreground) / 0.8)" }}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            {/* Skip back */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                skipBack();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[hsl(var(--foreground)/0.05)]"
              style={{ color: "hsl(var(--foreground) / 0.6)" }}
              aria-label="Previous"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Skip forward */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                skipForward();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[hsl(var(--foreground)/0.05)]"
              style={{ color: "hsl(var(--foreground) / 0.6)" }}
              aria-label="Next"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Volume */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMuted((m) => !m);
                if (!muted) stopAudio();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[hsl(var(--foreground)/0.05)]"
              style={{ color: "hsl(var(--foreground) / 0.6)" }}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Time display */}
            <span
              className="text-[11px] font-mono tabular-nums ml-1"
              style={{ color: "hsl(var(--foreground) / 0.4)" }}
            >
              {formatTime(globalElapsed)} / {formatTime(TOTAL_DURATION)}
            </span>
          </div>

          {/* Right side: scene label + restart */}
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold tracking-wide hidden sm:inline"
              style={{ color: "hsl(var(--foreground) / 0.3)" }}
            >
              {scene.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                restart();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[hsl(var(--foreground)/0.05)]"
              style={{ color: "hsl(var(--foreground) / 0.5)" }}
              aria-label="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
