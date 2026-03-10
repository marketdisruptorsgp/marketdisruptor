/**
 * CompetitiveLandscape — Enhanced with:
 * - Source citations on every claim
 * - User override/correction for competitor profiles
 * - Corroboration score badges
 * - Industry benchmarks (Census/BLS/SBA)
 */

import { memo, useMemo, useState, useCallback } from "react";
import {
  Crosshair, TrendingUp, AlertTriangle, Shield, Target, Zap,
  Globe, Users, Loader2, Search, MapPin, ArrowUpRight, ExternalLink,
  Edit3, Check, X, Database, BarChart3, Building2,
} from "lucide-react";
import type {
  CompetitiveIntelligence,
  CompetitorProfile,
  PositioningMap,
  StrategicGap,
  CompetitiveAdvantage,
  MarketDynamics,
  CitedClaim,
  DataConfidence,
  IndustryBenchmark,
  SourceCitation,
} from "@/lib/competitiveIntelligence";

interface CompetitiveLandscapeProps {
  data: CompetitiveIntelligence | null;
  isLoading: boolean;
  error: string | null;
  hasCompetitors: boolean;
  competitorNames: string[];
  onResearch: () => void;
  benchmarks?: IndustryBenchmark | null;
  benchmarksLoading?: boolean;
  onOverride?: (competitorName: string, field: string, value: any) => void;
}

/* ── Confidence Badge ── */
function ConfidenceBadge({ confidence }: { confidence?: DataConfidence }) {
  if (!confidence) return null;
  const styles: Record<DataConfidence, { color: string; label: string }> = {
    "verified": { color: "hsl(142 70% 35%)", label: "VERIFIED" },
    "scraped": { color: "hsl(217 91% 45%)", label: "SCRAPED" },
    "ai-inferred": { color: "hsl(38 92% 42%)", label: "AI-INFERRED" },
    "user-verified": { color: "hsl(271 70% 45%)", label: "USER EDITED" },
  };
  const s = styles[confidence] || styles["ai-inferred"];
  return (
    <span
      className="inline-flex items-center px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider"
      style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}
    >
      {s.label}
    </span>
  );
}

/* ── Source Citation Link ── */
function CitationLinks({ sources }: { sources?: SourceCitation[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {sources.slice(0, 2).map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={s.snippet || s.title}
          className="text-[8px] text-primary/60 hover:text-primary transition-colors"
        >
          <ExternalLink size={7} />
        </a>
      ))}
      {sources.length > 2 && (
        <span className="text-[7px] text-muted-foreground">+{sources.length - 2}</span>
      )}
    </span>
  );
}

/* ── Corroboration Score ── */
function CorroborationBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "hsl(142 70% 35%)" : pct >= 40 ? "hsl(38 92% 42%)" : "hsl(var(--destructive))";
  return (
    <span
      className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ color, background: `${color}10`, border: `1px solid ${color}20` }}
      title="Cross-source corroboration score"
    >
      {pct}% corroborated
    </span>
  );
}

