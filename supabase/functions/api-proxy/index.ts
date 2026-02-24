import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");

    // Hash the provided key
    const msgBuffer = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Look up key in database using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: keyRow, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id")
      .eq("key_hash", keyHash)
      .is("revoked_at", null)
      .single();

    if (keyError || !keyRow) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update last_used_at (best effort)
    supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id).then(() => {});

    const userId = keyRow.user_id;
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let responseData: unknown;

    switch (resource) {
      case "analyses": {
        const { data, count } = await supabaseAdmin
          .from("saved_analyses")
          .select("id, title, category, era, analysis_type, avg_revival_score, product_count, created_at, updated_at", { count: "exact" })
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        responseData = { data, count, limit, offset };
        break;
      }
      case "patents": {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data, count } = await supabaseAdmin
          .from("patent_filings")
          .select("id, title, category, assignee, filing_date, patent_number, status, abstract", { count: "exact" })
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        responseData = { data, count, limit, offset };
        break;
      }
      case "news": {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data, count } = await supabaseAdmin
          .from("market_news")
          .select("id, title, category, source_name, source_url, summary, published_at", { count: "exact" })
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        responseData = { data, count, limit, offset };
        break;
      }
      case "portfolio": {
        const { data: analyses } = await supabaseAdmin
          .from("saved_analyses")
          .select("avg_revival_score, category, created_at")
          .eq("user_id", userId);

        const total = analyses?.length || 0;
        const avgScore = total > 0 ? Math.round((analyses!.reduce((a, b) => a + (b.avg_revival_score || 0), 0) / total) * 10) / 10 : 0;
        const categories: Record<string, number> = {};
        const now = new Date();
        let thisMonth = 0;
        for (const a of analyses || []) {
          categories[a.category] = (categories[a.category] || 0) + 1;
          if (new Date(a.created_at).getMonth() === now.getMonth() && new Date(a.created_at).getFullYear() === now.getFullYear()) thisMonth++;
        }
        const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
        responseData = { data: { total_analyses: total, avg_score: avgScore, top_category: topCategory, analyses_this_month: thisMonth, category_breakdown: categories } };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid resource. Use: analyses, patents, news, portfolio" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("api-proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
