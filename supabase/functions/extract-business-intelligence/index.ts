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
      "constraint": "string — ONLY structural bottlenecks, limitations, and problems that cap growth or create risk",
      "type": "operational | market | financial | technical",
      "causes": ["string"],
      "effects": ["string — the negative business impact of this constraint"],
      "evidence": ["string"],
      "confidence": "high | medium | low"
    }
  ],
  "opportunities": [
    {
      "opportunity": "string — untapped capacity, growth runway, expansion potential, or underutilized assets",
      "type": "capacity | market | operational | financial",
      "enablers": ["string — what makes this opportunity possible"],
      "potential_impact": ["string — the upside if captured"],
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
    const { documentTexts, imageUrls, context, lensType } = await req.json();
    const isETA = lensType === "eta";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if ((!documentTexts || documentTexts.length === 0) && (!imageUrls || imageUrls.length === 0)) {
      return new Response(JSON.stringify({ error: "No documents or images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const etaSchemaBlock = isETA ? `,
  "eta_assessment": {
    "financial_snapshot": {
      "sde": "number | null — Seller's Discretionary Earnings",
      "revenue": "number | null",
      "cogs": "number | null",
      "gross_margin_pct": "number | null",
      "claimed_addbacks": [{"item": "string", "amount": "number | null", "confidence": "high|medium|low", "flag": "optional string — red flag note if addback seems inflated"}],
      "missing_financials": ["string — financial data not disclosed"]
    },
    "owner_dependency_score": "number 1-10 (10 = fully owner-dependent)",
    "owner_dependencies": [{"area": "string", "severity": "critical|high|medium|low", "description": "string", "mitigation": "string — specific action to de-risk"}],
    "customer_concentration": {
      "top_1_pct": "number | null — % revenue from largest customer",
      "top_3_pct": "number | null",
      "top_5_pct": "number | null",
      "risk_level": "critical|high|medium|low",
      "detail": "string"
    },
    "employee_risk": {
      "key_person_risks": ["string"],
      "management_depth": "string",
      "institutional_knowledge_gaps": ["string"]
    },
    "due_diligence_questions": ["string — questions the CIM didn't answer that buyers must ask"]
  }` : "";

    const systemPrompt = `You are a Business Intelligence Extraction Engine.
${isETA ? `\nYou are operating in ETA (Entrepreneur Through Acquisition) mode. The uploaded documents are likely CIMs (Confidential Information Memorandums) for a business acquisition.

ADDITIONAL ETA-SPECIFIC RULES:
1. EXTRACT FINANCIALS: Look for SDE, EBITDA, revenue, COGS, addbacks. CIMs hide poor metrics — flag missing numbers.
2. ADDBACK SKEPTICISM: Broker-prepared CIMs inflate addbacks. Flag each addback with confidence level. Common inflations: above-market owner salary, one-time expenses that recur, personal expenses that are actually business costs.
3. OWNER DEPENDENCY: Count how many relationships, processes, and decisions go through the owner. This is the #1 deal killer.
4. CUSTOMER CONCENTRATION: If >25% revenue from one customer, flag as critical. If >50% from top 3, flag as high.
5. EMPLOYEE RISK: Look for key-person dependencies, thin management layers, and institutional knowledge gaps.
6. DUE DILIGENCE GAPS: List 5-10 questions the CIM should answer but didn't.
` : ""}

You convert unstructured documents and images into structured system intelligence
...
${EXTRACTION_SCHEMA}${etaSchemaBlock}
}`;
    // Build multimodal content parts
    const contentParts: any[] = [];

    // Add context if provided
    if (context) {
      contentParts.push({
        type: "text",
        text: `CONTEXT: ${context}`,
      });
    }

    // Add document texts — detect base64 data URIs and send as inline_data for vision
    if (documentTexts && documentTexts.length > 0) {
      for (let i = 0; i < documentTexts.length; i++) {
        const doc = documentTexts[i];
        const content: string = doc.content || "";

        // Check if it's a data URI (base64-encoded file)
        const dataUriMatch = content.match(/^data:([^;]+);base64,(.+)$/s);
        if (dataUriMatch) {
          const mimeType = dataUriMatch[1];
          const base64Data = dataUriMatch[2];

          // For PDFs, images, etc. — send as inline_data for Gemini vision
          contentParts.push({
            type: "text",
            text: `--- DOCUMENT ${i + 1}: ${doc.name || "Untitled"} (${mimeType}) ---`,
          });
          contentParts.push({
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          });
        } else {
          // Plain text content
          contentParts.push({
            type: "text",
            text: `--- DOCUMENT ${i + 1}: ${doc.name || "Untitled"} ---\n${content}`,
          });
        }
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

    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 150_000); // 2.5 min

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: fetchController.signal,
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
    } catch (fetchErr) {
      clearTimeout(fetchTimeout);
      const msg = String(fetchErr);
      if (msg.includes("abort")) {
        throw new Error("AI processing timed out (>2.5 min). Try a smaller document.");
      }
      throw new Error(`AI gateway connection failed: ${msg}`);
    } finally {
      clearTimeout(fetchTimeout);
    }

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

    // Read response body defensively — connection can drop mid-stream
    let rawResponseText: string;
    try {
      rawResponseText = await response.text();
    } catch (bodyErr) {
      console.error("Failed to read AI response body:", bodyErr);
      throw new Error("AI response was interrupted. Please retry with a smaller document.");
    }

    let aiData: any;
    try {
      aiData = JSON.parse(rawResponseText);
    } catch (parseErr) {
      console.error("AI response not valid JSON (first 300):", rawResponseText.slice(0, 300));
      throw new Error("AI returned a malformed response. Please retry.");
    }
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
      // Attempt JSON repair: balance unclosed braces/brackets
      let repaired = cleaned;
      let openBraces = (repaired.match(/{/g) || []).length;
      let closeBraces = (repaired.match(/}/g) || []).length;
      let openBrackets = (repaired.match(/\[/g) || []).length;
      let closeBrackets = (repaired.match(/\]/g) || []).length;
      // Remove trailing comma before closing
      repaired = repaired.replace(/,\s*$/, "");
      while (openBrackets > closeBrackets) { repaired += "]"; closeBrackets++; }
      while (openBraces > closeBraces) { repaired += "}"; closeBraces++; }
      try {
        extraction = JSON.parse(repaired);
        console.warn("JSON repaired successfully (balanced braces)");
      } catch (repairErr) {
        console.error("JSON parse failed after repair:", repairErr);
        console.error("Raw content (first 500):", cleaned.slice(0, 500));
        throw new Error("AI returned invalid JSON. Please retry.");
      }
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
