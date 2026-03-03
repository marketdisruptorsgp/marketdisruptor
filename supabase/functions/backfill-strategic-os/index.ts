import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function truncateJSON(obj: unknown, maxLen = 3000): string {
  const s = JSON.stringify(obj);
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

function hasRootHypotheses(analysisData: any): boolean {
  if (!analysisData || typeof analysisData !== "object") return false;
  const governed = analysisData.governed;
  if (!governed) return false;
  if (Array.isArray(governed.root_hypotheses) && governed.root_hypotheses.length > 0) return true;
  if (governed.constraint_map?.root_hypotheses?.length > 0) return true;
  return false;
}

async function generateHypotheses(apiKey: string, analysis: any): Promise<any[]> {
  const dataSnapshot = truncateJSON(analysis.analysis_data, 5000);
  const productsSnapshot = truncateJSON(analysis.products, 1500);

  const prompt = `You are a structural constraint analyst. Given an existing analysis, extract 2-4 Tier 1 structural constraint hypotheses that represent the most fundamental forces shaping this domain.

ANALYSIS CONTEXT:
- Title: ${analysis.title || "Untitled"}
- Mode: ${analysis.analysis_type || "product"}
- Category: ${analysis.category || "Unknown"}
- Average Score: ${analysis.avg_revival_score ?? "N/A"}

ANALYSIS DATA (truncated):
${dataSnapshot}

PRODUCTS (truncated):
${productsSnapshot}

Return ONLY a valid JSON array of 2-4 hypothesis objects. Each must have:
{
  "id": "h_<short_snake_case_id>",
  "constraint_type": "cost|reliability|adoption|scale|speed|defensibility|risk|time|physical|structural|economic",
  "hypothesis_statement": "One sentence stating the core structural constraint",
  "causal_chain": [
    {
      "friction_id": "f_<id>",
      "structural_constraint": "The specific friction point",
      "system_impact": "How it impacts the system",
      "impact_dimension": "revenue|cost|adoption|retention|growth"
    }
  ],
  "friction_sources": ["source1", "source2"],
  "leverage_score": 7,
  "impact_score": 8,
  "evidence_mix": { "verified": 0.3, "modeled": 0.5, "assumption": 0.2 },
  "fragility_score": 4,
  "confidence": 65,
  "downstream_implications": "What this means for strategy"
}

RULES:
- Be SPECIFIC to this analysis — reference actual products, scores, categories.
- leverage_score and impact_score: integers 1-10.
- fragility_score: integer 1-10 (higher = more fragile).
- confidence: integer 0-100.
- evidence_mix values must sum to 1.0.
- Order by estimated dominance (most dominant first).
- Each hypothesis must represent a STRUCTURALLY DISTINCT constraint — no overlapping.`;

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2500,
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
    const singleAnalysisId = body.singleAnalysisId;
    const batchSize = body.batchSize || 10;
    const offset = body.offset || 0;
    const dryRun = body.dryRun || false;

    // Single-analysis mode: backfill one specific analysis and return hypotheses
    if (singleAnalysisId) {
      const { data: analysis, error: fetchErr } = await supabase
        .from("saved_analyses")
        .select("id, title, category, analysis_type, avg_revival_score, era, audience, analysis_data, products")
        .eq("id", singleAnalysisId)
        .single();

      if (fetchErr || !analysis) {
        return new Response(JSON.stringify({ error: "Analysis not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (hasRootHypotheses(analysis.analysis_data)) {
        const gov = (analysis.analysis_data as any)?.governed || {};
        const existing = gov.root_hypotheses || gov.constraint_map?.root_hypotheses || [];
        return new Response(JSON.stringify({ hypotheses: existing, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hypotheses = await generateHypotheses(LOVABLE_API_KEY, analysis);
      const existingData = (analysis.analysis_data as Record<string, any>) || {};
      const governed = existingData.governed || {};
      governed.root_hypotheses = hypotheses;
      if (governed.constraint_map) governed.constraint_map.root_hypotheses = hypotheses;
      existingData.governed = governed;

      await supabase.from("saved_analyses").update({ analysis_data: existingData }).eq("id", singleAnalysisId);

      return new Response(JSON.stringify({ hypotheses, backfilled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const needsBackfill = analyses.filter((a: any) => !hasRootHypotheses(a.analysis_data));

    if (needsBackfill.length === 0) {
      return new Response(JSON.stringify({
        done: false,
        message: `Batch ${offset}-${offset + batchSize - 1}: all ${analyses.length} already have root_hypotheses`,
        processed: 0,
        skipped: analyses.length,
        nextOffset: offset + batchSize,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: { id: string; title: string; status: string }[] = [];

    for (const analysis of needsBackfill) {
      try {
        const hypotheses = await generateHypotheses(LOVABLE_API_KEY, analysis);

        if (dryRun) {
          results.push({ id: analysis.id, title: analysis.title, status: `dry_run_ok (${hypotheses.length} hypotheses)` });
          continue;
        }

        const existingData = (analysis.analysis_data as Record<string, any>) || {};
        const governed = existingData.governed || {};
        governed.root_hypotheses = hypotheses;
        if (governed.constraint_map) {
          governed.constraint_map.root_hypotheses = hypotheses;
        }
        existingData.governed = governed;

        const { error: updateError } = await supabase
          .from("saved_analyses")
          .update({ analysis_data: existingData })
          .eq("id", analysis.id);

        if (updateError) {
          results.push({ id: analysis.id, title: analysis.title, status: `error: ${updateError.message}` });
        } else {
          results.push({ id: analysis.id, title: analysis.title, status: `backfilled (${hypotheses.length} hypotheses)` });
        }
      } catch (err) {
        results.push({ id: analysis.id, title: analysis.title, status: `error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    return new Response(JSON.stringify({
      done: false,
      processed: results.filter(r => r.status.startsWith("backfilled") || r.status.startsWith("dry_run")).length,
      errors: results.filter(r => r.status.startsWith("error")).length,
      skipped: analyses.length - needsBackfill.length,
      nextOffset: offset + batchSize,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("backfill-strategic-os error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
