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
 * Institutional 16:9 slide frame.
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
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <DotGrid />
        <DiagonalAccent accentColor={accentColor} />

        {/* Accent top bar */}
        <div className="w-full flex-shrink-0" style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88 60%, transparent)` }} />

        {/* Header */}
        <div className="flex items-end justify-between px-5 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4 flex-shrink-0 relative z-10" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div>
            {categoryLabel && (
              <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: accentColor, opacity: 0.8 }}>{categoryLabel}</p>
            )}
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight" style={{ color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-normal mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground flex-shrink-0 tabular-nums">{padNum(slideNumber)} / {padNum(totalSlides)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-5 relative z-10">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-1.5 sm:py-2 flex-shrink-0 relative z-10" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Market Disruptor</span>
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Confidential</span>
          {productName && (
            <span className="text-[7px] sm:text-[8px] font-medium text-muted-foreground truncate max-w-[30%]">{productName}</span>
          )}
        </div>

        {/* Corner accent */}
        <div className="absolute pointer-events-none" style={{ bottom: 24, right: 14, width: 16, height: 16, borderRight: `2px solid ${accentColor}`, borderBottom: `2px solid ${accentColor}`, opacity: 0.18 }} />
      </div>
    </div>
  );
}

/**
 * Cover/Title slide.
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
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="w-full relative" style={{ aspectRatio: "16 / 9" }}>
      <div className="w-full h-full flex flex-col rounded-md overflow-hidden relative" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <DotGrid opacity={0.03} />
        <svg className="absolute pointer-events-none" style={{ top: -40, right: -40, opacity: 0.05 }} width="260" height="260">
          <circle cx="130" cy="130" r="120" fill="none" stroke={accentColor} strokeWidth="1.5" />
          <circle cx="130" cy="130" r="90" fill="none" stroke={accentColor} strokeWidth="0.8" />
          <circle cx="130" cy="130" r="60" fill="none" stroke={accentColor} strokeWidth="0.5" />
        </svg>
        <div className="w-full flex-shrink-0" style={{ height: 4, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66 50%, transparent)` }} />
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 py-8 relative z-10">
          <div className="flex items-start gap-4 mb-6 sm:mb-10">
            <MonogramLogo name={productName} accentColor={accentColor} size={52} />
            <div>
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] mb-0.5" style={{ color: accentColor, opacity: 0.7 }}>Market Disruptor</p>
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Investor Pitch Deck</p>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] mb-3" style={{ color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif" }}>{productName}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[85%] leading-relaxed mb-6 sm:mb-10">{subtitle}</p>
          )}
          <div className="w-14 mb-5" style={{ height: 2, background: accentColor, opacity: 0.3 }} />
          <div className="mt-auto">
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{today}</p>
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1">Confidential · {totalSlides} Slides</p>
          </div>
        </div>
        <div className="absolute pointer-events-none" style={{ bottom: 18, right: 18, width: 28, height: 28, borderRight: `2px solid ${accentColor}`, borderBottom: `2px solid ${accentColor}`, opacity: 0.18 }} />
      </div>
    </div>
  );
}

/**
 * Stat card with accent left border.
 */
export function SlideStatCard({ label, value, accentColor, sublabel }: { label: string; value: string; accentColor?: string; sublabel?: string }) {
  return (
    <div className="p-2.5 sm:p-3 rounded-md relative overflow-hidden" style={{ background: "hsl(var(--muted))", borderTop: "1px solid hsl(var(--border))", borderRight: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))", borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid hsl(var(--border))" }}>
      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs sm:text-sm font-extrabold leading-tight" style={{ color: "hsl(var(--foreground))" }}>{value}</p>
      {sublabel && <p className="text-[8px] text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

/**
 * TAM/SAM/SOM concentric circles visual — clean, no text overlap.
 */
export function MarketSizeVisual({ tam, sam, som, accentColor = "hsl(var(--primary))" }: { tam: string; sam: string; som: string; accentColor?: string }) {
  const extractAmount = (s: string) => {
    const match = s.match(/\$[\d.,]+\s*[BMKT]?/i);
    return match ? match[0] : s.split(" ")[0];
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Addressable Market Layers</p>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="75" fill={accentColor} opacity="0.05" stroke={accentColor} strokeWidth="1" strokeOpacity="0.15" />
        <circle cx="80" cy="80" r="50" fill={accentColor} opacity="0.08" stroke={accentColor} strokeWidth="1" strokeOpacity="0.2" />
        <circle cx="80" cy="80" r="26" fill={accentColor} opacity="0.14" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.3" />
        <text x="80" y="76" textAnchor="middle" fontSize="7" fontWeight="700" fill={accentColor} opacity="0.9">SOM</text>
        <text x="80" y="87" textAnchor="middle" fontSize="9" fontWeight="800" fill="hsl(var(--foreground))">{extractAmount(som)}</text>
      </svg>
      <div className="flex items-center gap-3">
        {[
          { label: "TAM", opacity: 0.15, val: extractAmount(tam) },
          { label: "SAM", opacity: 0.3, val: extractAmount(sam) },
          { label: "SOM", opacity: 0.5, val: extractAmount(som) },
        ].map(({ label, opacity, val }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: accentColor, opacity }} />
            <span className="text-[8px] font-bold text-muted-foreground">{label}</span>
            <span className="text-[8px] font-bold text-foreground">{val}</span>
          </div>
        ))}
      </div>
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
      <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: c.fill }}>{severity}</span>
    </div>
  );
}

