import React, { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PresentationModeProps {
  slides: React.ReactNode[];
  onExit: () => void;
}

/**
 * Fullscreen presentation mode — slides are rendered at 1920×1080
 * and scaled to fit the viewport. Black backdrop, keyboard navigation.
 */
export function PresentationMode({ slides, onExit }: PresentationModeProps) {
  const [current, setCurrent] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const slideRef = useRef<HTMLDivElement>(null);
  const total = slides.length;

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Scroll slide container to top on every slide change
  useEffect(() => {
    if (slideRef.current) {
      slideRef.current.scrollTop = 0;
    }
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

  // Auto-hide controls after inactivity
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
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

  const progress = total > 1 ? ((current) / (total - 1)) * 100 : 100;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
      style={{ background: "#000" }}
    >
      {/* Scaled slide */}
      <div
        ref={slideRef}
        style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "center center", overflow: "hidden" }}
      >
        {slides[current]}
      </div>

      {/* Click zones — left third = prev, right two-thirds = next */}
      <div className="fixed inset-0 z-[10000] flex" style={{ pointerEvents: "auto" }}>
        <div className="w-1/3 h-full cursor-w-resize" onClick={prev} />
        <div className="w-2/3 h-full cursor-e-resize" onClick={next} />
      </div>

      {/* Navigation arrows */}
      <div
        className="fixed inset-0 z-[10001] pointer-events-none transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
      >
        {current > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} color="rgba(255,255,255,0.7)" />
          </button>
        )}
        {current < total - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
            aria-label="Next slide"
          >
            <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
          </button>
        )}
      </div>

      {/* Bottom bar: progress + counter */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
      >
        {/* Progress bar */}
        <div className="w-full h-1" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, background: "rgba(255,255,255,0.35)" }}
          />
        </div>
        {/* Counter */}
        <div className="flex items-center justify-center py-3">
          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>
            {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* ESC button */}
      {showControls && (
        <button
          onClick={(e) => { e.stopPropagation(); onExit(); }}
          className="fixed top-5 right-6 z-[10002] px-4 py-2 rounded text-sm font-bold transition-opacity pointer-events-auto"
          style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
        >
          ESC
        </button>
      )}
    </div>
  );
}
