import React, { useRef, useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   PRESENTATION ENGINE — All components render at 1920×1080
   and scale to fit any container via ScaledSlide.
   
   Design system:
   - 72px side margins, 36px top/bottom content padding
   - Consistent 12-column conceptual grid
   - White background with restrained accent usage
   - Top-aligned content (no vertical centering)
   - Every slide has one clear visual focal point
   - Premium glassmorphism + gradient depth effects
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
    <div ref={ref} style={{ width: "100%", position: "relative", aspectRatio: "16/9", overflow: "hidden", borderRadius: 12, border: "1.5px solid hsl(var(--border))", boxShadow: "0 2px 16px hsl(var(--foreground) / 0.06)" }}>
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

// ── Subtle Background ─────────────────────────────────────────
function SubtleGrid({ accentColor }: { accentColor: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.02 }}>
      <defs>
        <pattern id="slide-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <line x1="80" y1="0" x2="80" y2="80" stroke={accentColor} strokeWidth="0.5" />
          <line x1="0" y1="80" x2="80" y2="80" stroke={accentColor} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#slide-grid)" />
    </svg>
  );
}

// ── Accent Glow — radial gradient wash (amplified) ────────────
function AccentGlow({ accentColor }: { accentColor: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      background: `radial-gradient(ellipse at 85% 85%, ${accentColor}14 0%, transparent 55%), radial-gradient(ellipse at 10% 10%, ${accentColor}0a 0%, transparent 45%), radial-gradient(ellipse at 50% 0%, ${accentColor}06 0%, transparent 50%)`,
    }} />
  );
}

// ── Noise Texture Overlay ─────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      opacity: 0.03,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: "128px 128px",
    }} />
  );
}