/* ── Editable Field ── */
function EditableField({
  value,
  citation,
  onSave,
  fieldName,
}: {
  value: string | null;
  citation?: CitedClaim;
  onSave?: (value: string) => void;
  fieldName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  const handleSave = () => {
    onSave?.(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="text-[10px] px-1.5 py-0.5 rounded border bg-background text-foreground w-full"
          style={{ borderColor: "hsl(var(--border))" }}
          autoFocus
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        />
        <button onClick={handleSave} className="text-success"><Check size={10} /></button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground"><X size={10} /></button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 group">
      <span className="text-[10px]">{value || "—"}</span>
      <ConfidenceBadge confidence={citation?.confidence} />
      <CitationLinks sources={citation?.sources} />
      {onSave && (
        <button
          onClick={() => { setDraft(value || ""); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          title={`Edit ${fieldName}`}
        >
          <Edit3 size={8} />
        </button>
      )}
    </span>
  );
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
    "hsl(38 92% 42%)",
    "hsl(var(--primary))",
    "hsl(142 70% 40%)",
    "hsl(280 70% 50%)",
    "hsl(200 70% 50%)",
  ];

  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Competitive Positioning Map</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[420px] mx-auto">
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="hsl(var(--border))" strokeWidth={1} />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="hsl(var(--border))" strokeWidth={1} />
        <line x1={w / 2} y1={pad} x2={w / 2} y2={h - pad} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.5} />
        <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4,4" opacity={0.5} />
        <text x={w / 2} y={h - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={9} fontWeight={600}>{map.xAxis.label}</text>
        <text x={8} y={h / 2} textAnchor="middle" className="fill-muted-foreground" fontSize={9} fontWeight={600} transform={`rotate(-90, 8, ${h / 2})`}>{map.yAxis.label}</text>
        {map.competitorPositions.map((cp, i) => (
          <g key={cp.name}>
            <circle cx={toX(cp.x)} cy={toY(cp.y)} r={8} fill={colors[i % colors.length]} opacity={0.2} />
            <circle cx={toX(cp.x)} cy={toY(cp.y)} r={4} fill={colors[i % colors.length]} />
            <text x={toX(cp.x) + 8} y={toY(cp.y) + 3} fontSize={8} fontWeight={600} className="fill-foreground">
              {cp.name.length > 18 ? cp.name.slice(0, 16) + "…" : cp.name}
            </text>
          </g>
        ))}
        {map.targetPosition && (
          <g>
            <circle cx={toX(map.targetPosition.x)} cy={toY(map.targetPosition.y)} r={12} fill="hsl(var(--primary))" opacity={0.15} />
            <circle cx={toX(map.targetPosition.x)} cy={toY(map.targetPosition.y)} r={6} fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth={1.5} />
            <text x={toX(map.targetPosition.x) + 10} y={toY(map.targetPosition.y) + 3} fontSize={9} fontWeight={700} className="fill-primary">{map.targetPosition.label}</text>
          </g>
        )}
      </svg>
      <div className="flex items-center gap-4 justify-center text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Target</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: colors[0] }} /> Competitors</span>
      </div>
    </div>
  );
}

/* ── Competitor Profile Card (with citations + overrides) ── */
function ProfileCard({
  profile,
  onOverride,
}: {
  profile: CompetitorProfile;
  onOverride?: (field: string, value: any) => void;
}) {
  const threatColor =
    profile.threatLevel === "direct" ? "hsl(var(--destructive))" :
    profile.threatLevel === "indirect" ? "hsl(38 92% 42%)" :
    "hsl(var(--muted-foreground))";

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{profile.name}</span>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
              style={{ color: threatColor, background: `${threatColor}15`, border: `1px solid ${threatColor}30` }}
            >
              {profile.threatLevel}
            </span>
            <CorroborationBadge score={profile.corroborationScore} />
          </div>
          <div className="mt-0.5">
            <EditableField
              value={profile.description}
              citation={profile.citations?.description}
              onSave={onOverride ? v => onOverride("description", v) : undefined}
              fieldName="description"
            />
          </div>
        </div>
      </div>

      {/* Quick facts with citations */}
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
          <EditableField
            value={profile.employeeRange}
            citation={profile.citations?.employeeRange}
            onSave={onOverride ? v => onOverride("employeeRange", v) : undefined}
            fieldName="employees"
          />
        )}
        {profile.estimatedRevenue && (
          <EditableField
            value={profile.estimatedRevenue}
            citation={profile.citations?.estimatedRevenue}
            onSave={onOverride ? v => onOverride("estimatedRevenue", v) : undefined}
            fieldName="revenue"
          />
        )}
      </div>

      {/* Pricing */}
      {profile.pricingApproach && (
        <div className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Pricing: </span>
          <EditableField
            value={profile.pricingApproach}
            citation={profile.citations?.pricingApproach}
            onSave={onOverride ? v => onOverride("pricingApproach", v) : undefined}
            fieldName="pricing"
          />
        </div>
      )}

      {/* Service overlap */}
      {profile.serviceOverlap.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-semibold text-muted-foreground">Overlap:</span>
          {profile.serviceOverlap.map((s, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
          ))}
        </div>
      )}

      {/* Strengths / Weaknesses with citations */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "hsl(142 70% 35%)" }}>
            <Shield size={9} /> Strengths
            <ConfidenceBadge confidence={profile.citations?.strengths?.confidence} />
          </p>
          <ul className="space-y-0.5">
            {profile.strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="text-[10px] text-foreground flex items-start gap-1">
                <span className="mt-0.5" style={{ color: "hsl(142 70% 35%)" }}>•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "hsl(38 92% 42%)" }}>
            <AlertTriangle size={9} /> Weaknesses
            <ConfidenceBadge confidence={profile.citations?.weaknesses?.confidence} />
          </p>
          <ul className="space-y-0.5">
            {profile.weaknesses.slice(0, 3).map((w, i) => (
              <li key={i} className="text-[10px] text-foreground flex items-start gap-1">
                <span className="mt-0.5" style={{ color: "hsl(38 92% 42%)" }}>•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Source links */}
      {profile.sources && profile.sources.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-1 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <span className="text-[8px] text-muted-foreground font-semibold">Sources:</span>
          {profile.sources.slice(0, 3).map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-primary/60 hover:text-primary truncate max-w-[120px]">
              {new URL(url).hostname.replace("www.", "")}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Strategic Gap Card ── */
function GapCard({ gap }: { gap: StrategicGap }) {
  const diffColor =
    gap.difficulty === "low" ? "hsl(142 70% 35%)" :
    gap.difficulty === "medium" ? "hsl(38 92% 42%)" :
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
      {gap.sources && gap.sources.length > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[7px] text-muted-foreground">Sources:</span>
          {gap.sources.slice(0, 2).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[7px] text-primary/50 hover:text-primary">
              <ExternalLink size={7} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Industry Benchmarks Panel ── */
function BenchmarkPanel({ benchmarks, loading }: { benchmarks?: IndustryBenchmark | null; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <Loader2 size={12} className="animate-spin text-primary" />
        <span className="text-[10px] text-muted-foreground">Loading Census/BLS industry benchmarks…</span>
      </div>
    );
  }
  if (!benchmarks) return null;

  const fmt = (n?: number) => n ? n.toLocaleString() : "—";
  const fmtCurrency = (n?: number) => n ? `$${n.toLocaleString()}` : "—";

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-2">
        <Database size={11} className="text-primary" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Industry Benchmarks — NAICS {benchmarks.naicsCode}
        </p>
        <ConfidenceBadge confidence="verified" />
      </div>
      {benchmarks.naicsTitle && (
        <p className="text-[10px] text-muted-foreground">{benchmarks.naicsTitle}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {benchmarks.establishments !== undefined && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Building2 size={8} /> Establishments</p>
            <p className="text-sm font-bold text-foreground">{fmt(benchmarks.establishments)}</p>
          </div>
        )}
        {benchmarks.totalEmployment !== undefined && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Users size={8} /> Total Employment</p>
            <p className="text-sm font-bold text-foreground">{fmt(benchmarks.totalEmployment)}</p>
          </div>
        )}
        {benchmarks.avgEmployeesPerEstablishment !== undefined && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Avg Employees/Firm</p>
            <p className="text-sm font-bold text-foreground">{fmt(benchmarks.avgEmployeesPerEstablishment)}</p>
          </div>
        )}
        {benchmarks.averageWage !== undefined && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Avg Annual Pay</p>
            <p className="text-sm font-bold text-foreground">{fmtCurrency(benchmarks.averageWage)}</p>
          </div>
        )}
      </div>

      {/* SBA Data */}
      {benchmarks.sbaData && (
        <div className="pt-2 border-t space-y-2" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <BarChart3 size={10} className="text-primary" />
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">SBA 7(a) Lending Data</p>
            <ConfidenceBadge confidence="ai-inferred" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {benchmarks.sbaData.avgLoanAmount && (
              <div>
                <p className="text-[9px] text-muted-foreground">Avg Loan Range</p>
                <p className="text-[11px] font-semibold text-foreground">{benchmarks.sbaData.avgLoanAmount}</p>
              </div>
            )}
            {benchmarks.sbaData.defaultRate !== undefined && benchmarks.sbaData.defaultRate !== null && (
              <div>
                <p className="text-[9px] text-muted-foreground">Default Rate</p>
                <p className="text-[11px] font-semibold text-foreground">{benchmarks.sbaData.defaultRate}%</p>
              </div>
            )}
            {benchmarks.sbaData.topLenders && benchmarks.sbaData.topLenders.length > 0 && (
              <div>
                <p className="text-[9px] text-muted-foreground">Top Lenders</p>
                <p className="text-[10px] text-foreground">{benchmarks.sbaData.topLenders.slice(0, 3).join(", ")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/60">
        Sources: {benchmarks.source} ({benchmarks.year || "latest"})
      </p>
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
  benchmarks,
  benchmarksLoading,
  onOverride,
}: CompetitiveLandscapeProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Competitive Landscape</p>
        </div>
        <div className="flex items-center gap-2 p-6 rounded-xl justify-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <Loader2 size={14} className="animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground">
            Researching {competitorNames.length} competitors via multi-source scraping…
          </span>
        </div>
      </div>
    );
  }

  if (!hasCompetitors) return null;

  if (error && !data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Competitive Landscape</p>
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

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-muted-foreground" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Competitive Landscape</p>
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
        <div className="flex items-center gap-2">
          {data.allSources && data.allSources.length > 0 && (
            <span className="text-[8px] text-muted-foreground">{data.allSources.length} sources</span>
          )}
          <button onClick={onResearch} className="text-[10px] text-primary hover:underline flex items-center gap-1">
            <Search size={9} /> Re-research
          </button>
        </div>
      </div>

      {/* Industry Benchmarks */}
      <BenchmarkPanel benchmarks={benchmarks} loading={benchmarksLoading} />

      {/* Market Dynamics Summary */}
      {data.marketDynamics && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-4 flex-wrap">
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
          {data.marketDynamics.sources && data.marketDynamics.sources.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-muted-foreground">Sources:</span>
              {data.marketDynamics.sources.slice(0, 3).map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[7px] text-primary/50 hover:text-primary">
                  {s.title ? s.title.slice(0, 30) : <ExternalLink size={7} />}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Positioning Map */}
      {data.positioningMap && <PositioningMapView map={data.positioningMap} />}

      {/* Competitor Profiles */}
      {data.competitorProfiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Competitor Profiles</p>
            {onOverride && (
              <span className="text-[8px] text-muted-foreground flex items-center gap-1">
                <Edit3 size={8} /> Hover fields to edit
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.competitorProfiles.map((p) => (
              <ProfileCard
                key={p.name}
                profile={p}
                onOverride={onOverride ? (field, value) => onOverride(p.name, field, value) : undefined}
              />
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
        <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <Zap size={11} style={{ color: "hsl(142 70% 35%)" }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Existing Competitive Advantages</p>
          </div>
          <div className="space-y-2">
            {data.competitiveAdvantages.map((a, i) => {
              const sustColor =
                a.sustainability === "high" ? "hsl(142 70% 35%)" :
                a.sustainability === "medium" ? "hsl(38 92% 42%)" :
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

      {/* All Sources Footer */}
      {data.allSources && data.allSources.length > 0 && (
        <details className="text-[8px] text-muted-foreground/60">
          <summary className="cursor-pointer hover:text-muted-foreground">
            View all {data.allSources.length} research sources
          </summary>
          <div className="mt-1 space-y-0.5 pl-2 max-h-32 overflow-y-auto">
            {data.allSources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block truncate hover:text-primary">
                {s.title || s.url}
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
});
