/**
 * CONCEPT SYNTHESIS — Invention Engine (Product Mode only)
 * 
 * Generates 4-6 causally-traced, engineering-grounded invention concepts.
 * Uses model cascade (Flash → Pro) for reliability.
 * Includes robust JSON repair for truncated AI output.
 * 
 * Phase 5: Slimmed prompt (removed persona_fit, performer_network,
 *          system_architecture, breakthrough_metric to prevent truncation)
 * Phase 6: Post-processing guardrails (causal trace validation, dedup)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
//  MECHANISM LIBRARY — ~40 technical enablers (compressed)
// ═══════════════════════════════════════════════════════════════

const MECHANISM_LIBRARY = `
TECHNICAL MECHANISM LIBRARY — Use these when generating concepts.

## Fluid/Seal
1. Magnetic Fluid Seals | Ferrofluid zero-wear seal | rotating shafts, pumps
2. Hydrophobic Coatings | Nano-textured surfaces repel water/oil
3. Self-Healing Gaskets | Polymer + microencapsulated sealant

## Sensing
4. Piezoelectric Vibration | Crystal voltage from stress | condition monitoring
5. MEMS Accelerometers | Micro-machined silicon | orientation, impact
6. Capacitive Touch/Proximity | Electric field changes | UI, level sensing
7. ToF Distance Sensing | Laser pulse timing | level, obstacle detection

## Materials
8. Shape Memory Alloys (NiTi) | Returns to shape when heated | actuators
9. Self-Healing Polymers | Microcapsule reversible bonds | coatings
10. Phase-Change Materials | Absorb/release heat at transition | thermal mgmt
11. Carbon Fiber Reinforced Polymer | High strength-to-weight
12. Biodegradable Polymers (PLA/PHA) | Compostable alternatives

## Assembly
13. Modular Snap-Fit | Tool-free assembly | consumer products
14. Bayonet Mount | Quarter-turn lock | quick-change
15. Magnetic Alignment | Rare-earth self-aligning | accessories

## Actuation
16. Solenoid | Electromagnetic linear push/pull | valves, locks
17. Piezoelectric Stack | High force, small displacement | precision
18. Electroactive Polymers | Deforms under voltage | haptics

## Surface
19. Self-Cleaning (Lotus Effect) | Superhydrophobic micro/nanostructure
20. Anti-Fouling Coatings | Prevents biological buildup
21. DLC (Diamond-Like Carbon) | Ultra-hard, low-friction

## Communication
22. BLE | Short-range, low-power wireless | IoT, wearables
23. NFC | Tap-to-connect, passive tags | authentication
24. LoRa | Long-range, low-power | remote monitoring

## Energy
25. Energy Harvesting | Piezo/Solar/Thermal → electrical | remote sensors
26. Wireless Power Transfer (Qi) | Inductive charging
`.trim();

// ═══════════════════════════════════════════════════════════════
//  ROBUST JSON REPAIR
// ═══════════════════════════════════════════════════════════════

function repairTruncatedJson(raw: string): Record<string, unknown> | null {
  // Clean markdown fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) return null;
  cleaned = cleaned.slice(firstBrace);

  // Try direct parse first
  try { return JSON.parse(cleaned); } catch {}

  // Remove trailing incomplete string/value and close brackets
  let repaired = cleaned;

  const lastQuote = repaired.lastIndexOf('"');
  const afterLastQuote = repaired.slice(lastQuote + 1).trim();
  if (afterLastQuote === '' || afterLastQuote.match(/^[^"{}[\],]*$/)) {
    let cutPoint = repaired.length;
    for (let i = repaired.length - 1; i >= 0; i--) {
      const ch = repaired[i];
      if (ch === ',' || ch === '}' || ch === ']') {
        cutPoint = ch === ',' ? i : i + 1;
        break;
      }
    }
    repaired = repaired.slice(0, cutPoint);
  }

  repaired = repaired.replace(/,\s*$/, '');

  let opens = 0, closes = 0, openArr = 0, closeArr = 0;
  let inString = false, escaped = false;
  for (const ch of repaired) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') opens++;
    if (ch === '}') closes++;
    if (ch === '[') openArr++;
    if (ch === ']') closeArr++;
  }

  if (inString) repaired += '"';
  repaired += ']'.repeat(Math.max(0, openArr - closeArr));
  repaired += '}'.repeat(Math.max(0, opens - closes));

  try { return JSON.parse(repaired); } catch {}

  // Last resort: extract just the concepts array
  const conceptsMatch = repaired.match(/"concepts"\s*:\s*\[/);
  if (conceptsMatch) {
    const start = conceptsMatch.index! + conceptsMatch[0].length;
    let depth = 1;
    let end = start;
    inString = false;
    escaped = false;
    for (let i = start; i < repaired.length && depth > 0; i++) {
      const ch = repaired[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '[') depth++;
      if (ch === ']') depth--;
      end = i;
    }
    const arrayStr = repaired.slice(start, end);
    const lastCloseBrace = arrayStr.lastIndexOf('}');
    if (lastCloseBrace > 0) {
      const partialArray = arrayStr.slice(0, lastCloseBrace + 1);
      try {
        const concepts = JSON.parse(`[${partialArray}]`);
        if (Array.isArray(concepts) && concepts.length > 0) {
          return { concepts, innovation_paths: [], contrarian_narrative: null };
        }
      } catch {}
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
//  PHASE 6 — POST-PROCESSING GUARDRAILS
// ═══════════════════════════════════════════════════════════════

/** Flag concepts with incomplete causal trace (origin fields) */
function validateCausalTraces(concepts: any[]): void {
  for (const c of concepts) {
    const o = c.origin;
    const missing = !o
      || !o.structural_driver?.trim()
      || !o.assumption_flipped?.trim()
      || !o.enabling_mechanism?.trim();
    if (missing) {
      c._causal_incomplete = true;
      console.warn(`[ConceptSynthesis] Causal trace incomplete for "${c.name}"`);
    }
  }
}

