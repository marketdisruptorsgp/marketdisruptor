/**
 * Normalize product field names from various AI output schemas
 * into the canonical shape the UI expects.
 * 
 * Handles alternate field names like:
 *   userJourney → userWorkflow
 *   customerSentiment → communityInsights
 *   steps → stepByStep
 *   defensibility → mapped to vulnerability/advantage arrays
 */

export function normalizeProductFields(p: Record<string, unknown>): Record<string, unknown> {
  const out = { ...p };

  // ── userJourney → userWorkflow ──
  if (!out.userWorkflow && out.userJourney) {
    const uj = out.userJourney as Record<string, unknown>;
    out.userWorkflow = {
      stepByStep: uj.stepByStep || uj.steps || [],
      frictionPoints: uj.frictionPoints || [],
      cognitiveLoad: uj.cognitiveLoad || null,
      contextOfUse: uj.contextOfUse || null,
    };
  }
  // Normalize userWorkflow.stepByStep (may have 'steps' instead)
  if (out.userWorkflow) {
    const uw = out.userWorkflow as Record<string, unknown>;
    if (!uw.stepByStep && uw.steps) {
      uw.stepByStep = uw.steps;
    }
  }

  // ── customerSentiment → communityInsights ──
  if (!out.communityInsights && out.customerSentiment) {
    const cs = out.customerSentiment as Record<string, unknown>;
    out.communityInsights = {
      communitySentiment: cs.communitySentiment || cs.overallSentiment || null,
      topComplaints: cs.topComplaints || cs.painPoints || [],
      improvementRequests: cs.improvementRequests || cs.likelyDislikes || [],
      painPoints: cs.painPoints || [],
    };
  }

  // ── defensibility → extract vulnerabilities/hiddenStrengths ──
  if (out.defensibility && !out.vulnerabilities) {
    const def = out.defensibility as Record<string, unknown>;
    if (Array.isArray(def.vulnerabilities)) out.vulnerabilities = def.vulnerabilities;
    if (Array.isArray(def.competitiveAdvantages)) out.hiddenStrengths = def.competitiveAdvantages;
  }

  // ── marketPosition → extract competitors, differentiator ──
  if (out.marketPosition && !(Array.isArray(out.competitors) && out.competitors.length > 0)) {
    const mp = out.marketPosition as Record<string, unknown>;
    if (Array.isArray(mp.competitors) && mp.competitors.length > 0) {
      out.competitors = mp.competitors;
    }
    if (mp.differentiator && !out.keyInsight) {
      out.keyInsight = mp.differentiator;
    }
  }

  // ── Ensure frictionPoints are accessible at root for signal extraction ──
  if (!out.frictionPoints) {
    const uw = (out.userWorkflow || out.userJourney) as Record<string, unknown> | undefined;
    if (uw?.frictionPoints) {
      out.frictionPoints = uw.frictionPoints;
    }
  }

  return out;
}

/**
 * Detect if a category string indicates a service analysis.
 */
export function isServiceCategory(category: string): boolean {
  const lower = (category || "").toLowerCase();
  return (
    lower.includes("service") ||
    lower.includes("consulting") ||
    lower.includes("repair") ||
    lower.includes("maintenance") ||
    lower.includes("coaching") ||
    lower.includes("therapy") ||
    lower.includes("agency") ||
    lower.includes("cleaning") ||
    lower.includes("care ") ||
    lower === "service"
  );
}
