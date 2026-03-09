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
 */

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
    // Strip "and N related/additional/further/other ..." trailing enumerations
    .replace(/[.,]?\s+and\s+\d+\s+(?:related|additional|further|other)\s+\w+s?\.?$/i, "")
    // Strip "(+N related)" suffixes
    .replace(/\s*\(\+\d+ related\)\s*/g, "")
    // Strip "Constraint Cluster" generic labels
    .replace(/^Constraint Cluster\s*[:.\-]?\s*/i, "")
    // Strip inline internal IDs like "(C1)", "(F1)", "(Removing C1)"
    .replace(/\s*\((?:Removing\s+)?[A-Z]_?\d+\)\s*/gi, " ")
    // Strip standalone internal IDs in mid-sentence like "C1," or "F1;"
    .replace(/\b[A-Z]_?\d+[,;]\s*/g, "")
    // Convert snake_case to spaces (but NOT title case)
    .replace(/_/g, " ")
    .trim();

  // Sentence case: capitalize only the first character
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

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
