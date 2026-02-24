import React from "react";

interface PitchSlideFrameProps {
  slideNumber: number;
  totalSlides: number;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accentColor?: string;
  children: React.ReactNode;
  productName?: string;
}

/**
 * Professional 16:9 slide frame that mimics a PowerPoint/Keynote slide.
 * Each pitch section renders inside this for a presentation-grade look.
 */
export function PitchSlideFrame({
  slideNumber,
  totalSlides,
  title,
  subtitle,
  icon: Icon,
  accentColor = "hsl(var(--primary))",
  children,
  productName,
}: PitchSlideFrameProps) {
  return (
    <div className="w-full" style={{ aspectRatio: "16 / 9" }}>
      <div
        className="w-full h-full flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          boxShadow:
            "0 4px 24px -4px hsl(var(--foreground) / 0.08), 0 1px 4px -1px hsl(var(--foreground) / 0.04)",
        }}
      >
        {/* ─── Top accent bar ─── */}
        <div className="h-1.5 w-full flex-shrink-0" style={{ background: accentColor }} />

        {/* ─── Slide header ─── */}
        <div
          className="flex items-center justify-between px-6 sm:px-10 py-3 sm:py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: accentColor }}
            >
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <h2
                className="text-base sm:text-xl font-extrabold tracking-tight"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              {slideNumber}/{totalSlides}
            </span>
          </div>
        </div>

        {/* ─── Slide content ─── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-4 sm:py-6">
          {children}
        </div>

        {/* ─── Slide footer ─── */}
        <div
          className="flex items-center justify-between px-6 sm:px-10 py-2 sm:py-2.5 flex-shrink-0"
          style={{
            borderTop: "1px solid hsl(var(--border) / 0.5)",
            background: "hsl(var(--muted) / 0.3)",
          }}
        >
          <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Market Disruptor · Confidential
          </span>
          {productName && (
            <span className="text-[8px] sm:text-[10px] font-semibold text-muted-foreground truncate max-w-[40%]">
              {productName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A stat card used inside slides for key metrics, TAM/SAM/SOM, etc.
 */
export function SlideStatCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <div
      className="p-3 sm:p-4 rounded-lg text-center"
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className="text-lg sm:text-2xl font-extrabold"
        style={{ color: accentColor || "hsl(var(--foreground))" }}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Bullet list item for slides — larger text, professional spacing.
 */
export function SlideBullet({
  icon: Icon,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <Icon
        size={14}
        className="flex-shrink-0 mt-0.5"
        style={{ color: iconColor || "hsl(var(--primary))" }}
      />
      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{children}</p>
    </div>
  );
}
