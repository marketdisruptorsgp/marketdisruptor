import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });
  if (!res.ok) throw new Error(`AI call failed [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

function parseJSON(raw: string): any {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Run all 4 AI calls in parallel
    const [trendRaw, signalRaw, radarRaw, heatRaw] = await Promise.all([
      callAI(LOVABLE_API_KEY, `You are a market intelligence analyst. Generate exactly 6 trend spotlights for today's market intelligence dashboard.

Return ONLY a valid JSON array:
[{"name":"Product/Service Name","momentum":"+XXX%","period":"12mo search growth","score":8.5,"category":"Category Name","insight":"2-3 sentences with specific data","trend_data":[40,45,48,52,60,68,75,82,90,95,98,100]}]

Categories: Consumer Electronics, EdTech, Health & Wellness, Sustainable Fashion, Pet Care, Micro-SaaS. Score range: 6.0-9.5. Momentum: +80% to +400%. trend_data = 12 monthly points normalized 0-100.`),

      callAI(LOVABLE_API_KEY, `Generate exactly 6 disruption signals — market shifts happening now.

Return ONLY a valid JSON array:
[{"label":"Signal Title","desc":"2-3 sentences with data","time":"X days ago","severity":"high","category":"patent"}]

Mix severities: 2 high, 2 medium, 2 low. Categories: patent, supply_chain, viral, price, community, regulation.`),

      callAI(LOVABLE_API_KEY, `Generate category comparison radar chart data.

Return ONLY valid JSON:
{"categories":["DTC Skincare","Micro-SaaS","Pet Supplements","EdTech","Sustainable Fashion","Fitness Tech"],"dimensions":["Demand","Competition","Supply Chain","Margin","Growth Rate","Entry Barrier"],"data":[{"category":"DTC Skincare","Demand":85,"Competition":70,"Supply Chain":90,"Margin":75,"Growth Rate":60,"Entry Barrier":30}]}

All 6 categories with all 6 dimensions. Values 0-100.`),

      callAI(LOVABLE_API_KEY, `Generate disruption opportunity heat map data.

Return ONLY valid JSON:
{"rows":[{"category":"Consumer Electronics","demand":85,"competition":65,"supply":90,"growth":78,"opportunity":82}]}

Generate exactly 8 categories: Consumer Electronics, EdTech, Health & Wellness, Sustainable Fashion, Pet Care, Micro-SaaS, Food & Beverage, Fitness Tech. Values 0-100.`),
    ]);

    let trendData, signalData, radarData, heatData;
    try { trendData = parseJSON(trendRaw); if (!Array.isArray(trendData)) trendData = trendData.trends || trendData.spotlights || trendData.data || []; } catch { trendData = []; }
    try { signalData = parseJSON(signalRaw); if (!Array.isArray(signalData)) signalData = signalData.signals || signalData.data || []; } catch { signalData = []; }
    try { radarData = parseJSON(radarRaw); } catch { radarData = {}; }
    try { heatData = parseJSON(heatRaw); } catch { heatData = {}; }

    const now = new Date().toISOString();
    await supabase.from("market_intel").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("market_intel").insert([
      { data_type: "trend_spotlights", payload: trendData, generated_at: now },
      { data_type: "disruption_signals", payload: signalData, generated_at: now },
      { data_type: "radar_data", payload: radarData, generated_at: now },
      { data_type: "heat_map", payload: heatData, generated_at: now },
    ]);
    if (error) throw new Error(`Insert failed: ${error.message}`);

    return new Response(JSON.stringify({ success: true, generated: 4 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market intel error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