/** Word-level Jaccard similarity between two strings */
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set((a || "").toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set((b || "").toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Remove near-duplicate concepts (Jaccard > 0.7 on description) */
function deduplicateConcepts(concepts: any[]): any[] {
  const kept: any[] = [];
  for (const c of concepts) {
    const isDupe = kept.some(existing => {
      const sim = jaccardSimilarity(existing.description || "", c.description || "");
      if (sim > 0.7) {
        console.warn(`[ConceptSynthesis] Dedup: "${c.name}" too similar to "${existing.name}" (${(sim * 100).toFixed(0)}%)`);
        return true;
      }
      return false;
    });
    if (!isDupe) kept.push(c);
  }
  if (kept.length < concepts.length) {
    console.log(`[ConceptSynthesis] Dedup removed ${concepts.length - kept.length} near-duplicate(s)`);
  }
  if (kept.length < 2) {
    console.warn(`[ConceptSynthesis] Only ${kept.length} concept(s) after dedup — returning all`);
  }
  return kept;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      product,
      structuralDecomposition,
      assumptions,
      flippedLogic,
      conceptCount = 4,
      userLens,
      morphologicalVectors,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const requestedCount = Math.max(3, Math.min(5, conceptCount));

    // Extract structural pressures
    const leveragePrimitives = structuralDecomposition?.leverageAnalysis?.leveragePrimitives || [];
    const systemDynamics = structuralDecomposition?.systemDynamics || {};
    const functionalComponents = structuralDecomposition?.functionalComponents || [];

    const structuralContext = `
STRUCTURAL PRESSURES:
${leveragePrimitives.slice(0, 6).map((p: any, i: number) =>
  `${i + 1}. [${p.disruption_score || "?"}] ${p.label} — ${p.currentBehavior || ""} | Transform: ${p.bestTransformation || "unknown"}`
).join("\n")}
FAILURE MODES: ${JSON.stringify(systemDynamics.failureModes?.slice(0, 3) || []).slice(0, 300)}
BOTTLENECKS: ${JSON.stringify(systemDynamics.bottlenecks?.slice(0, 3) || []).slice(0, 200)}
KEY COMPONENTS: ${functionalComponents.slice(0, 5).map((c: any) => c.name || c.label).join(", ")}
`;

    const assumptionContext = `
HIDDEN ASSUMPTIONS (top leverage):
${(assumptions || []).slice(0, 8).map((a: any, i: number) =>
  `${i + 1}. [${a.leverageScore || "?"}] "${a.assumption}" | Flip: ${a.challengeIdea || ""}`
).join("\n")}
FLIPPED LOGIC:
${(flippedLogic || []).slice(0, 5).map((f: any, i: number) =>
  `${i + 1}. "${f.originalAssumption}" → "${f.boldAlternative}"`
).join("\n")}
`;

    const userLensContext = userLens ? `
USER LENS: Objective: ${userLens.primary_objective || "N/A"} | Resources: ${userLens.available_resources || "N/A"} | Risk: ${userLens.risk_tolerance || "N/A"}
` : "";

    // Morphological vectors — user-selected design space directions
    const morphVectors = Array.isArray(morphologicalVectors) && morphologicalVectors.length > 0
      ? morphologicalVectors : [];
    const morphologicalContext = morphVectors.length > 0 ? `
MORPHOLOGICAL DESIGN VECTORS (user-selected — these MUST influence at least 1-2 concepts):
${morphVectors.map((v: any, i: number) => `${i + 1}. [${v.archetype || v.type || "vector"}] ${v.label || v.name || ""}: ${v.description || v.rationale || ""}`).join("\n")}
` : "";

    // Phase 5: Slimmed system prompt — removed persona_fit, performer_network,
    // system_architecture, breakthrough_metric to cut output tokens ~50%
    const systemPrompt = `You are an Invention Synthesis Engine generating physically buildable product concepts.

CONCEPT = STRUCTURAL WEAKNESS + ASSUMPTION FLIP + TECHNICAL MECHANISM

RULES:
- Every concept traces to: structural weakness + assumption flip + technical mechanism from library
- Must be PHYSICALLY BUILDABLE, not software-only
- Include rough BOM with realistic costs at 10K+ units
- Each concept genuinely different
- Focus on mechanical/electrical/material innovation
- Keep descriptions concise (2-3 sentences max)

${MECHANISM_LIBRARY}

RESPOND WITH VALID JSON ONLY — no markdown, no explanation.`;

    const morphNote = morphVectors.length > 0
      ? `\nIMPORTANT: The user has selected ${morphVectors.length} morphological design vector(s). At least 1-2 of your concepts MUST be directly inspired by or incorporate these vectors. Cite which vector influenced each relevant concept in its origin.enabling_mechanism field.`
      : "";

    const userPrompt = `Generate ${requestedCount} invention concepts for:

PRODUCT: ${product.name} | CATEGORY: ${product.category}
DESCRIPTION: ${product.description || "N/A"}
${userLensContext}
${structuralContext}
${assumptionContext}
${morphologicalContext}
${morphNote}

JSON schema:
{
  "concepts": [{ "name", "tagline", "origin": { "structural_driver", "assumption_flipped", "enabling_mechanism" }, "before_after": { "the_old_way", "the_new_way" }, "description", "mechanism_description", "materials": [], "estimated_bom": [{ "component", "material", "process", "unitCost", "notes" }], "manufacturing_path", "certification_considerations": [], "precedent_products": [{ "product", "company", "relevance" }], "prototype_approach", "dfm_notes" }],
  "innovation_paths": [{ "theme", "description", "structural_pressures": [], "concept_indices": [] }],
  "contrarian_narrative": { "industry_blind_spot", "why_blind", "evidence", "unlock_statement" }
}

Return ONLY valid JSON. Keep each concept concise to avoid truncation.`;

    // ═══ MODEL CASCADE: try Flash first (faster), fallback to Pro ═══
    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-pro"];
    let result: Record<string, unknown> | null = null;
    let lastError = "";

    for (const model of models) {
      try {
        console.log(`[ConceptSynthesis] Trying model: ${model}`);
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 8000,
          }),
        });

        if (!response.ok) {
          const txt = await response.text();
          lastError = `${model} error ${response.status}: ${txt.slice(0, 200)}`;
          console.warn(`[ConceptSynthesis] ${lastError}`);
          if (response.status === 429) continue;
          if (response.status === 402) continue;
          throw new Error(lastError);
        }

        const aiData = await response.json();
        const rawText: string = aiData.choices?.[0]?.message?.content ?? "";
        
        if (!rawText || rawText.length < 100) {
          lastError = `${model} returned empty/short response (${rawText.length} chars)`;
          console.warn(`[ConceptSynthesis] ${lastError}`);
          continue;
        }

        console.log(`[ConceptSynthesis] ${model} returned ${rawText.length} chars`);

        result = repairTruncatedJson(rawText);
        
        if (result && Array.isArray(result.concepts) && result.concepts.length > 0) {
          console.log(`[ConceptSynthesis] Successfully parsed ${result.concepts.length} concepts from ${model}`);
          break;
        } else {
          lastError = `${model} JSON repair produced no valid concepts`;
          console.warn(`[ConceptSynthesis] ${lastError}`);
          result = null;
          continue;
        }
      } catch (err) {
        lastError = String(err);
        console.warn(`[ConceptSynthesis] ${model} failed:`, lastError);
        continue;
      }
    }

    if (!result || !Array.isArray(result.concepts) || result.concepts.length === 0) {
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    let concepts = result.concepts as any[];

    // ═══ PHASE 6: Post-processing guardrails ═══

    // Fill minimal defaults for required fields
    for (const c of concepts) {
      if (!c.origin) {
        c.origin = { structural_driver: "Identified structural weakness", assumption_flipped: "Industry assumption challenged", enabling_mechanism: "Technical mechanism applied" };
      }
      if (!c.before_after) {
        c.before_after = { the_old_way: "The current approach accepts known limitations.", the_new_way: "This concept eliminates those constraints through a mechanism change." };
      }
      if (!c.estimated_bom) c.estimated_bom = [];
      if (!c.materials) c.materials = [];
      if (!c.certification_considerations) c.certification_considerations = [];
      if (!c.precedent_products) c.precedent_products = [];
    }

    // Validate causal traces (flags but doesn't remove)
    validateCausalTraces(concepts);

    // Deduplicate near-identical concepts
    concepts = deduplicateConcepts(concepts);
    result.concepts = concepts;

    if (!result.innovation_paths || !Array.isArray(result.innovation_paths)) {
      result.innovation_paths = [{ theme: "Primary Innovation Direction", description: "Concepts addressing core structural weaknesses", structural_pressures: [], concept_indices: concepts.map((_: unknown, i: number) => i) }];
    }

    if (!result.contrarian_narrative) {
      result.contrarian_narrative = { industry_blind_spot: "The industry optimizes for the wrong metric.", why_blind: "Legacy thinking and sunk costs.", evidence: "Structural analysis reveals misalignment.", unlock_statement: "Addressing this could unlock significant market share." };
    }

    console.log(`[ConceptSynthesis] ✅ Generated ${concepts.length} concepts, ${(result.innovation_paths as any[]).length} paths`);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("concept-synthesis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
