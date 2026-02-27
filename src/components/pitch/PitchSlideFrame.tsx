import React, { useRef, useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   PRESENTATION ENGINE — All components render at 1920×1080
   and scale to fit any container via ScaledSlide.
   Typography uses fixed pixel values for predictable output.
   ═══════════════════════════════════════════════════════════════ */

// ── ScaledSlide Container ─────────────────────────────────────
export function ScaledSlide({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.42);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => setScale(Math.min(el.getBoundingClientRect().width / 1920, 1));
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 1920, height: 1080,
        left: "50%", top: "50%", marginLeft: -960, marginTop: -540,
        transform: `scale(${scale})`, transformOrigin: "center center",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Decorative Elements ───────────────────────────────────────
function DotGrid({ color = "currentColor", opacity = 0.025 }: { color?: string; opacity?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }}>
      <defs>
        <pattern id="pitch-dots-lg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.2" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pitch-dots-lg)" />
    </svg>
  );
}

function DiagonalAccent({ accentColor }: { accentColor: string }) {
  return (
    <svg className="absolute top-0 right-0 pointer-events-none" width="240" height="240" style={{ opacity: 0.05 }}>
      <line x1="80" y1="0" x2="240" y2="160" stroke={accentColor} strokeWidth="1.5" />
      <line x1="120" y1="0" x2="240" y2="120" stroke={accentColor} strokeWidth="1" />
      <line x1="160" y1="0" x2="240" y2="80" stroke={accentColor} strokeWidth="0.7" />
    </svg>
  );
}

// ── Monogram ──────────────────────────────────────────────────
function MonogramLogo({ name, accentColor, size = 80 }: { name: string; accentColor: string; size?: number }) {
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 2} fill="none" stroke={accentColor} strokeWidth="2" opacity="0.3" />
      <circle cx={r} cy={r} r={r - 8} fill={accentColor} opacity="0.08" />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif" fontWeight="800"
        fontSize={size * 0.36} fill={accentColor} opacity="0.7">
        {initials}
      </text>
    </svg>
  );
}

// ── Main Slide Frame (1920×1080) ──────────────────────────────
interface PitchSlideFrameProps {
  slideNumber: number;
  totalSlides: number;
  title: string;
  subtitle?: string;
  accentColor?: string;
  categoryLabel?: string;
  children: React.ReactNode;
  productName?: string;
}