// ── Decorative Geometric Elements per slide ───────────────────
function SlideDecorativeElements({ slideNumber, accentColor }: { slideNumber: number; accentColor: string }) {
  const variant = slideNumber % 3;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Corner accent — bottom right quarter circle */}
      <div style={{
        position: "absolute", right: -60, bottom: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle at center, ${accentColor}06 0%, transparent 70%)`,
      }} />
      {/* Variant-specific elements */}
      {variant === 0 && (
        <>
          <div style={{ position: "absolute", left: 60, bottom: 100, width: 120, height: 120, borderRadius: "50%", border: `1.5px solid ${accentColor}`, opacity: 0.04 }} />
          <div style={{ position: "absolute", right: 140, top: 80, width: 2, height: 80, background: `linear-gradient(180deg, ${accentColor}08, transparent)` }} />
        </>
      )}
      {variant === 1 && (
        <>
          <div style={{ position: "absolute", right: 200, bottom: 60, width: 80, height: 80, borderRadius: "50%", background: accentColor, opacity: 0.025 }} />
          <div style={{ position: "absolute", left: 100, top: 160, width: 160, height: 1.5, background: `linear-gradient(90deg, ${accentColor}0a, transparent)` }} />
        </>
      )}
      {variant === 2 && (
        <>
          <div style={{ position: "absolute", left: 40, bottom: 140, width: 60, height: 60, borderRadius: "50%", border: `1px solid ${accentColor}`, opacity: 0.05 }} />
          <div style={{ position: "absolute", right: 80, top: 200, width: 100, height: 100, borderRadius: "50%", background: accentColor, opacity: 0.02 }} />
        </>
      )}
    </div>
  );
}

// ── Monogram ──────────────────────────────────────────────────
function MonogramLogo({ name, accentColor, size = 80 }: { name: string; accentColor: string; size?: number }) {
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="mono-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Animated concentric rings */}
      <circle cx={r} cy={r} r={r} fill="url(#mono-glow)" />
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.12" strokeDasharray="4 3" />
      <circle cx={r} cy={r} r={r - 2} fill="none" stroke={accentColor} strokeWidth="2" opacity="0.25" />
      <circle cx={r} cy={r} r={r - 6} fill="none" stroke={accentColor} strokeWidth="1" opacity="0.15" strokeDasharray="6 4" />
      <circle cx={r} cy={r} r={r - 10} fill={accentColor} opacity="0.1" />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif" fontWeight="800"
        fontSize={size * 0.36} fill={accentColor} opacity="0.75">
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
    <div style={{
      width: 1920, height: 1080,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
      background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)",
      borderRadius: 12,
    }}>
      <SubtleGrid accentColor={accentColor} />
      <AccentGlow accentColor={accentColor} />
      <NoiseOverlay />
      <SlideDecorativeElements slideNumber={slideNumber} accentColor={accentColor} />

      {/* Accent bar — vivid gradient top line (6px) */}
      <div style={{
        width: "100%", height: 6, flexShrink: 0,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}aa, ${accentColor}dd, ${accentColor})`,
        boxShadow: `0 2px 12px -2px ${accentColor}30`,
      }} />

      {/* Right vertical accent stripe */}
      <div style={{
        position: "absolute", right: 0, top: 6, width: 3, height: 100,
        background: `linear-gradient(180deg, ${accentColor}20, transparent)`,
        borderRadius: "0 0 2px 2px",
      }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        padding: "32px 72px 24px", flexShrink: 0,
        borderBottom: "1px solid #e8e8ec",
        position: "relative", zIndex: 10,
      }}>
        {/* Gradient fade under header */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: -20, height: 20,
          background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{
            width: 4, height: 52, borderRadius: 2, flexShrink: 0, marginTop: 4,
            background: `linear-gradient(180deg, ${accentColor}, ${accentColor}44)`,
          }} />
          <div>
            {categoryLabel && (
              <span style={{
                display: "inline-block",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.2em",
                color: accentColor, marginBottom: 8,
                textTransform: "uppercase",
                padding: "3px 12px", borderRadius: 20,
                background: `${accentColor}0c`,
                border: `1px solid ${accentColor}18`,
              }}>{categoryLabel}</span>
            )}
            <h2 style={{
              fontSize: 42, fontWeight: 800,
              color: "#0f0f12",
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.1, letterSpacing: "-0.01em",
            }}>{title}</h2>
            {subtitle && (
              <p style={{ fontSize: 20, color: "#71717a", marginTop: 6, lineHeight: 1.4 }}>{subtitle}</p>
            )}
          </div>
        </div>
        <span style={{
          fontSize: 16, fontWeight: 600, color: "#a1a1aa",
          flexShrink: 0, fontVariantNumeric: "tabular-nums",
        }}>
          {pad(slideNumber)} / {pad(totalSlides)}
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, padding: "32px 72px",
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 72px", flexShrink: 0,
        borderTop: "1px solid #e8e8ec",
        position: "relative", zIndex: 10,
        background: "linear-gradient(135deg, #fafafa, #f8f9fc)",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "#a1a1aa", textTransform: "uppercase" }}>Market Disruptor</span>
        {productName && (
          <span style={{ fontSize: 12, fontWeight: 500, color: "#a1a1aa", maxWidth: "40%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{productName}</span>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "#a1a1aa", textTransform: "uppercase" }}>Confidential</span>
      </div>
    </div>
  );
}

// ── Cover Slide (1920×1080) ───────────────────────────────────
export function PitchCoverSlide({ productName, subtitle, accentColor = "#4b68f5", totalSlides, coverImages, userName }: {
  productName: string; subtitle?: string; accentColor?: string; totalSlides: number;
  coverImages?: { url: string; ideaName: string }[];
  userName?: string;
}) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const hasImages = coverImages && coverImages.length > 0;

  return (
    <div style={{
      width: 1920, height: 1080,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
      background: "linear-gradient(180deg, #ffffff 0%, #f8f9fc 100%)",
      borderRadius: 12,
    }}>
      <SubtleGrid accentColor={accentColor} />
      {/* Amplified accent glow for cover */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 70% 60%, ${accentColor}18 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, ${accentColor}0c 0%, transparent 45%)`,
      }} />
      <NoiseOverlay />

      {/* Multiple geometric accent shapes */}
      <div style={{
        position: "absolute", right: -120, top: -120, width: 500, height: 500,
        borderRadius: "50%", border: `2px solid ${accentColor}`,
        opacity: 0.08, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: -60, top: -60, width: 360, height: 360,
        borderRadius: "50%", background: accentColor,
        opacity: 0.04, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: 40, top: 40, width: 200, height: 200,
        borderRadius: "50%", border: `1.5px dashed ${accentColor}`,
        opacity: 0.06, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", left: -80, bottom: -80, width: 300, height: 300,
        borderRadius: "50%", background: accentColor,
        opacity: 0.025, pointerEvents: "none",
      }} />

      {/* Accent bar — gradient (6px) */}
      <div style={{
        width: "100%", height: 6, flexShrink: 0,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, ${accentColor}cc, ${accentColor})`,
        boxShadow: `0 2px 12px -2px ${accentColor}30`,
      }} />

      {/* Left accent stripe */}
      <div style={{
        position: "absolute", left: 72, top: 140, width: 5, height: 200, borderRadius: 3,
        background: `linear-gradient(180deg, ${accentColor}, ${accentColor}22)`,
        opacity: 0.3,
      }} />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", padding: "100px 120px 60px", position: "relative", zIndex: 10, gap: 60 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
            <MonogramLogo name={productName} accentColor={accentColor} size={96} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.25em", color: accentColor, textTransform: "uppercase" }}>Market Disruptor</p>
              <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.2em", color: "#a1a1aa", textTransform: "uppercase", marginTop: 4 }}>Investor Pitch Deck</p>
            </div>
          </div>

          <h1 style={{
            fontSize: 72, fontWeight: 800,
            color: "#0f0f12",
            fontFamily: "'Space Grotesk', sans-serif",
            lineHeight: 1.05, letterSpacing: "-0.02em",
            maxWidth: hasImages ? "100%" : "75%",
            textShadow: `0 0 60px ${accentColor}10`,
          }}>{productName}</h1>

          {subtitle && (
            <p style={{ fontSize: 30, color: "#71717a", maxWidth: hasImages ? "100%" : "70%", lineHeight: 1.35, marginTop: 20, fontWeight: 500 }}>{subtitle}</p>
          )}

          {/* Gradient divider line */}
          <div style={{
            width: 160, height: 3, marginTop: 28,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44, transparent)`,
            borderRadius: 2,
          }} />

          {userName && (
            <p style={{
              fontSize: 56, fontWeight: 800,
              color: "#0f0f12",
              fontFamily: "'Space Grotesk', sans-serif",
              marginTop: 24,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}>
              {userName}
            </p>
          )}

          <div style={{ marginTop: "auto" }}>
            <p style={{ fontSize: 15, color: "#71717a", fontWeight: 500 }}>{today}</p>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", color: "#a1a1aa", textTransform: "uppercase", marginTop: 6 }}>Confidential · {totalSlides} Slides</p>
          </div>
        </div>

        {hasImages && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
            width: 480, flexShrink: 0, justifyContent: "center",
          }}>
            {coverImages!.map((img, i) => (
              <div key={i} style={{
                borderRadius: 12, overflow: "hidden",
                border: "1px solid #e8e8ec",
                boxShadow: `0 8px 32px -8px rgba(0,0,0,0.12), 0 0 0 1px ${accentColor}10`,
              }}>
                <img src={img.url} alt={img.ideaName} style={{
                  width: "100%",
                  height: coverImages!.length > 1 ? 260 : 400,
                  objectFit: "contain",
                  background: "#f4f4f5",
                }} onError={(e) => { const parent = (e.target as HTMLImageElement).closest('div'); if (parent) (parent as HTMLElement).style.display = 'none'; }} />
                <div style={{ padding: "10px 16px", background: "linear-gradient(135deg, #fafafa, #f8f9fc)", borderTop: "1px solid #e8e8ec" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#a1a1aa", textTransform: "uppercase" }}>Concept Design</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#0f0f12", marginTop: 2 }}>{img.ideaName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ height: 44, background: "linear-gradient(135deg, #fafafa, #f8f9fc)", borderTop: "1px solid #e8e8ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: "#a1a1aa", textTransform: "uppercase" }}>Market Disruptor · Confidential</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export function SplitLayout({ left, right, ratio = "1:1" }: { left: React.ReactNode; right: React.ReactNode; ratio?: string }) {
  const [l, r] = ratio.split(":").map(Number);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `${l}fr ${r}fr`, gap: 32, flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column" }}>{left}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>{right}</div>
    </div>
  );
}

export function ThreeColumnGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STRUCTURED CONTENT BLOCKS
// ═══════════════════════════════════════════════════════════════

// ── Insight Card: bordered card with gradient accent top ──────
export function InsightCard({ title, body, accentColor = "#4b68f5", icon }: {
  title: string; body: string; accentColor?: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: "28px 32px", borderRadius: 10,
      background: `linear-gradient(135deg, #fafafa, #f8f9fc)`,
      border: "1px solid #e8e8ec",
      borderTop: "none",
      display: "flex", flexDirection: "column", gap: 12,
      position: "relative", overflow: "hidden",
    }}>
      {/* Gradient top border (4px) */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66, transparent)`,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && <span style={{ color: accentColor, flexShrink: 0 }}>{icon}</span>}
        <p style={{ fontSize: 20, fontWeight: 700, color: "#0f0f12", lineHeight: 1.3 }}>{title}</p>
      </div>
      <p style={{ fontSize: 20, color: "#52525b", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

// ── Key Metric Panel: big number with prominent glow ring ────
export function KeyMetricPanel({ value, label, sublabel, accentColor = "#4b68f5" }: {
  value: string; label: string; sublabel?: string; accentColor?: string;
}) {
  return (
    <div style={{
      padding: "32px 40px", borderRadius: 10,
      background: `linear-gradient(135deg, #fafafa, #f8f9fc)`,
      border: "1px solid #e8e8ec",
      borderLeft: `5px solid ${accentColor}`,
      display: "flex", alignItems: "center", gap: 40,
      position: "relative", overflow: "hidden",
    }}>
      {/* Prominent glow behind metric */}
      <div style={{
        position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
        width: 160, height: 160, borderRadius: "50%",
        background: `radial-gradient(circle, ${accentColor}1a 0%, ${accentColor}08 40%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      {/* Pulsing accent dot */}
      <div style={{
        position: "absolute", left: 24, top: 24,
        width: 8, height: 8, borderRadius: "50%",
        background: accentColor, opacity: 0.4,
        boxShadow: `0 0 8px ${accentColor}40`,
      }} />
      <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 56, fontWeight: 800, color: accentColor, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</p>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#71717a" }}>{label}</p>
        {sublabel && <p style={{ fontSize: 18, color: "#52525b", marginTop: 4, lineHeight: 1.4 }}>{sublabel}</p>}
      </div>
    </div>
  );
}

// ── Comparison Layout ────────────────────────────────────────
export function ComparisonLayout({ leftTitle, leftItems, rightTitle, rightItems, accentColor = "#4b68f5" }: {
  leftTitle: string; leftItems: string[]; rightTitle: string; rightItems: string[];
  accentColor?: string;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid #e8e8ec" }}>
      <div style={{ padding: "28px 32px", background: "#fafafa" }}>
        <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 16 }}>{leftTitle}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(leftItems || []).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4d4d8", flexShrink: 0, marginTop: 8 }} />
              <p style={{ fontSize: 19, color: "#52525b", lineHeight: 1.45 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "28px 32px", background: "#ffffff", borderLeft: `3px solid ${accentColor}` }}>
        <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentColor, marginBottom: 16 }}>{rightTitle}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(rightItems || []).map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, opacity: 0.5, flexShrink: 0, marginTop: 7 }} />
              <p style={{ fontSize: 19, color: "#0f0f12", lineHeight: 1.45, fontWeight: 500 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Takeaway Callout: frosted-glass with pattern overlay ──────
export function TakeawayCallout({ text, accentColor = "#4b68f5", label = "Key Takeaway" }: {
  text: string; accentColor?: string; label?: string;
}) {
  return (
    <div style={{
      padding: "20px 32px", borderRadius: 10,
      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
      marginTop: "auto",
      display: "flex", alignItems: "center", gap: 20,
      boxShadow: `0 12px 40px -8px ${accentColor}44`,
      backdropFilter: "blur(8px)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle pattern overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.06,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 1px, transparent 1px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />
      <div style={{ width: 4, height: 40, borderRadius: 2, background: "#ffffff", opacity: 0.4, flexShrink: 0, position: "relative", zIndex: 1 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ffffff", opacity: 0.7, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 20, color: "#ffffff", lineHeight: 1.45, fontWeight: 500 }}>{text}</p>
      </div>
    </div>
  );
}

// ── Emphasis Box ──────────────────────────────────────────────
export function EmphasisBox({ children, accentColor = "#4b68f5", label }: {
  children: React.ReactNode; accentColor?: string; label?: string;
}) {
  return (
    <div style={{
      padding: "24px 32px", borderRadius: 10,
      background: `linear-gradient(135deg, #fafafa, #f8f9fc)`, border: "1px solid #e8e8ec",
      borderLeft: `4px solid ${accentColor}`,
    }}>
      {label && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accentColor, marginBottom: 12 }}>{label}</p>}
      {children}
    </div>
  );
}

