/**
 * CompetitiveLandscape
 *
 * Full competitive intelligence view:
 * - 2×2 Positioning Map (SVG)
 * - Competitor Profile Cards
 * - Strategic Gap Analysis
 * - Competitive Advantages
 * - Market Dynamics Summary
 */

import { memo, useMemo } from "react";
import {
  Crosshair, TrendingUp, AlertTriangle, Shield, Target, Zap,
  Globe, Users, Loader2, Search, MapPin, ArrowUpRight,
} from "lucide-react";
import type {
  CompetitiveIntelligence,
  CompetitorProfile,
  PositioningMap,
  StrategicGap,
  CompetitiveAdvantage,
  MarketDynamics,
} from "@/lib/competitiveIntelligence";

interface CompetitiveLandscapeProps {
  data: CompetitiveIntelligence | null;
  isLoading: boolean;
  error: string | null;
  hasCompetitors: boolean;
  competitorNames: string[];
  onResearch: () => void;
}

/* ── Positioning Map (SVG 2×2) ── */
function PositioningMapView({ map }: { map: PositioningMap }) {
  const pad = 40;
  const w = 380;
  const h = 300;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const toX = (v: number) => pad + ((v - 1) / 9) * innerW;
  const toY = (v: number) => pad + ((10 - v) / 9) * innerH;

  const colors = [
    "hsl(var(--destructive))",
    "hsl(var(--warning))",
    "hsl(var(--primary))",
    "hsl(142 70% 40%)",
    "hsl(280 70% 50%)",
    "hsl(200 70% 50%)",
  ];

  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        Competitive Positioning Map
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[420px] mx-auto">
        {/* Grid lines */}
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="hsl(var(--border))" strokeWidth={1} />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="hsl(var(--border))" strokeWidth={1} />
        {/* Midlines */}
        <line x1={w / 2} y1={pad} x2={w / 2} y2={h - pad} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.5} />
        <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.5} />

        {/* Axis labels */}
        <text x={w / 2} y={h - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={9} fontWeight={600}>
          {map.xAxis.label}
        </text>
        <text x={8} y={h / 2} textAnchor="middle" className="fill-muted-foreground" fontSize={9} fontWeight={600}
          transform={`rotate(-90, 8, ${h / 2})`}>
          {map.yAxis.label}
        </text>

        {/* Competitor dots */}
        {map.competitorPositions.map((cp, i) => (
          <g key={cp.name}>
            <circle cx={toX(cp.x)} cy={toY(cp.y)} r={8} fill={colors[i % colors.length]} opacity={0.2} />
            <circle cx={toX(cp.x)} cy={toY(cp.y)} r={4} fill={colors[i % colors.length]} />
            <text x={toX(cp.x) + 8} y={toY(cp.y) + 3} fontSize={8} fontWeight={600} className="fill-foreground">
              {cp.name.length > 18 ? cp.name.slice(0, 16) + "…" : cp.name}
            </text>
          </g>
        ))}

        {/* Target business (star) */}
        {map.targetPosition && (
          <g>
            <circle cx={toX(map.targetPosition.x)} cy={toY(map.targetPosition.y)} r={12} fill="hsl(var(--primary))" opacity={0.15} />
            <circle cx={toX(map.targetPosition.x)} cy={toY(map.targetPosition.y)} r={6} fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth={1.5} />
            <text x={toX(map.targetPosition.x) + 10} y={toY(map.targetPosition.y) + 3} fontSize={9} fontWeight={700} className="fill-primary">
              {map.targetPosition.label}
            </text>
          </g>
        )}
      </svg>
      <div className="flex items-center gap-4 justify-center text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Target
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: colors[0] }} /> Competitors
        </span>
      </div>
    </div>
  );
}

