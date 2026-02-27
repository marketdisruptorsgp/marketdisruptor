import { Lightbulb } from "lucide-react";

interface KeyTakeawayBannerProps {
  takeaway: string;
  accentColor?: string;
  badges?: { label: string; color: string }[];
}

export function KeyTakeawayBanner({ takeaway, accentColor = "hsl(var(--primary))", badges }: KeyTakeawayBannerProps) {
  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{
        background: "hsl(var(--muted))",
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <Lightbulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Key Takeaway</p>
          <p className="text-sm leading-relaxed text-foreground/85">{takeaway}</p>
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${b.color}15`, color: b.color }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Derive a community takeaway from community insights data */
export function getCommunityTakeaway(ci: { topComplaints?: string[]; improvementRequests?: string[]; communitySentiment?: string; redditSentiment?: string }) {
  const complaints = ci.topComplaints?.length || 0;
  const requests = ci.improvementRequests?.length || 0;
  if (complaints === 0 && requests === 0) return null;
  const parts: string[] = [];
  if (complaints > 0) parts.push(`${complaints} recurring complaint${complaints > 1 ? "s" : ""}`);
  if (requests > 0) parts.push(`${requests} improvement request${requests > 1 ? "s" : ""}`);
  return `${parts.join(" and ")} identified from community data`;
}

/** Derive a pricing takeaway */
export function getPricingTakeaway(pi: { margins?: string; priceDirection?: string; currentMarketPrice?: string }) {
  if (!pi) return null;
  const parts: string[] = [];
  if (pi.margins) parts.push(pi.margins);
  else if (pi.priceDirection) parts.push(`Price trend: ${pi.priceDirection}`);
  return parts.length > 0 ? parts[0] : null;
}

/** Derive a supply chain takeaway */
export function getSupplyChainTakeaway(sc: { manufacturers?: unknown[]; suppliers?: unknown[]; distributors?: unknown[] }) {
  if (!sc) return null;
  const mfgCount = sc.manufacturers?.length || 0;
  const supCount = sc.suppliers?.length || 0;
  const distCount = sc.distributors?.length || 0;
  const total = mfgCount + supCount + distCount;
  if (total === 0) return null;
  const parts: string[] = [];
  if (mfgCount > 0) parts.push(`${mfgCount} manufacturer${mfgCount > 1 ? "s" : ""}`);
  if (supCount > 0) parts.push(`${supCount} supplier${supCount > 1 ? "s" : ""}`);
  if (distCount > 0) parts.push(`${distCount} distributor${distCount > 1 ? "s" : ""}`);
  return `${parts.join(", ")} identified in the supply chain`;
}

/** Generate verdict badges from product data */
export function getVerdictBadges(product: {
  revivalScore?: number;
  pricingIntel?: { priceDirection?: string; margins?: string };
  supplyChain?: { manufacturers?: unknown[] };
}) {
  const badges: { label: string; color: string }[] = [];
  if (product.revivalScore && product.revivalScore >= 8) badges.push({ label: "High Potential", color: "hsl(142 70% 35%)" });
  if (product.pricingIntel?.priceDirection === "up") badges.push({ label: "Rising Prices", color: "hsl(142 70% 35%)" });
  if (product.pricingIntel?.priceDirection === "down") badges.push({ label: "Falling Prices", color: "hsl(var(--destructive))" });
  if (product.pricingIntel?.margins?.toLowerCase().includes("under")) badges.push({ label: "Underpriced", color: "hsl(38 92% 40%)" });
  if ((product.supplyChain?.manufacturers?.length || 0) <= 1) badges.push({ label: "Supply Risk", color: "hsl(var(--destructive))" });
  return badges;
}

/** Derive a disrupt takeaway from first-principles data */
export function getDisruptTakeaway(data: Record<string, unknown> | null) {
  if (!data) return null;
  const assumptions = data.hiddenAssumptions as { assumption?: string }[] | undefined;
  const flipped = data.flippedLogic as unknown[] | undefined;
  const parts: string[] = [];
  if (assumptions?.length) parts.push(`${assumptions.length} hidden assumption${assumptions.length > 1 ? "s" : ""} uncovered`);
  if (flipped?.length) parts.push(`${flipped.length} logic flip${flipped.length > 1 ? "s" : ""} generated`);
  return parts.length > 0 ? parts.join(" and ") : null;
}

/** Derive a stress test takeaway */
export function getStressTestTakeaway(data: Record<string, unknown> | null) {
  if (!data) return null;
  const redTeam = data.redTeamArguments as unknown[] | undefined;
  const greenTeam = data.greenTeamArguments as unknown[] | undefined;
  if (!redTeam?.length && !greenTeam?.length) return null;
  const parts: string[] = [];
  if (redTeam?.length) parts.push(`${redTeam.length} risk${redTeam.length > 1 ? "s" : ""} identified`);
  if (greenTeam?.length) parts.push(`${greenTeam.length} defense${greenTeam.length > 1 ? "s" : ""} validated`);
  return parts.join(", ");
}

/** Derive a pitch deck takeaway */
export function getPitchTakeaway(data: Record<string, unknown> | null) {
  if (!data) return null;
  const slides = data.slides as unknown[] | undefined;
  if (slides?.length) return `${slides.length}-slide investor deck generated — ready to present`;
  return null;
}

/** Derive a user workflow takeaway */
export function getWorkflowTakeaway(data: Record<string, unknown> | null) {
  if (!data) return null;
  const uw = data.userWorkflow as { stepByStep?: string[]; frictionPoints?: unknown[]; cognitiveLoad?: string } | undefined;
  if (!uw) return null;
  const steps = uw.stepByStep?.length || 0;
  const friction = uw.frictionPoints?.length || 0;
  if (steps === 0) return null;
  const parts: string[] = [`${steps}-step user journey mapped`];
  if (friction > 0) parts.push(`${friction} friction point${friction > 1 ? "s" : ""} identified`);
  if (uw.cognitiveLoad) parts.push(`cognitive load: ${uw.cognitiveLoad}`);
  return parts.join(" · ");
}