export function PitchSlideFrame({
  slideNumber, totalSlides, title, subtitle,
  accentColor = "#4b68f5", categoryLabel, children, productName,
}: PitchSlideFrameProps) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ width: 1920, height: 1080, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}>
      <DotGrid />
      <DiagonalAccent accentColor={accentColor} />

      {/* Accent bar */}
      <div style={{ width: "100%", height: 6, flexShrink: 0, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66 60%, transparent)` }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "36px 72px 28px", flexShrink: 0, borderBottom: "1px solid hsl(var(--border))", position: "relative", zIndex: 10 }}>
        <div>
          {categoryLabel && (
            <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.2em", color: accentColor, opacity: 0.85, marginBottom: 10, textTransform: "uppercase" }}>{categoryLabel}</p>
          )}
          <h2 style={{ fontSize: 48, fontWeight: 800, color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.1, letterSpacing: "-0.01em" }}>{title}</h2>
          {subtitle && (
            <p style={{ fontSize: 22, color: "hsl(var(--muted-foreground))", marginTop: 8, lineHeight: 1.4 }}>{subtitle}</p>
          )}
        </div>
        <span style={{ fontSize: 18, fontWeight: 500, color: "hsl(var(--muted-foreground))", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
          {pad(slideNumber)} / {pad(totalSlides)}
        </span>
      </div>

      {/* Content — NO overflow scroll */}
      <div style={{ flex: 1, padding: "36px 72px", position: "relative", zIndex: 10, display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 72px", flexShrink: 0, borderTop: "1px solid hsl(var(--border))", position: "relative", zIndex: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", textTransform: "uppercase" }}>Market Disruptor</span>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", textTransform: "uppercase" }}>Confidential</span>
        {productName && (
          <span style={{ fontSize: 14, fontWeight: 500, color: "hsl(var(--muted-foreground))", maxWidth: "30%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{productName}</span>
        )}
      </div>

      {/* Corner accent */}
      <div style={{ position: "absolute", bottom: 48, right: 32, width: 28, height: 28, borderRight: `2px solid ${accentColor}`, borderBottom: `2px solid ${accentColor}`, opacity: 0.18, pointerEvents: "none" }} />
    </div>
  );
}

// ── Cover Slide (1920×1080) ───────────────────────────────────
export function PitchCoverSlide({ productName, subtitle, accentColor = "#4b68f5", totalSlides }: {
  productName: string; subtitle?: string; accentColor?: string; totalSlides: number;
}) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ width: 1920, height: 1080, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}>
      <DotGrid opacity={0.02} />
      <svg className="absolute pointer-events-none" style={{ top: -60, right: -60, opacity: 0.04 }} width="400" height="400">
        <circle cx="200" cy="200" r="190" fill="none" stroke={accentColor} strokeWidth="2" />
        <circle cx="200" cy="200" r="140" fill="none" stroke={accentColor} strokeWidth="1.2" />
        <circle cx="200" cy="200" r="90" fill="none" stroke={accentColor} strokeWidth="0.7" />
      </svg>

      {/* Accent bar */}
      <div style={{ width: "100%", height: 8, flexShrink: 0, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44 50%, transparent)` }} />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 120px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 64 }}>
          <MonogramLogo name={productName} accentColor={accentColor} size={96} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.25em", color: accentColor, opacity: 0.7, textTransform: "uppercase" }}>Market Disruptor</p>
            <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.25em", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginTop: 4 }}>Investor Pitch Deck</p>
          </div>
        </div>

        <h1 style={{ fontSize: 72, fontWeight: 800, color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: "80%" }}>{productName}</h1>

        {subtitle && (
          <p style={{ fontSize: 36, color: "hsl(var(--muted-foreground))", maxWidth: "75%", lineHeight: 1.3, marginTop: 24, fontWeight: 500 }}>{subtitle}</p>
        )}

        <div style={{ width: 80, height: 3, background: accentColor, opacity: 0.3, marginTop: 40 }} />

        <div style={{ marginTop: "auto" }}>
          <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))", fontWeight: 500 }}>{today}</p>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginTop: 8 }}>Confidential · {totalSlides} Slides</p>
        </div>
      </div>

      {/* Corner accent */}
      <div style={{ position: "absolute", bottom: 40, right: 40, width: 40, height: 40, borderRight: `2px solid ${accentColor}`, borderBottom: `2px solid ${accentColor}`, opacity: 0.18, pointerEvents: "none" }} />
    </div>
  );
}

// ── Layout Templates ──────────────────────────────────────────
export function SplitLayout({ left, right, ratio = "1:1" }: { left: React.ReactNode; right: React.ReactNode; ratio?: string }) {
  const [l, r] = ratio.split(":").map(Number);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `${l}fr ${r}fr`, gap: 40, flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>{left}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>{right}</div>
    </div>
  );
}

export function KeyMetricPanel({ value, label, sublabel, accentColor = "#4b68f5" }: { value: string; label: string; sublabel?: string; accentColor?: string }) {
  return (
    <div style={{ padding: "32px 40px", borderRadius: 12, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `5px solid ${accentColor}`, textAlign: "center" }}>
      <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 56, fontWeight: 800, color: accentColor, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</p>
      {sublabel && <p style={{ fontSize: 18, color: "hsl(var(--muted-foreground))", marginTop: 8 }}>{sublabel}</p>}
    </div>
  );
}

export function EmphasisBox({ children, accentColor = "#4b68f5", label }: { children: React.ReactNode; accentColor?: string; label?: string }) {
  return (
    <div style={{ padding: "28px 36px", borderRadius: 12, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `4px solid ${accentColor}`, position: "relative" }}>
      {label && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentColor, marginBottom: 12 }}>{label}</p>}
      {children}
    </div>
  );
}

// ── Content Components (1920×1080 scale) ──────────────────────

