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
 *   - snake_case → Title Case
 */

export function humanizeLabel(text: string | null | undefined): string {
  if (!text) return "";
  return text
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
    // Strip "(+N related)" suffixes
    .replace(/\s*\(\+\d+ related\)\s*/g, "")
    // Strip "Constraint Cluster" generic labels
    .replace(/^Constraint Cluster\s*[:.\-]?\s*/i, "")
    // Convert snake_case to Title Case
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Truncate at a word boundary — never mid-word.
 * Returns humanized + truncated string.
 */
export function trimAt(text: string | null | undefined, max: number): string {
  const clean = humanizeLabel(text);
  if (clean.length <= max) return clean;
  const cut = clean.lastIndexOf(" ", max);
  return (cut > 0 ? clean.slice(0, cut) : clean.slice(0, max)) + "…";
}
