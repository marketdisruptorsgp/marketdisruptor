import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Aggregate real platform usage data from saved_analyses
    const { data: analyses, error: analysisError } = await supabase
      .from("saved_analyses")
      .select("category, analysis_type, avg_revival_score, product_count, created_at");

    if (analysisError) throw new Error(`Query failed: ${analysisError.message}`);

    // Category breakdown
    const categoryMap: Record<string, { count: number; avgScore: number; scores: number[] }> = {};
    const typeMap: Record<string, number> = {};
    const monthlyMap: Record<string, number> = {};

    for (const a of analyses || []) {
      // Category stats
      const cat = a.category || "Uncategorized";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, avgScore: 0, scores: [] };
      categoryMap[cat].count++;
      if (a.avg_revival_score) categoryMap[cat].scores.push(a.avg_revival_score);

      // Analysis type breakdown
      const type = a.analysis_type || "product";
      typeMap[type] = (typeMap[type] || 0) + 1;

      // Monthly activity
      const month = a.created_at?.substring(0, 7) || "unknown";
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    }

    // Compute averages
    for (const cat of Object.keys(categoryMap)) {
      const scores = categoryMap[cat].scores;
      categoryMap[cat].avgScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    }

    // Sort categories by count
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data]) => ({ name, count: data.count, avgScore: data.avgScore }));

    // Monthly activity sorted chronologically
    const monthlyActivity = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    const totalAnalyses = analyses?.length || 0;
    const avgScore = analyses && analyses.length > 0
      ? Math.round((analyses.filter(a => a.avg_revival_score).reduce((sum, a) => sum + (a.avg_revival_score || 0), 0) / analyses.filter(a => a.avg_revival_score).length) * 10) / 10
      : 0;

    // Clear and insert
    await supabase.from("platform_intel").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase.from("platform_intel").insert([
      {
        metric_type: "overview",
        payload: { totalAnalyses, avgScore, typeBreakdown: typeMap },
        computed_at: new Date().toISOString(),
      },
      {
        metric_type: "top_categories",
        payload: topCategories,
        computed_at: new Date().toISOString(),
      },
      {
        metric_type: "monthly_activity",
        payload: monthlyActivity,
        computed_at: new Date().toISOString(),
      },
    ]);

    return new Response(JSON.stringify({ success: true, totalAnalyses, categories: topCategories.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Platform intel error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