export function SlideStatCard({ label, value, accentColor, sublabel }: { label: string; value: string; accentColor?: string; sublabel?: string }) {
  return (
    <div style={{ padding: "24px 28px", borderRadius: 10, background: "hsl(var(--muted))", borderTop: "1px solid hsl(var(--border))", borderRight: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))", borderLeft: accentColor ? `4px solid ${accentColor}` : "1px solid hsl(var(--border))", position: "relative", overflow: "hidden" }}>
      <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>{value}</p>
      {sublabel && <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>{sublabel}</p>}
    </div>
  );
}

export function SlideBullet({ children, index, accentColor }: { icon?: React.ElementType; iconColor?: string; children: React.ReactNode; index?: number; accentColor?: string }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {typeof index === "number" ? (
        <span style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0, marginTop: 2, background: accentColor || "hsl(var(--foreground))", color: "hsl(var(--background))", opacity: 0.85 }}>{index + 1}</span>
      ) : (
        <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 700, flexShrink: 0, marginTop: 2, fontSize: 22 }}>—</span>
      )}
      <p style={{ fontSize: 24, color: "hsl(var(--foreground))", opacity: 0.85, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

export function SlideQuoteBlock({ quote, accentColor = "#4b68f5", label }: { quote: string; accentColor?: string; label?: string }) {
  return (
    <div style={{ position: "relative", padding: "32px 40px", borderRadius: 12, background: "hsl(var(--muted))", borderTop: "1px solid hsl(var(--border))", borderRight: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))", borderLeft: `4px solid ${accentColor}` }}>
      <span style={{ position: "absolute", top: -8, left: 16, fontSize: 72, color: accentColor, opacity: 0.06, lineHeight: 1, fontFamily: "serif", pointerEvents: "none", userSelect: "none" }}>"</span>
      {label && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 16 }}>{label}</p>}
      <p style={{ fontSize: 26, color: "hsl(var(--foreground))", opacity: 0.85, lineHeight: 1.55, position: "relative", zIndex: 10 }}>{quote}</p>
    </div>
  );
}

export function MarketSizeVisual({ tam, sam, som, accentColor = "#4b68f5" }: { tam: string; sam: string; som: string; accentColor?: string }) {
  const extract = (s: string) => {
    const m = s.match(/\$[\d.,]+\s*[BMKT]?/i);
    return m ? m[0] : s.split(" ")[0];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>Addressable Market</p>
      <svg width="380" height="380" viewBox="0 0 380 380">
        <circle cx="190" cy="190" r="180" fill={accentColor} opacity="0.07" stroke={accentColor} strokeWidth="2.5" strokeOpacity="0.25" />
        <circle cx="190" cy="190" r="125" fill={accentColor} opacity="0.12" stroke={accentColor} strokeWidth="2.5" strokeOpacity="0.35" />
        <circle cx="190" cy="190" r="65" fill={accentColor} opacity="0.22" stroke={accentColor} strokeWidth="3" strokeOpacity="0.5" />
        <text x="190" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill={accentColor} opacity="0.9">TAM</text>
        <text x="190" y="52" textAnchor="middle" fontSize="20" fontWeight="800" fill="hsl(var(--foreground))">{extract(tam)}</text>
        <text x="190" y="82" textAnchor="middle" fontSize="14" fontWeight="700" fill={accentColor} opacity="0.9">SAM</text>
        <text x="190" y="104" textAnchor="middle" fontSize="20" fontWeight="800" fill="hsl(var(--foreground))">{extract(sam)}</text>
        <text x="190" y="178" textAnchor="middle" fontSize="14" fontWeight="700" fill={accentColor} opacity="0.9">SOM</text>
        <text x="190" y="202" textAnchor="middle" fontSize="22" fontWeight="800" fill="hsl(var(--foreground))">{extract(som)}</text>
      </svg>
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { label: "TAM", opacity: 0.2, val: extract(tam) },
          { label: "SAM", opacity: 0.4, val: extract(sam) },
          { label: "SOM", opacity: 0.7, val: extract(som) },
        ].map(({ label, opacity, val }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: accentColor, opacity }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RiskSeverityBar({ severity }: { severity: "high" | "medium" | "low" }) {
  const map = {
    high: { fill: "hsl(0 72% 51%)", width: "100%" },
    medium: { fill: "hsl(38 92% 50%)", width: "60%" },
    low: { fill: "hsl(142 71% 45%)", width: "30%" },
  };
  const c = map[severity];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 120 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "hsl(var(--muted))" }}>
        <div style={{ height: "100%", borderRadius: 3, width: c.width, background: c.fill, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c.fill }}>{severity}</span>
    </div>
  );
}

