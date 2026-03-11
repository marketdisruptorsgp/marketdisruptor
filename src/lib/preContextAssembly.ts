/**
 * Pre-Context Assembly — Zero AI cost context preparation.
 * Extracts and compresses patent/trend/competitor/complaint signals
 * from the product payload for use by decomposition and strategic-synthesis.
 */

export interface PreContext {
  patents: Record<string, unknown> | null;
  trends: string | null;
  competitors: Record<string, unknown> | null;
  complaints: string[];
  pricing: Record<string, unknown> | null;
  supplyChain: Record<string, unknown> | null;
}

export function assemblePreContext(product: any): PreContext {
  const preContext: PreContext = {
    patents: null,
    trends: null,
    competitors: null,
    complaints: [],
    pricing: null,
    supplyChain: null,
  };

  if (!product) return preContext;

  // Patents — compact summary
  if (product.patentData || product.patentLandscape) {
    const pl = product.patentLandscape || product.patentData;
    preContext.patents = {
      totalPatents: pl.totalPatents,
      expiredPatents: pl.expiredPatents,
      gapAnalysis: typeof pl.gapAnalysis === "string"
        ? pl.gapAnalysis.slice(0, 300)
        : pl.gapAnalysis,
    };
  }

  // Trends — compact string
  if (product.trendAnalysis) {
    preContext.trends = typeof product.trendAnalysis === "string"
      ? product.trendAnalysis.slice(0, 400)
      : JSON.stringify(product.trendAnalysis).slice(0, 400);
  }

  // Competitors — top 3
  if (product.competitorAnalysis) {
    const ca = product.competitorAnalysis;
    preContext.competitors = {
      marketLeader: ca.marketLeader,
      gaps: ca.gaps?.slice(0, 3),
      competitors: ca.competitors?.slice(0, 3),
    };
  }

  // Complaints — top 5
  if (product.communityInsights?.topComplaints) {
    preContext.complaints = product.communityInsights.topComplaints.slice(0, 5);
  }

  // Pricing
  if (product.pricingIntel) {
    preContext.pricing = {
      currentMarketPrice: product.pricingIntel.currentMarketPrice,
      msrpOriginal: product.pricingIntel.msrpOriginal,
      margins: product.pricingIntel.margins,
      priceDirection: product.pricingIntel.priceDirection,
    };
  }

  // Supply chain — compact
  if (product.supplyChain) {
    preContext.supplyChain = {
      suppliers: product.supplyChain.suppliers?.slice(0, 3),
      manufacturers: product.supplyChain.manufacturers?.slice(0, 3),
    };
  }

  return preContext;
}

/**
 * Build a compact upstream intel string for injection into AI prompts.
 * Replaces the per-function upstream extraction pattern.
 */
export function buildUpstreamIntelPrompt(preContext: PreContext): string {
  const parts: string[] = [];

  if (preContext.pricing) {
    parts.push("PRICING INTELLIGENCE:");
    const pi = preContext.pricing as any;
    if (pi.currentMarketPrice) parts.push(`  Market Price: ${pi.currentMarketPrice}`);
    if (pi.msrpOriginal) parts.push(`  Original MSRP: ${pi.msrpOriginal}`);
    if (pi.margins) parts.push(`  Margins: ${pi.margins}`);
    if (pi.priceDirection) parts.push(`  Price Trend: ${pi.priceDirection}`);
  }

  if (preContext.supplyChain) {
    const sc = preContext.supplyChain as any;
    parts.push("SUPPLY CHAIN:");
    if (sc.suppliers?.length > 0) parts.push(`  Suppliers: ${sc.suppliers.map((s: any) => `${s.name} (${s.region})`).join("; ")}`);
    if (sc.manufacturers?.length > 0) parts.push(`  Manufacturers: ${sc.manufacturers.map((m: any) => `${m.name} (${m.region})`).join("; ")}`);
  }

  if (preContext.complaints.length > 0) {
    parts.push("TOP COMPLAINTS:");
    preContext.complaints.forEach(c => parts.push(`  • ${c}`));
  }

  if (preContext.competitors) {
    const ca = preContext.competitors as any;
    parts.push("COMPETITOR INTELLIGENCE:");
    if (ca.marketLeader) parts.push(`  Market Leader: ${ca.marketLeader}`);
    if (ca.gaps?.length > 0) parts.push(`  Gaps: ${ca.gaps.join("; ")}`);
  }

  if (preContext.patents) {
    const pl = preContext.patents as any;
    parts.push("PATENT LANDSCAPE:");
    if (pl.totalPatents) parts.push(`  Total: ${pl.totalPatents}`);
    if (pl.expiredPatents) parts.push(`  Expired: ${pl.expiredPatents}`);
    if (pl.gapAnalysis) parts.push(`  Gap: ${pl.gapAnalysis}`);
  }

  if (preContext.trends) {
    parts.push(`TREND ANALYSIS: ${preContext.trends}`);
  }

  if (parts.length === 0) return "";
  return "\n\n--- UPSTREAM INTELLIGENCE ---\n" + parts.join("\n") + "\nGround your analysis in this intelligence.";
}
