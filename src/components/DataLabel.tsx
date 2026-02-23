const LABEL_STYLES: Record<string, { color: string; label: string }> = {
  "[VERIFIED]": { color: "hsl(142 70% 35%)", label: "VERIFIED" },
  "[MODELED]": { color: "hsl(217 91% 45%)", label: "MODELED" },
  "[ASSUMPTION]": { color: "hsl(38 92% 42%)", label: "ASSUMPTION" },
  "[DATA GAP]": { color: "hsl(var(--destructive))", label: "DATA GAP" },
  "[USER PROVIDED]": { color: "hsl(271 70% 45%)", label: "USER PROVIDED" },
  "[VISUAL INFERENCE]": { color: "hsl(200 80% 45%)", label: "VISUAL INFERENCE" },
};

export const DataLabel = ({ label }: { label?: string }) => {
  if (!label) return null;
  const style = LABEL_STYLES[label] || LABEL_STYLES["[ASSUMPTION]"];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide uppercase"
      style={{ color: style.color, background: `${style.color}15`, border: `1px solid ${style.color}30` }}
    >
      {style.label}
    </span>
  );
};
