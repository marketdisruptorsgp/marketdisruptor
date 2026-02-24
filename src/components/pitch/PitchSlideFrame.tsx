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

/** Subtle dot-grid SVG background pattern */
function DotGrid({ color = "hsl(var(--foreground))", opacity = 0.04 }: { color?: string; opacity?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
      <defs>
        <pattern id="pitch-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pitch-dots)" />
    </svg>
  );
}

/** Decorative diagonal lines for visual interest */
function DiagonalAccent({ accentColor }: { accentColor: string }) {
  return (
    <svg className="absolute top-0 right-0 pointer-events-none" width="120" height="120" style={{ opacity: 0.06 }}>
      <line x1="40" y1="0" x2="120" y2="80" stroke={accentColor} strokeWidth="1" />
      <line x1="60" y1="0" x2="120" y2="60" stroke={accentColor} strokeWidth="1" />
      <line x1="80" y1="0" x2="120" y2="40" stroke={accentColor} strokeWidth="0.5" />
    </svg>
  );
}

/** Monogram logo — generates initials in a styled circle */
function MonogramLogo({ name, accentColor, size = 48 }: { name: string; accentColor: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.3" />
      <circle cx={r} cy={r} r={r - 5} fill={accentColor} opacity="0.08" />
      <text
        x="50%" y="52%"
        dominantBaseline="middle" textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight="800"
        fontSize={size * 0.36}
        fill={accentColor}
        opacity="0.7"
      >
        {initials}
      </text>
    </svg>
  );
}

/**
 * Institutional 16:9 slide frame with subtle visual design elements.
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
        {/* Background dot grid */}
        <DotGrid />
        {/* Diagonal accent lines */}
        <DiagonalAccent accentColor={accentColor} />

        {/* ─── Accent top bar — gradient ─── */}
        <div
          className="w-full flex-shrink-0"
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88 60%, transparent)`,
          }}
        />

        {/* ─── Slide header ─── */}
        <div
          className="flex items-end justify-between px-6 sm:px-10 pt-5 sm:pt-7 pb-4 sm:pb-5 flex-shrink-0 relative z-10"
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
          <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground flex-shrink-0 tabular-nums">
            {padNum(slideNumber)} / {padNum(totalSlides)}
          </span>
        </div>

        {/* ─── Slide content ─── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-5 sm:py-7 relative z-10">
          {children}
        </div>

        {/* ─── Slide footer ─── */}
        <div
          className="flex items-center justify-between px-6 sm:px-10 py-2 sm:py-2.5 flex-shrink-0 relative z-10"
          style={{ borderTop: "1px solid hsl(var(--border))" }}
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
            opacity: 0.18,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Cover/Title slide with monogram logo and gradient accent.
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
        {/* Background elements */}
        <DotGrid opacity={0.03} />

        {/* Large decorative circle — top right */}
        <svg className="absolute pointer-events-none" style={{ top: -40, right: -40, opacity: 0.05 }} width="260" height="260">
          <circle cx="130" cy="130" r="120" fill="none" stroke={accentColor} strokeWidth="1.5" />
          <circle cx="130" cy="130" r="90" fill="none" stroke={accentColor} strokeWidth="0.8" />
          <circle cx="130" cy="130" r="60" fill="none" stroke={accentColor} strokeWidth="0.5" />
        </svg>

        {/* Gradient accent bar */}
        <div
          className="w-full flex-shrink-0"
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66 50%, transparent)`,
          }}
        />

        {/* Cover content */}
        <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 py-10 relative z-10">
          <div className="flex items-start gap-5 mb-8 sm:mb-12">
            <MonogramLogo name={productName} accentColor={accentColor} size={56} />
            <div>
              <p
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] mb-1"
                style={{ color: accentColor, opacity: 0.7 }}
              >
                Market Disruptor
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Investor Pitch Deck
              </p>
            </div>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4"
            style={{ color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {productName}
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-[65%] leading-relaxed mb-8 sm:mb-12">
              {subtitle}
            </p>
          )}

          {/* Horizontal rule accent */}
          <div className="w-16 mb-6" style={{ height: 2, background: accentColor, opacity: 0.3 }} />

          <div className="mt-auto">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{today}</p>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1">
              Confidential · {totalSlides} Slides
            </p>
          </div>
        </div>

        {/* Geometric corner accent — larger on cover */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRight: `2px solid ${accentColor}`,
            borderBottom: `2px solid ${accentColor}`,
            opacity: 0.18,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Stat card with accent left border and subtle gradient.
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
      <p className="text-lg sm:text-2xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </p>
    </div>
  );
}

/**
 * TAM/SAM/SOM concentric circles visual.
 */
export function MarketSizeVisual({
  tam,
  sam,
  som,
  accentColor = "hsl(var(--primary))",
}: {
  tam: string;
  sam: string;
  som: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-center py-2">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* TAM - outer */}
        <circle cx="90" cy="90" r="85" fill={accentColor} opacity="0.06" stroke={accentColor} strokeWidth="1" strokeOpacity="0.2" />
        <text x="90" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill={accentColor} opacity="0.6">TAM</text>
        <text x="90" y="32" textAnchor="middle" fontSize="8" fontWeight="800" fill="hsl(var(--foreground))" opacity="0.7">{tam}</text>
        {/* SAM - middle */}
        <circle cx="90" cy="90" r="58" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1" strokeOpacity="0.25" />
        <text x="90" y="48" textAnchor="middle" fontSize="7" fontWeight="700" fill={accentColor} opacity="0.7">SAM</text>
        <text x="90" y="58" textAnchor="middle" fontSize="8" fontWeight="800" fill="hsl(var(--foreground))" opacity="0.8">{sam}</text>
        {/* SOM - inner */}
        <circle cx="90" cy="90" r="32" fill={accentColor} opacity="0.12" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.35" />
        <text x="90" y="85" textAnchor="middle" fontSize="7" fontWeight="700" fill={accentColor} opacity="0.9">SOM</text>
        <text x="90" y="97" textAnchor="middle" fontSize="9" fontWeight="800" fill="hsl(var(--foreground))">{som}</text>
      </svg>
    </div>
  );
}

/**
 * Risk severity indicator bar.
 */
export function RiskSeverityBar({ severity }: { severity: "high" | "medium" | "low" }) {
  const colors = {
    high: { fill: "hsl(0 72% 51%)", width: "100%" },
    medium: { fill: "hsl(38 92% 50%)", width: "60%" },
    low: { fill: "hsl(142 71% 45%)", width: "30%" },
  };
  const c = colors[severity];
  return (
    <div className="flex items-center gap-2 min-w-[60px]">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full transition-all" style={{ width: c.width, background: c.fill }} />
      </div>
      <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: c.fill }}>{severity}</span>
    </div>
  );
}

/**
 * Mini horizontal bar chart for scenario comparison.
 */
export function ScenarioBarChart({
  scenarios,
  accentColor = "hsl(var(--primary))",
}: {
  scenarios: { label: string; value: string }[];
  accentColor?: string;
}) {
  const widths = [45, 70, 100]; // conservative, base, optimistic proportional widths
  return (
    <div className="space-y-2 py-1">
      {scenarios.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="text-[9px] font-bold text-muted-foreground w-20 text-right shrink-0">{s.label}</span>
          <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div
              className="h-full rounded-sm flex items-center px-2"
              style={{
                width: `${widths[i] || 50}%`,
                background: accentColor,
                opacity: 0.15 + (i * 0.12),
              }}
            >
              <span className="text-[9px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{s.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Bullet list item — em-dash prefix.
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