// ── Stat Card: elevated with gradient left strip + inner shadow
export function SlideStatCard({ label, value, accentColor, sublabel }: {
  label: string; value: string; accentColor?: string; sublabel?: string;
}) {
  return (
    <div style={{
      padding: "20px 24px", borderRadius: 10,
      background: "#ffffff", border: "1px solid #e8e8ec",
      borderLeft: accentColor ? `4px solid ${accentColor}` : "1px solid #e8e8ec",
      boxShadow: "0 2px 8px -2px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.02)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Gradient strip on left edge */}
      {accentColor && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: `linear-gradient(180deg, ${accentColor}, ${accentColor}66)`,
        }} />
      )}
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 34, fontWeight: 800, color: "#0f0f12", lineHeight: 1.2, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      {sublabel && <p style={{ fontSize: 15, color: "#71717a", marginTop: 4 }}>{sublabel}</p>}
    </div>
  );
}

// ── Numbered Bullet ───────────────────────────────────────────
export function SlideBullet({ children, index, accentColor }: {
  icon?: React.ElementType; iconColor?: string; children: React.ReactNode; index?: number; accentColor?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {typeof index === "number" ? (
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 2,
          background: accentColor || "#0f0f12", color: "#ffffff", opacity: 0.85,
        }}>{index + 1}</span>
      ) : (
        <span style={{ color: "#a1a1aa", fontWeight: 700, flexShrink: 0, marginTop: 2, fontSize: 20 }}>—</span>
      )}
      <p style={{ fontSize: 21, color: "#0f0f12", opacity: 0.85, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

// ── Quote Block: with decorative quote mark ───────────────────
export function SlideQuoteBlock({ quote, accentColor = "#4b68f5", label }: {
  quote: string; accentColor?: string; label?: string;
}) {
  return (
    <div style={{
      padding: "32px 40px", borderRadius: 10,
      background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}04, #fafafa)`,
      border: "1px solid #e8e8ec",
      borderLeft: `5px solid ${accentColor}`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Large decorative quote mark */}
      <span style={{
        position: "absolute", top: -8, left: 16, fontSize: 120,
        fontFamily: "Georgia, serif", color: accentColor, opacity: 0.1,
        lineHeight: 1, pointerEvents: "none",
      }}>"</span>
      {label && <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accentColor, opacity: 0.7, marginBottom: 14, position: "relative", zIndex: 1 }}>{label}</p>}
      <p style={{ fontSize: 26, color: "#0f0f12", opacity: 0.85, lineHeight: 1.55, position: "relative", zIndex: 1 }}>{quote}</p>
    </div>
  );
}

