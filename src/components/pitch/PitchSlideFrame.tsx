import React from "react";

interface PitchSlideFrameProps {
  slideNumber: number;
  totalSlides: number;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  accentColor?: string;
  children: React.ReactNode;
  productName?: string;
}

/**
 * Institutional 16:9 slide frame — flat, typography-driven, zero decoration.
 * Matches Axial.net capital-markets aesthetic.
 */
export function PitchSlideFrame({
  slideNumber,
  totalSlides,
  title,
  subtitle,
  children,
  productName,
}: PitchSlideFrameProps) {
  const padNum = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="w-full" style={{ aspectRatio: "16 / 9" }}>
      <div
        className="w-full h-full flex flex-col rounded-md overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* ─── Slide header ─── */}
        <div
          className="flex items-end justify-between px-6 sm:px-10 pt-6 sm:pt-8 pb-4 sm:pb-5 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div>
            <h2
              className="text-lg sm:text-[22px] font-extrabold tracking-tight leading-tight"
              style={{ color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-muted-foreground font-normal mt-1 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          <span
            className="text-[10px] sm:text-[11px] font-medium text-muted-foreground flex-shrink-0 tabular-nums"
          >
            {padNum(slideNumber)} / {padNum(totalSlides)}
          </span>
        </div>

        {/* ─── Slide content ─── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-5 sm:py-7">
          {children}
        </div>

        {/* ─── Slide footer ─── */}
        <div
          className="flex items-center justify-between px-6 sm:px-10 py-2 sm:py-2.5 flex-shrink-0"
          style={{
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Market Disruptor
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Confidential
          </span>
          {productName && (
            <span className="text-[8px] sm:text-[9px] font-medium text-muted-foreground truncate max-w-[30%]">
              {productName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Flat stat card — no colored accents, typography-driven.
 */
export function SlideStatCard({
  label,
  value,
}: {
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <div
      className="p-3 sm:p-4 rounded-md text-center"
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
        style={{ color: "hsl(var(--foreground))" }}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Bullet list item — em-dash prefix, no colored icons.
 */
export function SlideBullet({
  children,
}: {
  icon?: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="text-muted-foreground font-bold flex-shrink-0 mt-px text-sm">—</span>
      <p className="text-[13px] sm:text-sm text-foreground/85 leading-relaxed">{children}</p>
    </div>
  );
}
