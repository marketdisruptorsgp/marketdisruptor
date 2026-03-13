/**
 * Compress product payload to reduce inter-stage token usage.
 */
export function compressProductPayload(product: any): any {
  if (!product) return product;
  const compressed: any = {
    name: product.name,
    category: product.category,
    era: product.era,
    description: product.description,
    specs: product.specs,
    keyInsight: product.keyInsight,
    marketSizeEstimate: product.marketSizeEstimate,
    assumptionsMap: product.assumptionsMap,
    id: product.id,
    revivalScore: product.revivalScore,
  };
  if (product.reviews) compressed.reviews = product.reviews.slice(0, 5);
  if (product.communityInsights) {
    compressed.communityInsights = {
      ...product.communityInsights,
      topComplaints: product.communityInsights.topComplaints?.slice(0, 5),
      improvementRequests: product.communityInsights.improvementRequests?.slice(0, 5),
    };
  }
  if (product.supplyChain) {
    compressed.supplyChain = {
      suppliers: product.supplyChain.suppliers?.slice(0, 3),
      manufacturers: product.supplyChain.manufacturers?.slice(0, 3),
      distributors: product.supplyChain.distributors?.slice(0, 3),
    };
  }
  if (product.pricingIntel) compressed.pricingIntel = product.pricingIntel;
  if (product.patentData) compressed.patentData = product.patentData;
  return compressed;
}

export function hasUsableBusinessSynthesisData(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  const governed = data.governed;
  const hasGovernedStructure = !!(
    governed?.constraint_map?.binding_constraint_id ||
    governed?.constraint_map?.causal_chains?.length ||
    governed?.first_principles?.viability_assumptions?.length ||
    governed?.root_hypotheses?.length
  );
  const hasStrategicArtifacts = !!(
    data.flippedIdeas?.length ||
    data.ideas?.length ||
    data.opportunities?.length ||
    data.redesignedConcept ||
    data.structuralTransformations?.length
  );
  return hasGovernedStructure || hasStrategicArtifacts;
}
