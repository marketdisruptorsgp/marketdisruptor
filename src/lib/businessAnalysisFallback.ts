/**
 * Utility to parse business analysis disruption data into the disrupt page's
 * flippedLogic format. Handles string `attackMoves` (narrative) by splitting
 * numbered items into individual cards.
 */

export function parseFlippedLogicFromBusiness(biz: Record<string, any>): any[] {
  const da = biz?.disruptionAnalysis;
  if (!da) return [];

  const items: any[] = [];

  // attackMoves may be a string (narrative) or array
  const raw = da.attackMoves;
  if (typeof raw === "string" && raw.length > 0) {
    // Split numbered items: "1. ...", "2. ..." etc.
    const numbered = raw.split(/\d+\.\s+/).filter(Boolean);
    if (numbered.length > 1) {
      numbered.forEach((part, i) => {
        const cleaned = part.replace(/\s+/g, " ").trim();
        items.push({
          boldAlternative: cleaned.slice(0, 120),
          rationale: cleaned,
          originalAssumption: `Disruption move ${i + 1}`,
          _fromAttackMoves: true,
        });
      });
    } else {
      // Single narrative — treat as one item with truncated title
      items.push({
        boldAlternative: raw.slice(0, 120) + (raw.length > 120 ? "…" : ""),
        rationale: raw,
        originalAssumption: "Disruptor attack strategy",
        _fromAttackMoves: true,
      });
    }
  } else if (Array.isArray(raw)) {
    raw.forEach((move: any, i: number) => {
      const text = typeof move === "string" ? move : move?.description || move?.move || JSON.stringify(move);
      items.push({
        boldAlternative: text.slice(0, 120),
        rationale: text,
        originalAssumption: `Attack move ${i + 1}`,
        _fromAttackMoves: true,
      });
    });
  }

  // Also include disruptor profile as context if available
  if (da.disruptorProfile && items.length === 0) {
    items.push({
      boldAlternative: da.disruptorProfile.slice(0, 120) + (da.disruptorProfile.length > 120 ? "…" : ""),
      rationale: da.disruptorProfile,
      originalAssumption: "Disruptor profile",
      _fromAttackMoves: true,
    });
  }

  return items;
}
