/**
 * HUMANIZE — System-wide label sanitizer
 *
 * Strips internal IDs, code artifacts, and jargon from all user-facing strings.
 * Must be applied to every label, description, and narrative before rendering.
 *
 * Patterns removed:
 *   - ID prefixes: "C1:", "F_1:", "L2:", "O3:"
 *   - Internal names: "Governed Assumption 1", "Blocker 2"
 *   - Jargon prefixes: "Binding Constraint:", "Counterfactual:"
 *   - Suffix noise: "(+3 related)"
 *   - snake_case → spaces (sentence case, NOT title case)
 *   - Banned words replaced with plain equivalents
 */

/** Words that must never appear in user-facing output */
const BANNED_WORD_MAP: Record<string, string> = {
  leverage: "use",
  leveraging: "using",
  leveraged: "used",
  synergy: "combined advantage",
  synergies: "combined advantages",
  optimize: "improve",
  optimizing: "improving",
  optimized: "improved",
  optimization: "improvement",
  operationalize: "put into practice",
  operationalizing: "putting into practice",
  operationalized: "put into practice",
  streamline: "simplify",
  streamlining: "simplifying",
  streamlined: "simplified",
  ecosystem: "market",
  robust: "strong",
  utilize: "use",
  utilizing: "using",
  utilized: "used",
  utilization: "use",
  unlock: "reveal",
  unlocking: "revealing",
  unlocked: "revealed",
  headcount: "team size",
  preliminary: "early",
  proportional: "relative",
  actionable: "practical",
  stakeholder: "decision-maker",
  stakeholders: "decision-makers",
  paradigm: "model",
  paradigms: "models",
  holistic: "complete",
  holistically: "completely",
};

const BANNED_REGEX = new RegExp(
  `\\b(${Object.keys(BANNED_WORD_MAP).join("|")})\\b`,
  "gi",
);

/**
 * Replace banned words with plain-English equivalents.
 * This is a safety net — the primary fix is in the prompts/templates.
 */
