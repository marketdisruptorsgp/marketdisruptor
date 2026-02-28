import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-analytics-token",
};

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = req.headers.get("x-analytics-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const tokenHash = await hashToken(token);
  const { data: tokenRow } = await supabase.from("analytics_admin_tokens").select("id").eq("token_hash", tokenHash).maybeSingle();
  if (!tokenRow) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 403, headers: corsHeaders });
  }

  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 7 * 86400000).toISOString();

  try {
    // Fetch data
    const [sessionsRes, eventsRes] = await Promise.all([
      supabase.from("analytics_sessions").select("*").gte("started_at", periodStart).limit(1000),
      supabase.from("analytics_events").select("*").gte("timestamp", periodStart).limit(10000),
    ]);

    const sessions = sessionsRes.data || [];
    const events = eventsRes.data || [];

    const insights: { insight_type: string; payload: Record<string, unknown>; period_start: string; period_end: string }[] = [];

    // 1. Section engagement ranking
    const sectionStats: Record<string, { views: number; clicks: number; timeSum: number; scrollSum: number }> = {};
    events.forEach(e => {
      if (!e.section_id) return;
      if (!sectionStats[e.section_id]) sectionStats[e.section_id] = { views: 0, clicks: 0, timeSum: 0, scrollSum: 0 };
      const s = sectionStats[e.section_id];
      if (e.event_type === "view") s.views++;
      if (e.event_type === "click") s.clicks++;
      if (e.time_on_section_ms) s.timeSum += e.time_on_section_ms;
      if (e.scroll_percent) s.scrollSum += e.scroll_percent;
    });

    const sectionRanking = Object.entries(sectionStats)
      .map(([id, s]) => ({
        section: id,
        engagementScore: s.views ? +((s.clicks / s.views) * 100).toFixed(1) : 0,
        avgTimeMs: s.views ? Math.round(s.timeSum / s.views) : 0,
        avgScroll: s.views ? Math.round(s.scrollSum / s.views) : 0,
        views: s.views,
        clicks: s.clicks,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);

    insights.push({ insight_type: "section_ranking", payload: { sections: sectionRanking }, period_start: periodStart, period_end: periodEnd });

    // 2. Friction zones
    const frictionEvents = events.filter(e => ["rage_click", "dead_click", "hesitation", "abandon"].includes(e.event_type));
    const frictionByZone: Record<string, number> = {};
    frictionEvents.forEach(e => {
      const zone = e.section_id || e.page_path || "unknown";
      frictionByZone[zone] = (frictionByZone[zone] || 0) + 1;
    });
    const topFriction = Object.entries(frictionByZone).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([zone, count]) => ({ zone, count }));
    insights.push({ insight_type: "friction_zone", payload: { zones: topFriction }, period_start: periodStart, period_end: periodEnd });

    // 3. Device comparison
    const deviceStats: Record<string, { count: number; avgDuration: number; durationSum: number; avgPages: number; pagesSum: number }> = {};
    sessions.forEach(s => {
      const dt = s.device_type || "unknown";
      if (!deviceStats[dt]) deviceStats[dt] = { count: 0, avgDuration: 0, durationSum: 0, avgPages: 0, pagesSum: 0 };
      deviceStats[dt].count++;
      deviceStats[dt].durationSum += s.total_duration_ms || 0;
      deviceStats[dt].pagesSum += s.page_count || 1;
    });
    Object.values(deviceStats).forEach(d => {
      d.avgDuration = d.count ? Math.round(d.durationSum / d.count) : 0;
      d.avgPages = d.count ? +(d.pagesSum / d.count).toFixed(1) : 0;
    });
    insights.push({ insight_type: "device_comparison", payload: deviceStats, period_start: periodStart, period_end: periodEnd });

    // 4. UX recommendations
    const recommendations: string[] = [];
    topFriction.forEach(f => {
      if (f.count > 5) recommendations.push(`High friction detected in "${f.zone}" (${f.count} friction events). Review for confusing UI elements or broken interactions.`);
    });
    sectionRanking.forEach(s => {
      if (s.avgScroll > 60 && s.clicks === 0) recommendations.push(`"${s.section}" has high scroll depth (${s.avgScroll}%) but zero clicks. Consider adding clearer CTAs.`);
    });
    if (sessions.filter(s => s.is_returning).length / (sessions.length || 1) < 0.15) {
      recommendations.push("Returning visitor rate is below 15%. Consider implementing engagement hooks or email capture.");
    }
    insights.push({ insight_type: "ux_recommendation", payload: { recommendations }, period_start: periodStart, period_end: periodEnd });

    // Save insights
    for (const insight of insights) {
      await supabase.from("analytics_insights").insert({
        insight_type: insight.insight_type,
        payload: insight.payload,
        computed_at: now.toISOString(),
        period_start: insight.period_start,
        period_end: insight.period_end,
      });
    }

    return new Response(JSON.stringify({ ok: true, insightsComputed: insights.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Compute error:", err);
    return new Response(JSON.stringify({ error: "Compute failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