/**
 * Horizontal bar chart for scenario comparison.
 */
export function ScenarioBarChart({ scenarios, accentColor = "hsl(var(--primary))" }: { scenarios: { label: string; value: string }[]; accentColor?: string }) {
  const widths = [40, 65, 100];
  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Projected Revenue by Scenario</p>
      {scenarios.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-muted-foreground w-16 text-right shrink-0">{s.label}</span>
          <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-sm flex items-center px-1.5" style={{ width: `${widths[i] || 50}%`, background: accentColor, opacity: 0.12 + (i * 0.12) }}>
              <span className="text-[8px] font-bold" style={{ color: "hsl(var(--foreground))" }}>{s.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Bullet item with numbered circle or dash.
 */
export function SlideBullet({ children, index, accentColor }: { icon?: React.ElementType; iconColor?: string; children: React.ReactNode; index?: number; accentColor?: string }) {
  return (
    <div className="flex gap-2 items-start">
      {typeof index === "number" ? (
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5" style={{ background: accentColor || "hsl(var(--foreground))", color: "hsl(var(--background))", opacity: 0.8 }}>{index + 1}</span>
      ) : (
        <span className="text-muted-foreground font-bold flex-shrink-0 mt-px text-xs">—</span>
      )}
      <p className="text-[11px] sm:text-xs text-foreground/85 leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * Quote block with accent border and label.
 */
export function SlideQuoteBlock({ quote, accentColor = "hsl(var(--primary))", label }: { quote: string; accentColor?: string; label?: string }) {
  return (
    <div className="relative p-4 sm:p-5 rounded-md" style={{ background: "hsl(var(--muted))", borderTop: "1px solid hsl(var(--border))", borderRight: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
      <span className="absolute pointer-events-none font-serif select-none" style={{ top: -6, left: 10, fontSize: 48, color: accentColor, opacity: 0.07, lineHeight: 1 }}>"</span>
      {label && <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>}
      <p className="text-[11px] sm:text-xs leading-relaxed text-foreground/85 relative z-10">{quote}</p>
    </div>
  );
}

/**
 * Vertical step timeline for GTM phases.
 */
export function SlideTimeline({ steps, accentColor = "hsl(var(--primary))" }: { steps: { label: string; content: string }[]; accentColor?: string }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0" style={{ background: accentColor, color: "white", opacity: 0.85 }}>{i + 1}</div>
            {i < steps.length - 1 && <div className="w-[1.5px] flex-1 min-h-[16px]" style={{ background: accentColor, opacity: 0.15 }} />}
          </div>
          <div className="pb-3 flex-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{step.label}</p>
            <p className="text-[11px] text-foreground/85 leading-relaxed">{step.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Horizontal progress bar for a metric.
 */
export function MetricBar({ metric, target, why, accentColor = "hsl(var(--primary))" }: { metric: string; target: string; why?: string; accentColor?: string }) {
  const hashWidth = ((metric.length * 7 + target.length * 13) % 55) + 35;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-foreground">{metric}</span>
        <span className="text-[9px] font-bold" style={{ color: accentColor }}>{target}</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: "hsl(var(--border))" }}>
        <div className="h-full rounded-full" style={{ width: `${hashWidth}%`, background: accentColor, opacity: 0.45 }} />
      </div>
      {why && <p className="text-[8px] text-muted-foreground">{why}</p>}
    </div>
  );
}

/**
 * SVG funnel/pipeline visual for GTM or conversion flow.
 */
export function FunnelVisual({ stages, accentColor = "hsl(var(--primary))" }: { stages: { label: string; value?: string }[]; accentColor?: string }) {
  const stageCount = stages.length;
  const barHeight = 18;
  const gap = 3;
  const totalH = stageCount * (barHeight + gap);
  const maxW = 200;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Conversion Funnel</p>
      <svg width={maxW + 40} height={totalH + 10} viewBox={`0 0 ${maxW + 40} ${totalH + 10}`}>
        {stages.map((stage, i) => {
          const w = maxW - (i * (maxW * 0.15));
          const x = (maxW - w) / 2 + 20;
          const y = i * (barHeight + gap) + 5;
          const opacity = 0.12 + (i * 0.08);
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barHeight} rx={3} fill={accentColor} opacity={opacity} stroke={accentColor} strokeWidth="0.5" strokeOpacity={0.2} />
              <text x={x + w / 2} y={y + barHeight / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="hsl(var(--foreground))" opacity="0.8">
                {stage.label}{stage.value ? ` · ${stage.value}` : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Simple donut chart for allocation visuals.
 */
export function DonutChart({ segments, label, size = 100, accentColor = "hsl(var(--primary))" }: { segments: { label: string; pct: number }[]; label?: string; size?: number; accentColor?: string }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const opacities = [0.6, 0.4, 0.25, 0.15, 0.1];

  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        {segments.map((seg, i) => {
          const dashLen = (seg.pct / 100) * circumference;
          const dashOffset = -offset;
          offset += dashLen;
          return (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={accentColor}
              strokeWidth="10"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              opacity={opacities[i] || 0.1}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 justify-center">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor, opacity: opacities[i] || 0.1 }} />
            <span className="text-[7px] text-muted-foreground">{seg.label} ({seg.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}