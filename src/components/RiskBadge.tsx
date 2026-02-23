const RISK_STYLES: Record<string, { color: string }> = {
  Low: { color: "hsl(142 70% 35%)" },
  Medium: { color: "hsl(38 92% 42%)" },
  High: { color: "hsl(var(--destructive))" },
};

export const RiskBadge = ({ type, level }: { type: "Risk" | "Capital"; level?: string }) => {
  if (!level) return null;
  const clean = level.replace(/\[.*?:\s*/, "").replace("]", "").trim();
  const style = RISK_STYLES[clean] || RISK_STYLES["Medium"];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold"
      style={{ color: style.color, background: `${style.color}12`, border: `1px solid ${style.color}30` }}
    >
      {type}: {clean}
    </span>
  );
};
