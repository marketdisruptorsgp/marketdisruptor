/**
 * Competitive Intelligence Types & Extraction
 */

export interface CompetitorProfile {
  name: string;
  url: string;
  description: string;
  estimatedRevenue: string | null;
  employeeRange: string | null;
  serviceOverlap: string[];
  strengths: string[];
  weaknesses: string[];
  pricingApproach: string | null;
  geographicFocus: string;
  positioningAxis: {
    pricePoint: number;
    specialization: number;
    scale: number;
    reputation: number;
  };
  threatLevel: "direct" | "indirect" | "peripheral";
  sources: string[];
}

export interface PositioningMap {
  xAxis: { label: string; description: string };
  yAxis: { label: string; description: string };
  targetPosition: { x: number; y: number; label: string };
  competitorPositions: { name: string; x: number; y: number }[];
}

export interface StrategicGap {
  gap: string;
  opportunity: string;
  difficulty: "low" | "medium" | "high";
  potentialImpact: string;
}

export interface CompetitiveAdvantage {
  advantage: string;
  sustainability: "low" | "medium" | "high";
  exploitStrategy: string;
}

export interface MarketDynamics {
  consolidationTrend: "fragmenting" | "stable" | "consolidating";
  priceCompetition: "low" | "medium" | "high";
  differentiationBasis: string;
  entryBarriers: string;
}

export interface CompetitiveIntelligence {
  competitorProfiles: CompetitorProfile[];
  positioningMap: PositioningMap | null;
  strategicGaps: StrategicGap[];
  competitiveAdvantages: CompetitiveAdvantage[];
  marketDynamics: MarketDynamics | null;
}

/**
 * Extract competitor names and business context from BI extraction / governed data.
 */
export function extractCompetitorNames(
  biExtraction: Record<string, any> | null,
  governedData: Record<string, any> | null,
): { competitors: string[]; businessName: string; businessDescription: string; industry: string; revenue: string; services: string } {
  const bi = biExtraction || {};
  const gov = governedData || {};

  // Try to find competitor names from various possible fields
  let competitors: string[] = [];
  
  // BI extraction fields
  if (bi.competitors && Array.isArray(bi.competitors)) {
    competitors = bi.competitors.map((c: any) => typeof c === "string" ? c : c.name || c.company || "").filter(Boolean);
  } else if (bi.competition && Array.isArray(bi.competition)) {
    competitors = bi.competition.map((c: any) => typeof c === "string" ? c : c.name || "").filter(Boolean);
  } else if (bi.competitive_landscape?.competitors) {
    competitors = bi.competitive_landscape.competitors.map((c: any) => typeof c === "string" ? c : c.name || "").filter(Boolean);
  }
  
  // Also check governed data
  if (competitors.length === 0 && gov.competitors) {
    const gc = gov.competitors;
    if (Array.isArray(gc)) {
      competitors = gc.map((c: any) => typeof c === "string" ? c : c.name || "").filter(Boolean);
    }
  }

  // Check for competitor names in text fields
  if (competitors.length === 0 && bi.competitive_notes) {
    // Try to extract names from a text description
    const notes = String(bi.competitive_notes);
    // Simple heuristic: look for capitalized multi-word names
    const nameMatches = notes.match(/(?:^|\s)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})(?:\s|,|\.|\)|$)/g);
    if (nameMatches) {
      competitors = nameMatches.map(m => m.trim()).filter(n => n.length > 2 && n.length < 40).slice(0, 8);
    }
  }

  const businessName = bi.business_name || bi.company_name || bi.name || gov.business_name || "";
  const businessDescription = bi.description || bi.business_description || bi.overview || gov.description || "";
  const industry = bi.industry || bi.sector || bi.category || gov.industry || "";
  const revenue = bi.revenue ? String(bi.revenue) : bi.annual_revenue ? String(bi.annual_revenue) : "";
  const services = Array.isArray(bi.services) ? bi.services.join(", ") : bi.services || bi.products || "";

  return { competitors, businessName, businessDescription, industry, revenue, services };
}
