import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

import SceneLimitation from "./demo/SceneLimitation";
import SceneEngagement from "./demo/SceneEngagement";
import SceneFlip from "./demo/SceneFlip";
import SceneGeneralization from "./demo/SceneGeneralization";
import SceneSynthesis from "./demo/SceneSynthesis";
import ScenePositioning from "./demo/ScenePositioning";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC PRODUCT DEMO — 60s, 6 scenes
   Premium product launch storytelling. Not a tutorial.
   ═══════════════════════════════════════════════════════════════ */

interface Scene {
  id: string;
  title: string;
  duration: number;
  Component: React.FC;
}

const SCENES: Scene[] = [
  { id: "limitation", title: "The Limitation", duration: 8000, Component: SceneLimitation },
  { id: "engagement", title: "System Engagement", duration: 12000, Component: SceneEngagement },
  { id: "flip", title: "First-Principles Flip", duration: 12000, Component: SceneFlip },
  { id: "generalization", title: "Generalization", duration: 10000, Component: SceneGeneralization },
  { id: "synthesis", title: "Decision Synthesis", duration: 10000, Component: SceneSynthesis },
  { id: "positioning", title: "Positioning", duration: 8000, Component: ScenePositioning },
];

const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

/* ── Voiceover narration scripts ── */
const NARRATION: Record<string, string> = {
  limitation:
    "Conventional tools recommend improvements without understanding the system. More power. More features. More noise. None of it addresses the real problem.",
  engagement:
    "The system maps every friction, scores each constraint, and mathematically proves which one dominates. Coverage geometry emerges as the binding constraint... removing it resolves seventy-three percent of downstream problems.",
  flip:
    "This is the moment everything changes. Conventional thinking says increase power. Structural reasoning says fix coverage geometry. The entire recommendation flips... when the real constraint is identified.",
  generalization:
    "Same reasoning engine. Product mode reveals design geometry. Service mode reveals placement workflow. Business mode reveals install footprint. Three domains. One structural truth.",
  synthesis:
    "From objective, to binding constraint, to leverage point, to decision. The causal chain assembles itself. Confidence locks. Execution priority is clear.",
  positioning:
    "Stop optimizing symptoms. Identify what actually drives outcomes.",
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

/* ── Main Component ── */
export default function DemoSection() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpoken = useRef(-1);

  const scene = SCENES[active];

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

  // Sync audio with play/mute state
  useEffect(() => {
    if (playing && !muted) resumeAudio();
    else pauseAudio();
  }, [playing, muted]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "m") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const goTo = useCallback((i: number) => {
    stopAudio();
    lastSpoken.current = -1;
    setActive(i);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const restart = useCallback(() => {
    stopAudio();
    lastSpoken.current = -1;
    setActive(0);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const startMs = SCENES.slice(0, active).reduce((s, sc) => s + sc.duration, 0);
  const globalPct = ((startMs + elapsed) / TOTAL_DURATION) * 100;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Control bar */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.25em]"
          style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
        >
          Product Demo
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (!playing) lastSpoken.current = -1;
              setPlaying((p) => !p);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: playing
                ? "hsl(var(--primary))"
                : "hsl(var(--muted))",
              color: playing
                ? "hsl(var(--primary-foreground))"
                : "hsl(var(--foreground))",
            }}
          >
            {playing ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={restart}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setMuted((m) => !m);
              if (!muted) stopAudio();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
            }}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Global progress */}
      <div className="h-0.5" style={{ background: "hsl(var(--border))" }}>
        <motion.div
          className="h-full"
          style={{
            background: "hsl(var(--primary))",
            width: `${globalPct}%`,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Scene dots */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-2.5">
        {SCENES.map((s, i) => {
          const isActive = i === active;
          const isPast = i < active;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
              style={{
                background: isActive
                  ? "hsl(var(--primary) / 0.08)"
                  : "transparent",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: isActive
                    ? "hsl(var(--primary))"
                    : isPast
                    ? "hsl(var(--foreground) / 0.3)"
                    : "hsl(var(--muted-foreground) / 0.2)",
                }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline"
                style={{
                  color: isActive
                    ? "hsl(var(--primary))"
                    : isPast
                    ? "hsl(var(--foreground) / 0.4)"
                    : "hsl(var(--muted-foreground) / 0.3)",
                }}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scene content */}
      <div className="px-4 sm:px-8 pb-8 pt-2 min-h-[340px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            <scene.Component />
          </motion.div>
        </AnimatePresence>

        {/* Scene progress */}
        <div className="mt-6 max-w-xs mx-auto w-full">
          <div
            className="h-0.5 rounded-full overflow-hidden"
            style={{ background: "hsl(var(--border))" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                background: "hsl(var(--primary) / 0.3)",
                width: `${(elapsed / scene.duration) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