export function ScenarioBarChart({ scenarios, accentColor = "#4b68f5" }: { scenarios: { label: string; value: string }[]; accentColor?: string }) {
  const widths = [40, 65, 100];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>Revenue Scenarios</p>
      {scenarios.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--muted-foreground))", width: 120, textAlign: "right", flexShrink: 0 }}>{s.label}</span>
          <div style={{ flex: 1, height: 40, borderRadius: 6, overflow: "hidden", background: "hsl(var(--muted))" }}>
            <div style={{ height: "100%", borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 16, width: `${widths[i] || 50}%`, background: accentColor, opacity: 0.12 + (i * 0.14) }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))" }}>{s.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SlideTimeline({ steps, accentColor = "#4b68f5" }: { steps: { label: string; content: string }[]; accentColor?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, flexShrink: 0, background: accentColor, color: "white", opacity: 0.85 }}>{i + 1}</div>
            {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: accentColor, opacity: 0.15 }} />}
          </div>
          <div style={{ paddingBottom: 24, flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>{step.label}</p>
            <p style={{ fontSize: 22, color: "hsl(var(--foreground))", opacity: 0.85, lineHeight: 1.5 }}>{step.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricBar({ metric, target, why, accentColor = "#4b68f5" }: { metric: string; target: string; why?: string; accentColor?: string }) {
  const hashW = ((metric.length * 7 + target.length * 13) % 55) + 35;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "hsl(var(--foreground))" }}>{metric}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: accentColor }}>{target}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "hsl(var(--border))" }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${hashW}%`, background: accentColor, opacity: 0.4 }} />
      </div>
      {why && <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))" }}>{why}</p>}
    </div>
  );
}

export function FunnelVisual({ stages, accentColor = "#4b68f5" }: { stages: { label: string; value?: string }[]; accentColor?: string }) {
  const count = stages.length;
  const barH = 44;
  const gap = 8;
  const totalH = count * (barH + gap);
  const maxW = 420;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 16 }}>Conversion Funnel</p>
      <svg width={maxW + 80} height={totalH + 10} viewBox={`0 0 ${maxW + 80} ${totalH + 10}`}>
        {stages.map((stage, i) => {
          const w = maxW - (i * (maxW * 0.15));
          const x = (maxW + 80 - w) / 2;
          const y = i * (barH + gap) + 5;
          const opacity = 0.15 + (i * 0.14);
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barH} rx={6} fill={accentColor} opacity={opacity} stroke={accentColor} strokeWidth="2" strokeOpacity="0.3" />
              <text x={(maxW + 80) / 2} y={y + barH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="700" fill="hsl(var(--foreground))">{stage.label}</text>
              {stage.value && <text x={(maxW + 80) / 2} y={y + barH / 2 + 16} textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))">{stage.value}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutChart({ label, segments, accentColor = "#4b68f5", size = 160 }: { label?: string; segments: { label: string; pct: number }[]; accentColor?: string; size?: number }) {
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -90;

  const arcs = segments.map((seg) => {
    const startAngle = cumAngle;
    cumAngle += (seg.pct / 100) * 360;
    const endAngle = cumAngle;
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return { ...seg, d: `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}` };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {label && <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))" }}>{label}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke={accentColor} strokeWidth={20} strokeLinecap="round" opacity={0.2 + i * 0.15} />
        ))}
        <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.slice(0, 4).map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: accentColor, opacity: 0.25 + i * 0.15 }} />
            <span style={{ fontSize: 14, color: "hsl(var(--foreground))" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
