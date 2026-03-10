/**
 * Financial Trend Charts — Margin trends & SDE trajectory
 * Shows when multi-year P&L data is available from extraction.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3 } from "lucide-react";
import { extractFinancialTrends, type FinancialTrends } from "@/lib/financialTrendExtractor";
import { fmtCurrency } from "@/lib/financialModelingEngine";

interface FinancialTrendChartsProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
}

const TREND_ICONS = {
  improving: <TrendingUp size={12} />,
  growing: <TrendingUp size={12} />,
  stable: <Minus size={12} />,
  declining: <TrendingDown size={12} />,
  shrinking: <TrendingDown size={12} />,
  unknown: <Minus size={12} />,
};

const TREND_COLORS = {
  improving: "hsl(var(--success))",
  growing: "hsl(var(--success))",
  stable: "hsl(var(--muted-foreground))",
  declining: "hsl(var(--destructive))",
  shrinking: "hsl(var(--destructive))",
  unknown: "hsl(var(--muted-foreground))",
};

function TrendBadge({ label, trend }: { label: string; trend: string }) {
  const color = TREND_COLORS[trend as keyof typeof TREND_COLORS] || TREND_COLORS.unknown;
  const icon = TREND_ICONS[trend as keyof typeof TREND_ICONS] || TREND_ICONS.unknown;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] font-bold capitalize" style={{ color }}>{label}: {trend}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">
            {p.dataKey.includes("Pct") || p.dataKey.includes("Margin")
              ? `${Number(p.value).toFixed(1)}%`
              : fmtCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export const FinancialTrendCharts = memo(function FinancialTrendCharts({
  biExtraction,
  governedData,
}: FinancialTrendChartsProps) {
  const trends = useMemo(
    () => extractFinancialTrends(biExtraction, governedData),
    [biExtraction, governedData],
  );

  if (!trends.years.length) return null;

  const hasRevenue = trends.years.some(y => y.revenue);
  const hasSDE = trends.years.some(y => y.sde);
  const hasMargins = trends.years.some(y => y.grossMarginPct || y.sdeMarginPct);

  if (!hasRevenue && !hasSDE) return null;

  const chartData = trends.years.map(y => ({
    year: y.year,
    Revenue: y.revenue ?? 0,
    SDE: y.sde ?? 0,
    "Gross Margin": y.grossMarginPct ?? 0,
    "SDE Margin": y.sdeMarginPct ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl overflow-hidden space-y-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <BarChart3 size={14} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Financial Trajectory</h3>
              <p className="text-[10px] text-muted-foreground">
                {trends.hasMultiYear
                  ? `${trends.years.length}-year P&L trend analysis`
                  : "Current financial snapshot"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trends.revenueCAGR !== null && (
              <div className="text-right">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Revenue CAGR</p>
                <p className={`text-sm font-black ${trends.revenueCAGR >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {trends.revenueCAGR >= 0 ? "+" : ""}{trends.revenueCAGR.toFixed(1)}%
                </p>
              </div>
            )}
            {trends.sdeCAGR !== null && (
              <div className="text-right ml-3">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">SDE CAGR</p>
                <p className={`text-sm font-black ${trends.sdeCAGR >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {trends.sdeCAGR >= 0 ? "+" : ""}{trends.sdeCAGR.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trend badges */}
        {trends.hasMultiYear && (
          <div className="flex gap-2 mt-3">
            <TrendBadge label="Margins" trend={trends.marginTrend} />
            <TrendBadge label="SDE" trend={trends.sdeTrend} />
          </div>
        )}
      </div>

      {/* Revenue & SDE Chart */}
      {(hasRevenue || hasSDE) && trends.hasMultiYear && (
        <div className="px-5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Revenue & SDE Trajectory
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sdeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => fmtCurrency(v)} />
                <Tooltip content={<CustomTooltip />} />
                {hasRevenue && (
                  <Area type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} dot={{ r: 3 }} />
                )}
                {hasSDE && (
                  <Area type="monotone" dataKey="SDE" stroke="hsl(var(--success))" fill="url(#sdeGrad)" strokeWidth={2} dot={{ r: 3 }} />
                )}
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Margin Chart */}
      {hasMargins && trends.hasMultiYear && (
        <div className="px-5 pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Margin Trends
          </p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => `${v}%`} domain={[0, "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                {chartData.some(d => d["Gross Margin"] > 0) && (
                  <Line type="monotone" dataKey="Gross Margin" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                )}
                {chartData.some(d => d["SDE Margin"] > 0) && (
                  <Line type="monotone" dataKey="SDE Margin" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                )}
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Single-year snapshot (no multi-year) */}
      {!trends.hasMultiYear && (hasRevenue || hasSDE) && (
        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {trends.years[0]?.revenue && (
            <MetricCard label="Revenue" value={fmtCurrency(trends.years[0].revenue)} icon={<DollarSign size={12} />} />
          )}
          {trends.years[0]?.sde && (
            <MetricCard label="SDE" value={fmtCurrency(trends.years[0].sde)} icon={<DollarSign size={12} />} />
          )}
          {trends.years[0]?.grossMarginPct && (
            <MetricCard label="Gross Margin" value={`${trends.years[0].grossMarginPct.toFixed(1)}%`} icon={<BarChart3 size={12} />} />
          )}
          {trends.years[0]?.sdeMarginPct && (
            <MetricCard label="SDE Margin" value={`${trends.years[0].sdeMarginPct.toFixed(1)}%`} icon={<BarChart3 size={12} />} />
          )}
        </div>
      )}
    </motion.div>
  );
});

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.4)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-black text-foreground">{value}</p>
    </div>
  );
}