// ── Market Size Visual with gradient fills ────────────────────
export function MarketSizeVisual({ tam, sam, som, accentColor = "#4b68f5" }: {
  tam: string; sam: string; som: string; accentColor?: string;
}) {
  const extract = (s: string) => {
    const m = s.match(/\$[\d.,]+\s*[BMKT]?/i);
    return m ? m[0] : s.split(" ")[0];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa" }}>Addressable Market</p>
      <svg width="340" height="340" viewBox="0 0 340 340">
        <defs>
          <radialGradient id="market-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tam-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </radialGradient>
          <radialGradient id="sam-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
          </radialGradient>
          <radialGradient id="som-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.1" />
          </radialGradient>
        </defs>
        <circle cx="170" cy="170" r="165" fill="url(#market-glow)" />
        {/* TAM */}
        <circle cx="170" cy="170" r="160" fill="url(#tam-fill)" stroke={accentColor} strokeWidth="2" strokeOpacity="0.2" strokeDasharray="8 4" />
        {/* SAM */}
        <circle cx="170" cy="170" r="110" fill="url(#sam-fill)" stroke={accentColor} strokeWidth="2" strokeOpacity="0.3" strokeDasharray="6 3" />
        {/* SOM */}
        <circle cx="170" cy="170" r="55" fill="url(#som-fill)" stroke={accentColor} strokeWidth="2.5" strokeOpacity="0.45" />
        {/* Dashed connector lines between rings */}
        <line x1="170" y1="10" x2="170" y2="60" stroke={accentColor} strokeWidth="1" strokeOpacity="0.15" strokeDasharray="3 3" />
        <line x1="170" y1="280" x2="170" y2="330" stroke={accentColor} strokeWidth="1" strokeOpacity="0.15" strokeDasharray="3 3" />
        {/* Labels */}
        <text x="170" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill={accentColor} opacity="0.9">TAM</text>
        <text x="170" y="48" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f0f12">{extract(tam)}</text>
        <text x="170" y="78" textAnchor="middle" fontSize="12" fontWeight="700" fill={accentColor} opacity="0.9">SAM</text>
        <text x="170" y="98" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f0f12">{extract(sam)}</text>
        <text x="170" y="160" textAnchor="middle" fontSize="12" fontWeight="700" fill={accentColor} opacity="0.9">SOM</text>
        <text x="170" y="182" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f0f12">{extract(som)}</text>
      </svg>
      <div style={{ display: "flex", gap: 28 }}>
        {[
          { label: "TAM", opacity: 0.2, val: extract(tam) },
          { label: "SAM", opacity: 0.4, val: extract(sam) },
          { label: "SOM", opacity: 0.7, val: extract(som) },
        ].map(({ label, opacity, val }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: accentColor, opacity }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#71717a" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f0f12" }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Risk Severity Bar: wider pill with animated fill ──────────
export function RiskSeverityBar({ severity }: { severity: "high" | "medium" | "low" }) {
  const map = {
    high: { fill: "#ef4444", width: "100%", bg: "#fef2f2" },
    medium: { fill: "#f59e0b", width: "60%", bg: "#fffbeb" },
    low: { fill: "#22c55e", width: "30%", bg: "#f0fdf4" },
  };
  const c = map[severity] || map.medium;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 160 }}>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: c.bg, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 5, width: c.width, background: `linear-gradient(90deg, ${c.fill}88, ${c.fill})`,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${c.fill}33`,
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c.fill }}>{severity}</span>
    </div>
  );
}

// ── Scenario Bar Chart ────────────────────────────────────────
export function ScenarioBarChart({ scenarios, accentColor = "#4b68f5" }: {
  scenarios: { label: string; value: string }[]; accentColor?: string;
}) {
  const widths = [35, 60, 100];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 4 }}>Revenue Scenarios</p>
      {(scenarios || []).map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#71717a", width: 110, textAlign: "right", flexShrink: 0 }}>{s.label}</span>
          <div style={{ flex: 1, height: 36, borderRadius: 6, overflow: "hidden", background: "#f4f4f5" }}>
            <div style={{
              height: "100%", borderRadius: 6,
              display: "flex", alignItems: "center", paddingLeft: 14,
              width: `${widths[i] || 50}%`,
              background: `linear-gradient(90deg, ${accentColor}22, ${accentColor}${(30 + i * 20).toString(16)})`,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#0f0f12" }}>{s.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────
export function SlideTimeline({ steps, accentColor = "#4b68f5" }: {
  steps: { label: string; content: string }[]; accentColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {(steps || []).map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              color: "#ffffff",
              boxShadow: `0 2px 8px ${accentColor}33`,
            }}>{i + 1}</div>
            {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: `linear-gradient(180deg, ${accentColor}33, ${accentColor}08)` }} />}
          </div>
          <div style={{ paddingBottom: 20, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 4 }}>{step.label}</p>
            <p style={{ fontSize: 20, color: "#0f0f12", opacity: 0.85, lineHeight: 1.5 }}>{step.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Metric Bar ────────────────────────────────────────────────
export function MetricBar({ metric, target, why, accentColor = "#4b68f5" }: {
  metric: string; target: string; why?: string; accentColor?: string;
}) {
  const hashW = ((metric.length * 7 + target.length * 13) % 55) + 35;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#0f0f12" }}>{metric}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: accentColor }}>{target}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#f4f4f5" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${hashW}%`, background: `linear-gradient(90deg, ${accentColor}55, ${accentColor})`, transition: "width 0.5s" }} />
      </div>
      {why && <p style={{ fontSize: 14, color: "#71717a" }}>{why}</p>}
    </div>
  );
}