/* ── Competitor Profile Card ── */
function ProfileCard({ profile, index }: { profile: CompetitorProfile; index: number }) {
  const threatColor =
    profile.threatLevel === "direct" ? "hsl(var(--destructive))" :
    profile.threatLevel === "indirect" ? "hsl(var(--warning))" :
    "hsl(var(--muted-foreground))";

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{profile.name}</span>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
              style={{ color: threatColor, background: `${threatColor}15`, border: `1px solid ${threatColor}30` }}
            >
              {profile.threatLevel}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{profile.description}</p>
        </div>
      </div>

      {/* Quick facts */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
        {profile.url && (
          <a href={profile.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
            <Globe size={9} /> Website <ArrowUpRight size={8} />
          </a>
        )}
        {profile.geographicFocus && (
          <span className="flex items-center gap-0.5"><MapPin size={9} /> {profile.geographicFocus}</span>
        )}
        {profile.employeeRange && (
          <span className="flex items-center gap-0.5"><Users size={9} /> {profile.employeeRange}</span>
        )}
        {profile.estimatedRevenue && (
          <span className="font-semibold">{profile.estimatedRevenue}</span>
        )}
      </div>

      {/* Service overlap */}
      {profile.serviceOverlap.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-semibold text-muted-foreground">Overlap:</span>
          {profile.serviceOverlap.map((s, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
          ))}
        </div>
      )}

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "hsl(var(--success))" }}>
            <Shield size={9} /> Strengths
          </p>
          <ul className="space-y-0.5">
            {profile.strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="text-[10px] text-foreground flex items-start gap-1">
                <span className="mt-0.5" style={{ color: "hsl(var(--success))" }}>•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "hsl(var(--warning))" }}>
            <AlertTriangle size={9} /> Weaknesses
          </p>
          <ul className="space-y-0.5">
            {profile.weaknesses.slice(0, 3).map((w, i) => (
              <li key={i} className="text-[10px] text-foreground flex items-start gap-1">
                <span className="mt-0.5" style={{ color: "hsl(var(--warning))" }}>•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Strategic Gap Card ── */
function GapCard({ gap }: { gap: StrategicGap }) {
  const diffColor =
    gap.difficulty === "low" ? "hsl(var(--success))" :
    gap.difficulty === "medium" ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  return (
    <div className="p-3 rounded-lg" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-foreground">{gap.gap}</p>
        <span className="text-[9px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded" style={{ color: diffColor, background: `${diffColor}12` }}>
          {gap.difficulty}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{gap.opportunity}</p>
      {gap.potentialImpact && (
        <p className="text-[10px] font-semibold text-primary mt-1">Impact: {gap.potentialImpact}</p>
      )}
    </div>
  );
}

/* ── Main Component ── */
export const CompetitiveLandscape = memo(function CompetitiveLandscape({
  data,
  isLoading,
  error,
  hasCompetitors,
  competitorNames,
  onResearch,
}: CompetitiveLandscapeProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Competitive Landscape
          </p>
        </div>
        <div className="flex items-center gap-2 p-6 rounded-xl justify-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <Loader2 size={14} className="animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground">
            Researching {competitorNames.length} competitors via web scraping…
          </span>
        </div>
      </div>
    );
  }

  // No competitors detected
  if (!hasCompetitors) {
    return null; // Don't show section if no competitors in the data
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Competitive Landscape
          </p>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-xs text-muted-foreground mb-2">Competitor research failed: {error}</p>
          <button onClick={onResearch} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
            <Search size={10} /> Retry Research
          </button>
        </div>
      </div>
    );
  }

  // Not yet researched — show trigger
  if (!data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Competitive Landscape
          </p>
        </div>
        <button
          onClick={onResearch}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))", border: "1px solid hsl(var(--border))" }}
        >
          <Search size={12} />
          Research {competitorNames.length} Named Competitors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Competitive Landscape ({data.competitorProfiles.length} profiled)
          </p>
        </div>
        <button onClick={onResearch} className="text-[10px] text-primary hover:underline flex items-center gap-1">
          <Search size={9} /> Re-research
        </button>
      </div>

      {/* Market Dynamics Summary */}
      {data.marketDynamics && (
        <div
          className="rounded-xl p-3 flex items-center gap-4 flex-wrap"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex-1 min-w-[120px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Market Trend</p>
            <p className="text-[11px] font-semibold text-foreground capitalize">{data.marketDynamics.consolidationTrend}</p>
          </div>
          <div className="flex-1 min-w-[120px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Price Competition</p>
            <p className="text-[11px] font-semibold text-foreground capitalize">{data.marketDynamics.priceCompetition}</p>
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Differentiation Basis</p>
            <p className="text-[10px] text-foreground">{data.marketDynamics.differentiationBasis}</p>
          </div>
        </div>
      )}

      {/* Positioning Map */}
      {data.positioningMap && <PositioningMapView map={data.positioningMap} />}

      {/* Competitor Profiles */}
      {data.competitorProfiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Competitor Profiles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.competitorProfiles.map((p, i) => (
              <ProfileCard key={p.name} profile={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Strategic Gaps */}
      {data.strategicGaps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target size={11} className="text-primary" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Strategic Gaps — Where Competitors Don't Play
            </p>
          </div>
          <div className="space-y-2">
            {data.strategicGaps.map((g, i) => (
              <GapCard key={i} gap={g} />
            ))}
          </div>
        </div>
      )}

      {/* Competitive Advantages */}
      {data.competitiveAdvantages.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            <Zap size={11} className="text-success" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Existing Competitive Advantages
            </p>
          </div>
          <div className="space-y-2">
            {data.competitiveAdvantages.map((a, i) => {
              const sustColor =
                a.sustainability === "high" ? "hsl(var(--success))" :
                a.sustainability === "medium" ? "hsl(var(--warning))" :
                "hsl(var(--destructive))";
              return (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground">{a.advantage}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.exploitStrategy}</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded" style={{ color: sustColor, background: `${sustColor}12` }}>
                    {a.sustainability} durability
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
