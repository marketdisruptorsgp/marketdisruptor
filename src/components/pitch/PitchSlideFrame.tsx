import React from "react";

interface PitchSlideFrameProps {
  slideNumber: number;
  totalSlides: number;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  accentColor?: string;
  categoryLabel?: string;
  children: React.ReactNode;
  productName?: string;
}

/**
 * Institutional 16:9 slide frame — flat, typography-driven, with subtle design accents.
 * Matches Axial.net capital-markets aesthetic.
 */
export function PitchSlideFrame({
  slideNumber,
  totalSlides,
  title,
  subtitle,
  accentColor = "hsl(var(--primary))",
  categoryLabel,
  children,
  productName,
}: PitchSlideFrameProps) {
  const padNum = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="w-full relative" style={{ aspectRatio: "16 / 9" }}>
      <div
        className="w-full h-full flex flex-col rounded-md overflow-hidden relative"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* ─── Accent top bar ─── */}
        <div
          className="w-full flex-shrink-0"
          style={{ height: 3, background: accentColor }}
        />

        {/* ─── Slide header ─── */}
        <div
          className="flex items-end justify-between px-6 sm:px-10 pt-5 sm:pt-7 pb-4 sm:pb-5 flex-shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div>
            {categoryLabel && (
              <p
                className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5"
                style={{ color: accentColor, opacity: 0.8 }}
              >
                {categoryLabel}
              </p>
            )}
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

        {/* ─── Geometric corner accent (bottom-right "L") ─── */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 28,
            right: 16,
            width: 18,
            height: 18,
            borderRight: `2px solid ${accentColor}`,
            borderBottom: `2px solid ${accentColor}`,
            opacity: 0.2,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Cover/Title slide for presentation mode.
 */
export function PitchCoverSlide({
  productName,
  subtitle,
  accentColor = "hsl(var(--primary))",
  totalSlides,
}: {
  productName: string;
  subtitle?: string;
  accentColor?: string;
  totalSlides: number;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full relative" style={{ aspectRatio: "16 / 9" }}>
      <div
        className="w-full h-full flex flex-col rounded-md overflow-hidden relative"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* Accent top bar */}
        <div className="w-full flex-shrink-0" style={{ height: 3, background: accentColor }} />

        {/* Cover content */}
        <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 py-10">
          <p
            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ color: accentColor, opacity: 0.7 }}
          >
            Market Disruptor
          </p>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-8 sm:mb-12">
            Investor Pitch Deck
          </p>

          <h1
            className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4"
            style={{ color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {productName}
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-[70%] leading-relaxed mb-8 sm:mb-12">
              {subtitle}
            </p>
          )}

          <div className="mt-auto">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{today}</p>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1">
              Confidential · {totalSlides} Slides
            </p>
          </div>
        </div>

        {/* Geometric corner accent */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 20,
            right: 20,
            width: 28,
            height: 28,
            borderRight: `2px solid ${accentColor}`,
            borderBottom: `2px solid ${accentColor}`,
            opacity: 0.2,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Flat stat card — left accent border for visual pop.
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
      className="p-3 sm:p-4 rounded-md text-center relative overflow-hidden"
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid hsl(var(--border))",
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
