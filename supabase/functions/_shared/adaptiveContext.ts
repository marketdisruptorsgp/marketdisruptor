/**
 * Adaptive Context Builder — injects user's problem analysis, challenges,
 * and entity context into every edge function prompt.
 *
 * This module is the SINGLE mechanism for ensuring the AI continuously
 * adapts to the user's original problem framing across ALL pipeline steps.
 */

export interface AdaptiveChallenge {
  id: string;
  question: string;
  context: string;
  priority: "high" | "medium" | "low";
  related_mode: string;
}

export interface AdaptiveEntity {
  name: string;
  type: string;
}

export interface AdaptiveModeSignal {
  mode: string;
  confidence: number;
  reason: string;
}

export interface AdaptiveContext {
  /** The user's raw problem statement */
  problemStatement?: string;
  /** AI-detected entity being analyzed */
  entity?: AdaptiveEntity;
  /** AI-detected mode signals with confidence */
  detectedModes?: AdaptiveModeSignal[];
  /** User-selected strategic challenges to focus on */
  selectedChallenges?: AdaptiveChallenge[];
  /** AI summary of the user's intent */
  summary?: string;
  /** User's ongoing guidance from 'Guide the AI' inputs */
  userGuidance?: string;
  /** Detected industry archetype (saas | logistics | ecommerce | restaurant | healthcare | manufacturing | other) */
  industryArchetype?: string;
  /** Input clarity score 0-100 — lower means more vague */
  inputClarity?: number;
  /** Edge case classification from analyze-problem */
  edgeCaseType?: "shallow" | "overly_specific" | "clear";
  /** Fallback assumption strings injected when input is shallow */
  fallbackAssumptions?: string[];
  /** Clarification prompts for vague inputs — surfaced to user */
  clarificationPrompts?: string[];
  /**
   * Active analysis modes when the user has selected multiple modes.
   * Values: "product" | "service" | "business" | "business_model"
   * When present with >1 entry, edge functions will blend mode enforcement
   * across all active modes instead of enforcing a single mode.
   */
  activeModes?: string[];
}

/**
 * Build a prompt injection string from the adaptive context.
 * Returns empty string if no context is provided.
 *
 * This prompt section is injected AFTER the mode guard and BEFORE
 * the user prompt in every edge function.
 */
export function buildAdaptiveContextPrompt(ctx?: AdaptiveContext | null): string {
  if (!ctx) return "";

  const parts: string[] = [];
  parts.push("\n═══ ADAPTIVE CONTEXT: USER'S PROBLEM FRAMING ═══");

  if (ctx.entity) {
    parts.push(`\nENTITY UNDER ANALYSIS: "${ctx.entity.name}" — ${ctx.entity.type}`);
  }

  if (ctx.problemStatement) {
    parts.push(`\nORIGINAL PROBLEM STATEMENT:\n"${ctx.problemStatement.slice(0, 800)}"`);
  }

  if (ctx.summary) {
    parts.push(`\nCORE INTENT: ${ctx.summary}`);
  }

  if (ctx.detectedModes && ctx.detectedModes.length > 0) {
    const modeStr = ctx.detectedModes
      .map(m => `${m.mode} (${m.confidence}% — ${m.reason})`)
      .join(", ");
    parts.push(`\nDETECTED ANALYTICAL DIMENSIONS: ${modeStr}`);
    parts.push("Ensure your analysis addresses ALL detected dimensions proportionally to their confidence.");
  }

  if (ctx.selectedChallenges && ctx.selectedChallenges.length > 0) {
    parts.push("\nUSER-SELECTED FOCUS AREAS (must be directly addressed in your analysis):");
    for (const ch of ctx.selectedChallenges) {
      const priority = ch.priority === "high" ? "⚡ HIGH" : ch.priority === "medium" ? "● MEDIUM" : "○ LOW";
      parts.push(`  ${priority}: ${ch.question}`);
      if (ch.context) parts.push(`    Context: ${ch.context}`);
    }
    parts.push("\nCRITICAL: Your analysis MUST contain specific, actionable responses to each focus area above.");
    parts.push("Do NOT produce generic analysis that ignores the user's stated strategic questions.");
  }

  if (ctx.clarificationPrompts && ctx.clarificationPrompts.length > 0) {
    parts.push(`\nINPUT CLARITY NOTE: The user's input was shallow (clarity: ${ctx.inputClarity ?? "??"}/100). Enrich your analysis using these clarification dimensions:`);
    ctx.clarificationPrompts.forEach(q => parts.push(`  → ${q}`));
  }

  if (ctx.industryArchetype) {
    parts.push(`\nINDUSTRY ARCHETYPE: "${ctx.industryArchetype}" — apply domain-specific structural patterns and constraint categories for this archetype.`);
  }

  if (ctx.fallbackAssumptions && ctx.fallbackAssumptions.length > 0) {
    parts.push(`\nFALLBACK ASSUMPTIONS (use to enrich shallow input context):`);
    ctx.fallbackAssumptions.forEach(a => parts.push(`  • ${a}`));
  }

  if (ctx.userGuidance) {
    parts.push(`\nONGOING USER GUIDANCE: "${ctx.userGuidance.slice(0, 500)}"`);
    parts.push("Adapt your reasoning to reflect this guidance. If it conflicts with earlier assumptions, explain the tension.");
  }

  parts.push("\n═══ END ADAPTIVE CONTEXT ═══\n");

  return parts.join("\n");
}

/**
 * Extract adaptive context from the request body.
 * Handles both the new structured format and legacy format.
 */
export function extractAdaptiveContext(body: Record<string, unknown>): AdaptiveContext | null {
  // New structured format
  if (body.adaptiveContext) {
    return body.adaptiveContext as AdaptiveContext;
  }

  // Legacy: try to reconstruct from notes/description
  const notes = (body.product as Record<string, unknown>)?.notes as string || "";
  if (notes.includes("--- FOCUS AREAS ---")) {
    const focusMatch = notes.split("--- FOCUS AREAS ---")[1]?.split("---")[0]?.trim();
    if (focusMatch) {
      return {
        problemStatement: notes.split("--- FOCUS AREAS ---")[0].replace("[SERVICE ANALYSIS] ", "").trim(),
        selectedChallenges: focusMatch.split("\n").filter(Boolean).map((line, i) => ({
          id: `legacy-${i}`,
          question: line.replace(/^•\s*/, "").replace(/\s*\(.*\)$/, ""),
          context: "",
          priority: "high" as const,
          related_mode: "business",
        })),
      };
    }
  }

  return null;
}
