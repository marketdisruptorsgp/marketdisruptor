import React, { useEffect, useState, useCallback, useRef } from "react";

interface PresentationModeProps {
  slides: React.ReactNode[];
  onExit: () => void;
}

/**
 * Fullscreen presentation mode — neutral black backdrop,
 * 1920×1080 slide scaled to fit, manual keyboard navigation only.
 */
export function PresentationMode({ slides, onExit }: PresentationModeProps) {
  const [current, setCurrent] = useState(0);
  const [showEsc, setShowEsc] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const total = slides.length;

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onExit(); return; }
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onExit]);

  // Fullscreen API
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  // Auto-hide ESC after 3s of no mouse movement
  useEffect(() => {
    const handleMove = () => {
      setShowEsc(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowEsc(false), 3000);
    };
    window.addEventListener("mousemove", handleMove);
    hideTimer.current = setTimeout(() => setShowEsc(false), 3000);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      clearTimeout(hideTimer.current);
    };
  }, []);

  // Scale calculation
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      const sw = window.innerWidth / 1920;
      const sh = window.innerHeight / 1080;
      setScale(Math.min(sw, sh, 1));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "#000" }}
      onClick={(e) => {
        // Click left half = prev, right half = next
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) prev();
        else next();
      }}
    >
      {/* Scaled slide container */}
      <div
        className="pitch-scaled"
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {slides[current]}
      </div>

      {/* Slide counter — bottom right */}
      <div className="fixed bottom-6 right-8 z-[10000]">
        <span className="text-xs font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>
          {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* ESC label — top right, auto-hides */}
      {showEsc && (
        <button
          onClick={(e) => { e.stopPropagation(); onExit(); }}
          className="fixed top-6 right-8 z-[10000] px-3 py-1.5 rounded text-xs font-bold transition-opacity"
          style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)" }}
        >
          ESC
        </button>
      )}
    </div>
  );
}
