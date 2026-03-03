import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ReasoningSynopsis {
  problem_framing: { objective_interpretation: string; success_criteria: string[] };
  lens_influence: { lens_name: string; prioritized_factors: string[]; deprioritized_factors: string[]; alternative_lens_impact: string };
  evaluation_path: { dimensions_examined: string[]; evaluation_logic: string };
  core_causal_logic: { primary_relationships: { cause: string; effect: string; mechanism: string }[]; dominant_mechanism: string };
  decision_drivers: { factor: string; weight: string; rationale: string }[];
  confidence_sensitivity: { overall_confidence: string; confidence_score: number; most_sensitive_variable: string; sensitivity_explanation: string };
}

function truncateJSON(obj: any, maxLen = 3000): string {
  const s = JSON.stringify(obj);
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

function hasReasoningSynopsis(analysisData: any): boolean {
  if (!analysisData || typeof analysisData !== "object") return false;
  // Check top-level governed
  if (analysisData.governed?.reasoning_synopsis) return true;
  // Check if any step has it
  for (const key of Object.keys(analysisData)) {
    const val = analysisData[key];
    if (val && typeof val === "object") {
      if (val.reasoning_synopsis) return true;
      if (val.governed?.reasoning_synopsis) return true;
    }
  }
  return false;
}

async function generateSynopsis(apiKey: string, analysis: any): Promise<ReasoningSynopsis> {
  const mode = analysis.analysis_type || "product";
  const category = analysis.category || "Unknown";
  const title = analysis.title || "Untitled";
  const score = analysis.avg_revival_score;
  const dataSnapshot = truncateJSON(analysis.analysis_data, 4000);
  const productsSnapshot = truncateJSON(analysis.products, 1500);

  const prompt = `You are a reasoning auditor. Given an existing analysis, reconstruct the reasoning synopsis that explains HOW the conclusions were reached.

ANALYSIS CONTEXT:
- Title: ${title}
- Mode: ${mode}
- Category: ${category}
- Average Score: ${score ?? "N/A"}
- Era: ${analysis.era}
- Audience: ${analysis.audience}

ANALYSIS DATA (truncated):
${dataSnapshot}

PRODUCTS (truncated):
${productsSnapshot}

Generate a reasoning_synopsis object that reconstructs the analytical reasoning. Be specific to THIS analysis — reference actual data points, scores, and findings.

Return ONLY valid JSON matching this exact structure:
{
  "problem_framing": {
    "objective_interpretation": "How the core objective was interpreted for this ${mode} analysis",
    "success_criteria": ["criterion1", "criterion2", "criterion3"]
  },
  "lens_influence": {
    "lens_name": "Default",
    "prioritized_factors": ["factor1", "factor2"],
    "deprioritized_factors": ["factor1", "factor2"],
    "alternative_lens_impact": "How conclusion might differ under a risk-averse or growth-focused lens"
  },
  "evaluation_path": {
    "dimensions_examined": ["dimension1", "dimension2", "dimension3"],
    "evaluation_logic": "Order and rationale for evaluation sequence"
  },
  "core_causal_logic": {
    "primary_relationships": [
      {"cause": "observed factor", "effect": "resulting outcome", "mechanism": "how cause produces effect"}
    ],
    "dominant_mechanism": "The single most explanatory causal pathway"
  },
  "decision_drivers": [
    {"factor": "most influential observation", "weight": "high", "rationale": "why this outweighed alternatives"}
  ],
  "confidence_sensitivity": {
    "overall_confidence": "high|medium|low",
    "confidence_score": 65,
    "most_sensitive_variable": "assumption most likely to change outcome",
    "sensitivity_explanation": "how conclusion changes if this variable differs"
  }
}

RULES:
- Be SPECIFIC to this analysis. Reference actual product names, scores, categories.
- Keep concise — max 200 words total.
- Decision drivers: 2-4 factors max.
- confidence_score: integer 0-100.`;

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`AI call failed [${res.status}]`);
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content || "";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 10;
    const offset = body.offset || 0;
    const dryRun = body.dryRun || false;

    // Fetch analyses that need backfill
    const { data: analyses, error: fetchError } = await supabase
      .from("saved_analyses")
      .select("id, title, category, analysis_type, avg_revival_score, era, audience, analysis_data, products")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!analyses || analyses.length === 0) {
      return new Response(JSON.stringify({ done: true, message: "No more analyses to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to only those missing reasoning_synopsis
    const needsBackfill = analyses.filter((a: any) => !hasReasoningSynopsis(a.analysis_data));

    if (needsBackfill.length === 0) {
      return new Response(JSON.stringify({
        done: false,
        message: `Batch ${offset}-${offset + batchSize - 1}: all ${analyses.length} already have synopsis`,
        processed: 0,
        skipped: analyses.length,
        nextOffset: offset + batchSize,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: { id: string; title: string; status: string }[] = [];

    // Process sequentially to avoid rate limits
    for (const analysis of needsBackfill) {
      try {
        const synopsis = await generateSynopsis(LOVABLE_API_KEY, analysis);

        if (dryRun) {
          results.push({ id: analysis.id, title: analysis.title, status: "dry_run_ok" });
          continue;
        }

        // Merge synopsis into analysis_data.governed
        const existingData = (analysis.analysis_data as Record<string, any>) || {};
        const governed = existingData.governed || {};
        governed.reasoning_synopsis = synopsis;
        existingData.governed = governed;

        const { error: updateError } = await supabase
          .from("saved_analyses")
          .update({ analysis_data: existingData })
          .eq("id", analysis.id);

        if (updateError) {
          results.push({ id: analysis.id, title: analysis.title, status: `error: ${updateError.message}` });
        } else {
          results.push({ id: analysis.id, title: analysis.title, status: "backfilled" });
        }
      } catch (err) {
        results.push({ id: analysis.id, title: analysis.title, status: `error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    return new Response(JSON.stringify({
      done: false,
      processed: results.filter(r => r.status === "backfilled" || r.status === "dry_run_ok").length,
      errors: results.filter(r => r.status.startsWith("error")).length,
      skipped: analyses.length - needsBackfill.length,
      nextOffset: offset + batchSize,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("backfill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
