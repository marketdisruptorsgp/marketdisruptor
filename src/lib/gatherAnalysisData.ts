/**
 * Gathers all step data from the AnalysisContext into a single Record
 * suitable for passing to downloadFullAnalysisPDF.
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

  // Patent data from selected product
  if (analysis.selectedProduct?.patentData) {
    data.patentData = analysis.selectedProduct.patentData;
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
