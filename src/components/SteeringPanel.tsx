import React, { useState, useCallback, useRef } from "react";
import { Sparkles, Send, Check } from "lucide-react";

interface SteeringPanelProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Optional: controlled steering text input with submit */
  steeringValue?: string;
  onSteeringChange?: (value: string) => void;
  onSteeringSubmit?: (value: string) => void;
  steeringPlaceholder?: string;
}

export function SteeringPanel({
  title = "Guide Your Analysis",
  description,
  children,
  steeringValue,
  onSteeringChange,
  onSteeringSubmit,
  steeringPlaceholder = "Add your context, preferences, or focus areas…",
}: SteeringPanelProps) {
  const [submitted, setSubmitted] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = useCallback(() => {
    if (onSteeringSubmit && steeringValue?.trim()) {
      onSteeringSubmit(steeringValue);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    }
  }, [onSteeringSubmit, steeringValue]);

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      if (onSteeringSubmit && steeringValue?.trim()) {
        onSteeringSubmit(steeringValue);
      }
    }, 500);
  }, [onSteeringSubmit, steeringValue]);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "hsl(var(--muted))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <Sparkles size={14} className="text-primary flex-shrink-0" />
        <div>
          <p className="typo-card-title">{title}</p>
          {description && <p className="typo-card-meta">{description}</p>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {children}

        {onSteeringChange && (
          <div className="space-y-2">
            <textarea
              value={steeringValue || ""}
              onChange={(e) => onSteeringChange(e.target.value)}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={steeringPlaceholder}
              className="w-full rounded-lg px-3 py-2 typo-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                minHeight: "60px",
              }}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={!steeringValue?.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg typo-button-secondary font-semibold transition-all"
                style={{
                  background: steeringValue?.trim() ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: steeringValue?.trim() ? "white" : "hsl(var(--muted-foreground))",
                  cursor: steeringValue?.trim() ? "pointer" : "default",
                }}
              >
                {submitted ? <Check size={14} /> : <Send size={14} />}
                {submitted ? "Saved" : "Submit Guidance"}
              </button>
              <span className="typo-card-meta text-muted-foreground">Also saves when you click away</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
