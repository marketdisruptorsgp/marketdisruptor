import React, { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TransitionStyle = "slide" | "fade" | "zoom" | "none";

const TRANSITION_VARIANTS: Record<TransitionStyle, {
  initial: (dir: number) => Record<string, number>;
  animate: Record<string, number>;
  exit: (dir: number) => Record<string, number>;
  transition: Record<string, unknown>;
}> = {
  slide: {
    initial: (dir) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -400 : 400, opacity: 0 }),
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  fade: {
    initial: () => ({ opacity: 0, scale: 0.97 }),
    animate: { opacity: 1, scale: 1 },
    exit: () => ({ opacity: 0, scale: 1.03 }),
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  zoom: {
    initial: (dir) => ({ opacity: 0, scale: dir > 0 ? 0.85 : 1.15 }),
    animate: { opacity: 1, scale: 1 },
    exit: (dir) => ({ opacity: 0, scale: dir > 0 ? 1.15 : 0.85 }),
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  none: {
    initial: () => ({}),
    animate: {},
    exit: () => ({}),
    transition: { duration: 0 },
  },
};

const TRANSITION_LABELS: Record<TransitionStyle, string> = {
  slide: "Slide",
  fade: "Fade",
  zoom: "Zoom",
  none: "Off",
};

interface PresentationModeProps {
  slides: React.ReactNode[];
  onExit: () => void;
}

export function PresentationMode({ slides, onExit }: PresentationModeProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [transition, setTransition] = useState<TransitionStyle>("fade");
  const [showSettings, setShowSettings] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const slideRef = useRef<HTMLDivElement>(null);
  const total = slides.length;

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => Math.min(c + 1, total - 1));
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    if (slideRef.current) slideRef.current.scrollTop = 0;
  }, [current]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onExit(); return; }
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onExit]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 3500);
    };
    window.addEventListener("mousemove", resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080, 1));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const progress = total > 1 ? (current / (total - 1)) * 100 : 100;
  const v = TRANSITION_VARIANTS[transition];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
      style={{ background: "#000" }}
    >
      {/* Scaled slide with animation */}
      <div
        ref={slideRef}
        style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "center center", overflow: "hidden", position: "relative" }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={v.initial(direction)}
            animate={v.animate}
            exit={v.exit(direction)}
            transition={v.transition}
            style={{ width: 1920, height: 1080, position: "absolute", inset: 0 }}
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Click zones */}
      <div className="fixed inset-0 z-[10000] flex" style={{ pointerEvents: "auto" }}>
        <div className="w-1/3 h-full cursor-w-resize" onClick={prev} />
        <div className="w-2/3 h-full cursor-e-resize" onClick={next} />
      </div>

      {/* Navigation arrows — always visible with strong contrast */}
      <div
        className="fixed inset-0 z-[10001] pointer-events-none transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
      >
        {current > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="pointer-events-auto absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}
            aria-label="Previous slide"
          >
            <ChevronLeft size={28} color="rgba(255,255,255,0.85)" />
          </button>
        )}
        {current < total - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="pointer-events-auto absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}
            aria-label="Next slide"
          >
            <ChevronRight size={28} color="rgba(255,255,255,0.85)" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
      >
        <div className="w-full h-1" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full"
            style={{ background: "rgba(255,255,255,0.4)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-center py-3">
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.45)", fontVariantNumeric: "tabular-nums" }}>
            {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Top-right controls: transition picker + ESC */}
      {showControls && (
        <div className="fixed top-5 right-6 z-[10002] flex items-center gap-3 pointer-events-auto">
          {/* Transition picker */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
              style={{ color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Sparkles size={14} /> {TRANSITION_LABELS[transition]}
            </button>
            {showSettings && (
              <div
                className="absolute top-full right-0 mt-2 rounded-lg overflow-hidden"
                style={{ background: "rgba(20,20,25,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 160 }}
              >
                <p className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>Transition</p>
                {(Object.keys(TRANSITION_LABELS) as TransitionStyle[]).map(t => (
                  <button
                    key={t}
                    onClick={(e) => { e.stopPropagation(); setTransition(t); setShowSettings(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3"
                    style={{
                      color: transition === t ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                      background: transition === t ? "rgba(255,255,255,0.08)" : "transparent",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: transition === t ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.15)" }} />
                    {TRANSITION_LABELS[t]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ESC button */}
          <button
            onClick={(e) => { e.stopPropagation(); onExit(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
            style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <X size={14} /> ESC
          </button>
        </div>
      )}
    </div>
  );
}
