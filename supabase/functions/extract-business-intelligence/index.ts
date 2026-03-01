import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACTION_SCHEMA = `{
  "business_overview": {
    "company_name": "string | null",
    "industry": "string | null",
    "primary_offering": "string",
    "target_customers": ["string"],
    "value_proposition": "string",
    "confidence": "high | medium | low"
  },
  "value_creation_system": {
    "inputs": ["string"],
    "core_activities": ["string"],
    "outputs": ["string"],
    "delivery_channels": ["string"],
    "evidence": ["string — direct quotes or paraphrases from the source"]
  },
  "revenue_engine": {
    "revenue_sources": ["string"],
    "pricing_model": ["string"],
    "cost_drivers": ["string"],
    "margin_levers": ["string"],
    "evidence": ["string"]
  },
  "operating_model": {
    "workflow_stages": [
      {
        "stage": "string",
        "purpose": "string",
        "dependencies": ["string"],
        "risks": ["string"]
      }
    ],
    "key_resources": ["string"],
    "partners": ["string"],
    "evidence": ["string"]
  },
  "constraints": [
    {
      "constraint": "string",
      "type": "operational | market | financial | technical",
      "causes": ["string"],
      "effects": ["string"],
      "evidence": ["string"],
      "confidence": "high | medium | low"
    }
  ],
  "signals_for_visualization": {
    "primary_system_nodes": ["string"],
    "causal_relationships": [
      {
        "from": "string",
        "to": "string",
        "relationship": "drives | limits | enables | depends_on"
      }
    ],
    "candidate_leverage_points": ["string"]
  },
  "missing_critical_information": ["string"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentTexts, imageUrls, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if ((!documentTexts || documentTexts.length === 0) && (!imageUrls || imageUrls.length === 0)) {
      return new Response(JSON.stringify({ error: "No documents or images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a Business Intelligence Extraction Engine.

You convert unstructured documents and images into structured system intelligence
that can power constraint maps, causal diagrams, and action planning.

You do NOT summarize documents. You reconstruct how the business actually works.

PROCESSING RULES:
1. READ EVERYTHING — Extract text, tables, captions, slide titles, chart labels, and visible relationships.
2. NORMALIZE INFORMATION — Convert narrative descriptions into structured business components.
3. IDENTIFY STRUCTURE, NOT TOPICS — Focus on: flows, dependencies, bottlenecks, incentives, constraints, leverage points.
4. PRESERVE EVIDENCE — Attach source snippets supporting each major claim.
5. DO NOT GENERATE STRATEGY — Only extract how the system currently operates.

IMAGE INTERPRETATION RULES:
If images contain:
• charts → extract variables, direction, trend meaning
• diagrams → extract nodes and relationships
• product photos → infer function and user interaction
• process visuals → extract flow steps
• org charts → extract structure and dependencies
Convert visual relationships into causal relationships.

EVIDENCE STANDARD:
Every constraint and system claim must include at least one supporting snippet from the document or image interpretation.
If no evidence exists: mark confidence = low.

FAILSAFE BEHAVIOR:
If input quality is poor: extract what is knowable, list missing critical information, do NOT hallucinate structure.

Return ONLY valid JSON matching this schema:
${EXTRACTION_SCHEMA}`;

    // Build multimodal content parts
    const contentParts: any[] = [];

    // Add context if provided
    if (context) {
      contentParts.push({
        type: "text",
        text: `CONTEXT: ${context}`,
      });
    }

    // Add document texts
    if (documentTexts && documentTexts.length > 0) {
      for (let i = 0; i < documentTexts.length; i++) {
        const doc = documentTexts[i];
        contentParts.push({
          type: "text",
          text: `--- DOCUMENT ${i + 1}: ${doc.name || "Untitled"} ---\n${doc.content}`,
        });
      }
    }

    // Add images as URLs for vision
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url },
        });
      }
    }

    contentParts.push({
      type: "text",
      text: "Extract the complete business intelligence from all provided documents and images. Return ONLY the JSON object.",
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentParts },
        ],
        temperature: 0.3,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${txt}`);
    }

    const aiData = await response.json();
    const rawText: string = aiData.choices?.[0]?.message?.content ?? "";

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let extraction;
    try {
      extraction = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      console.error("Raw content (first 500):", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    return new Response(JSON.stringify({ success: true, extraction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-business-intelligence error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