// ── Funnel Visual ─────────────────────────────────────────────
export function FunnelVisual({ stages, accentColor = "#4b68f5" }: {
  stages: { label: string; value?: string }[]; accentColor?: string;
}) {
  const count = stages.length;
  const barH = 40;
  const gap = 6;
  const totalH = count * (barH + gap);
  const maxW = 380;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 14 }}>Conversion Funnel</p>
      <svg width={maxW + 60} height={totalH + 10} viewBox={`0 0 ${maxW + 60} ${totalH + 10}`}>
        {(stages || []).map((stage, i) => {
          const w = maxW - (i * (maxW * 0.15));
          const x = (maxW + 60 - w) / 2;
          const y = i * (barH + gap) + 5;
          const opacity = 0.12 + (i * 0.14);
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barH} rx={6} fill={accentColor} opacity={opacity} stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.25" />
              <text x={(maxW + 60) / 2} y={y + barH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="700" fill="#0f0f12">{stage.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────
export function DonutChart({ label, segments, accentColor = "#4b68f5", size = 160 }: {
  label?: string; segments: { label: string; pct: number }[]; accentColor?: string; size?: number;
}) {
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -90;

  const arcs = (segments || []).map((seg) => {
    const startAngle = cumAngle;
    cumAngle += (seg.pct / 100) * 360;
    const endAngle = cumAngle;
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return { ...seg, d: `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}` };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {label && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a1a1aa" }}>{label}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke={accentColor} strokeWidth={18} strokeLinecap="round" opacity={0.18 + i * 0.15} />
        ))}
        <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke="#e8e8ec" strokeWidth="1" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(segments || []).slice(0, 4).map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: accentColor, opacity: 0.22 + i * 0.15 }} />
            <span style={{ fontSize: 13, color: "#0f0f12" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty Section Placeholder ─────────────────────────────────
export function EmptySlideSection({ label }: { label: string }) {
  return (
    <div style={{
      padding: "40px 32px", borderRadius: 10,
      background: "#fafafa", border: "1px dashed #d4d4d8",
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: 120,
    }}>
      <p style={{ fontSize: 18, color: "#a1a1aa", fontWeight: 500 }}>
        {label} — click <strong>Regenerate</strong> to populate
      </p>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
