/**
 * Gathers all step data from the AnalysisContext into a single Record
 * suitable for passing to downloadFullAnalysisPDF.
 * Includes EVERY analysis step: intel report, disrupt, stress test,
 * pitch deck, redesign, governed, geo, regulatory, patents, scores, and more.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gatherAllAnalysisData(analysis: any): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Product mode steps
  if (analysis.disruptData) data.disrupt = analysis.disruptData;
  if (analysis.stressTestData) data.stressTest = analysis.stressTestData;
  if (analysis.pitchDeckData) data.pitchDeck = analysis.pitchDeckData;
  if (analysis.redesignData) data.redesign = analysis.redesignData;
  if (analysis.geoData) data.geoOpportunity = analysis.geoData;
  if (analysis.regulatoryData) data.regulatoryContext = analysis.regulatoryData;
  if (analysis.userScores && Object.keys(analysis.userScores).length > 0) {
    data.userScores = analysis.userScores;
  }

  // Governed data (reasoning synopsis, decision synthesis, constraint maps, etc.)
  if (analysis.governedData) {
    data.governed = analysis.governedData;
  }

  // Business analysis data (also relevant for service/product modes that have it)
  if (analysis.businessAnalysisData) {
    data.businessAnalysisData = analysis.businessAnalysisData;
  }

  // Patent data from selected product
  if (analysis.selectedProduct?.patentData) {
    data.patentData = analysis.selectedProduct.patentData;
  }

  // Flipped ideas from selected product (may not be in disruptData)
  if (analysis.selectedProduct?.flippedIdeas?.length > 0 && !data.disrupt) {
    data.disrupt = { flippedIdeas: analysis.selectedProduct.flippedIdeas };
  }

  // Adaptive context (problem analysis, entity, challenges)
  if (analysis.adaptiveContext) {
    data.adaptiveContext = analysis.adaptiveContext;
  }

  // Business intelligence extraction (ETA deal data, CIM signals)
  const biExtraction = analysis.adaptiveContext?.biExtraction ?? analysis.biExtraction;
  if (biExtraction) {
    data.biExtraction = biExtraction;
  }

  // Scouted competitors
  if (analysis.scoutedCompetitors?.length > 0) {
    data.scoutedCompetitors = analysis.scoutedCompetitors;
  }

  // Mode routing intelligence
  if (analysis.modeRouting) {
    data.modeRouting = analysis.modeRouting;
  }

  // Strategic profile
  if (analysis.strategicProfile) {
    data.strategicProfile = analysis.strategicProfile;
  }

  // Insight preferences (liked/dismissed)
  if (analysis.insightPreferences && Object.keys(analysis.insightPreferences).length > 0) {
    data.insightPreferences = analysis.insightPreferences;
  }

  // Steering text
  if (analysis.steeringText) {
    data.steeringText = analysis.steeringText;
  }

  return data;
}

/**
 * Gathers all business mode data into a single Record
 * suitable for passing to downloadFullAnalysisPDF.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gatherBusinessAnalysisData(analysis: any): Record<string, unknown> {
  const base = analysis.businessAnalysisData
    ? { ...(analysis.businessAnalysisData as Record<string, unknown>) }
    : {};

  // Business stress test
  if (analysis.businessStressTestData) base.stressTest = analysis.businessStressTestData;

  // Business pitch deck (may be in pitchDeckData for business mode)
  if (analysis.pitchDeckData) base.pitchDeck = analysis.pitchDeckData;
  // Also check businessPitchDeck key in businessAnalysisData
  if (base.businessPitchDeck && !base.pitchDeck) {
    base.pitchDeck = base.businessPitchDeck;
  }

  return base;
}