export function scrubBannedWords(text: string): string {
  if (!text) return "";
  return text.replace(BANNED_REGEX, (matched) => {
    const replacement = BANNED_WORD_MAP[matched.toLowerCase()];
    if (!replacement) return matched;
    // Preserve capitalization of first letter
    if (matched[0] === matched[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

/**
 * Enforce a hard character limit, cutting at sentence/clause/word boundary.
 * Returns null if text is empty or single-word filler.
 */
export function enforceCharLimit(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const cleaned = scrubBannedWords(text).trim();
  if (!cleaned || cleaned.split(/\s+/).length <= 1) return null;
  if (cleaned.length <= max) return cleaned;
  return trimAt(cleaned, max) || null;
}

/**
 * Enforce a hard word limit. Returns null if result is empty.
 */
export function enforceWordLimit(text: string | null | undefined, maxWords: number): string | null {
  if (!text) return null;
  const cleaned = scrubBannedWords(text).trim();
  if (!cleaned) return null;
  const words = cleaned.split(/\s+/);
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(" ");
}

export function humanizeLabel(text: string | null | undefined): string {
  if (!text) return "";
  let result = text
    // Strip constraint/friction/leverage/opportunity ID prefixes: "C1: ", "F_1: ", etc.
    .replace(/^[A-Z]_?\d+\s*[:.\-]\s*/i, "")
    // Strip "Governed Assumption N" fallbacks
    .replace(/^Governed Assumption \d+\s*[:.\-]?\s*/gi, "")
    // Strip "Blocker N" fallbacks
    .replace(/^Blocker \d+\s*[:.\-]?\s*/gi, "")
    // Strip "Challenge override N" fallbacks
    .replace(/^Challenge override \d+\s*[:.\-]?\s*/gi, "")
    // Strip "Override: " prefix
    .replace(/^Override:\s*/i, "")
    // Strip "Binding Constraint: " prefix
    .replace(/^Binding Constraint\s*[:.\-]\s*/i, "")
    // Strip "Counterfactual: " prefix
    .replace(/^Counterfactual\s*[:.\-]\s*/i, "")
    // Strip "Strategic Opportunity: " prefix
    .replace(/^Strategic Opportunity\s*[:.\-]\s*/i, "")
    // Strip "Key Insight: " prefix
    .replace(/^Key Insight\s*[:.\-]\s*/i, "")
    // Strip "Structural Delta: " prefix
    .replace(/^Structural Delta\s*[:.\-]\s*/i, "")
    // Strip "Reconfiguration: " prefix
    .replace(/^Reconfiguration\s*[:.\-]\s*/i, "")
    // Strip "Value Creation: " prefix
    .replace(/^Value Creation\s*[:.\-]\s*/i, "")
    // Strip "Pattern: " prefix
    .replace(/^Pattern\s*[:.\-]\s*/i, "")
    // Strip "Signal: " prefix
    .replace(/^Signal\s*[:.\-]\s*/i, "")
    // Strip "and N related/additional/further/other ..." enumerations (inline or trailing)
    .replace(/\s+and\s+\d+\s+(?:related|additional|further|other)\s+\w+s?\b/gi, "")
    .replace(/[.,]?\s+and\s+\d+\s+(?:related|additional|further|other)\s+\w+s?\.?$/i, "")
    // Strip "(+N related)" suffixes
    .replace(/\s*\(\+\d+ related\)\s*/g, "")
    // Strip "Constraint Cluster" generic labels
    .replace(/^Constraint Cluster\s*[:.\-]?\s*/i, "")
    // Strip inline internal IDs like "(C1)", "(F1)", "(Removing C1)"
    .replace(/\s*\((?:Removing\s+)?[A-Z]_?\d+\)\s*/gi, " ")
    // Strip standalone internal IDs in mid-sentence like "C1," or "F1;"
    .replace(/\b[A-Z]_?\d+[,;]\s*/g, "")
    // Strip "(Source: ...)" citations
    .replace(/\s*\(Source:.*?\)\s*/gi, "")
    // Strip "(e.g., ...)" parentheticals that are too long
    .replace(/\s*\(e\.g\.,\s*.{60,}\)\s*/gi, "")
    // Strip "Based on our analysis, " filler
    .replace(/^Based on (?:our|the|this) analysis,?\s*/i, "")
    // Strip "It is worth noting that " filler
    .replace(/^It is (?:worth|important to) not(?:e|ing) that\s*/i, "")
    // Strip "In terms of " filler
    .replace(/^In terms of\s*/i, "")
    // Strip "It should be noted that " filler
    .replace(/^It should be noted that\s*/i, "")
    // Strip "The key takeaway is that " filler
    .replace(/^The key (?:takeaway|finding|insight) (?:is|here is) that\s*/i, "")
    // Strip "Fundamentally, " filler
    .replace(/^(?:Fundamentally|Essentially|Basically|Ultimately|Overall),?\s*/i, "")
    // Convert snake_case to spaces (but NOT title case)
    .replace(/_/g, " ")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();

  // Sentence case: capitalize only the first character
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Scrub banned words as a safety net
  result = scrubBannedWords(result);

  return result;
}

/**
 * Truncate at a sentence or clause boundary — never mid-word, never mid-thought.
 * Returns humanized + truncated string.
 */
export function trimAt(text: string | null | undefined, max: number): string {
  const clean = humanizeLabel(text);
  if (clean.length <= max) return clean;

  // Try to cut at sentence boundary first (period, semicolon)
  const sentenceCut = Math.max(
    clean.lastIndexOf(". ", max),
    clean.lastIndexOf("; ", max),
  );
  if (sentenceCut > max * 0.4) {
    return clean.slice(0, sentenceCut + 1);
  }

  // Fall back to clause boundary (comma)
  const clauseCut = clean.lastIndexOf(", ", max);
  if (clauseCut > max * 0.5) {
    return clean.slice(0, clauseCut);
  }

  // Fall back to word boundary
  const cut = clean.lastIndexOf(" ", max);
  return (cut > max * 0.4 ? clean.slice(0, cut) : clean.slice(0, max)).trimEnd();
}
