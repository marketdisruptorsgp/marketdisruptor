import React, { useEffect, useState, useCallback, useRef } from "react";

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
  const [showEsc, setShowEsc] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const total = slides.length;

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

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

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080, 1));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "#000" }}
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) prev(); else next();
      }}
    >
      {/* Scaled slide — slides are already 1920×1080 */}
      <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "center center" }}>
        {slides[current]}
      </div>

      {/* Counter */}
      <div className="fixed bottom-6 right-8 z-[10000]">
        <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>
          {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* ESC */}
      {showEsc && (
        <button
          onClick={(e) => { e.stopPropagation(); onExit(); }}
          className="fixed top-6 right-8 z-[10000] px-4 py-2 rounded text-sm font-bold transition-opacity"
          style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)" }}
        >
          ESC
        </button>
      )}
    </div>
  );
}
