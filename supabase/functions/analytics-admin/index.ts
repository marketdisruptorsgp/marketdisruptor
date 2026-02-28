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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Auth: check x-analytics-token header
  const token = req.headers.get("x-analytics-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tokenHash = await hashToken(token);
  const { data: tokenRow } = await supabase
    .from("analytics_admin_tokens")
    .select("id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!tokenRow) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Token expired" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Update last used
  await supabase.from("analytics_admin_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tokenRow.id);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "overview";
  const days = parseInt(url.searchParams.get("days") || "7");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  try {
    if (action === "overview") {
      const [sessionsRes, eventsRes, convRes] = await Promise.all([
        supabase.from("analytics_sessions").select("id, started_at, device_type, total_duration_ms, is_returning, page_count").gte("started_at", since).order("started_at", { ascending: false }).limit(1000),
        supabase.from("analytics_events").select("event_type, section_id, page_path, timestamp").gte("timestamp", since).limit(5000),
        supabase.from("analytics_events").select("id").eq("event_type", "convert").gte("timestamp", since),
      ]);

      const sessions = sessionsRes.data || [];
      const events = eventsRes.data || [];
      const conversions = convRes.data || [];

      const totalSessions = sessions.length;
      const avgDuration = sessions.length ? Math.round(sessions.reduce((s, x) => s + (x.total_duration_ms || 0), 0) / sessions.length) : 0;
      const returningPct = sessions.length ? Math.round((sessions.filter(s => s.is_returning).length / sessions.length) * 100) : 0;
      const avgPages = sessions.length ? +(sessions.reduce((s, x) => s + (x.page_count || 1), 0) / sessions.length).toFixed(1) : 0;

      // Event type breakdown
      const eventBreakdown: Record<string, number> = {};
      events.forEach(e => { eventBreakdown[e.event_type] = (eventBreakdown[e.event_type] || 0) + 1; });

      // Sessions by day
      const byDay: Record<string, number> = {};
      sessions.forEach(s => {
        const day = s.started_at.slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
      });

      // Device breakdown
      const byDevice: Record<string, number> = {};
      sessions.forEach(s => { byDevice[s.device_type || "unknown"] = (byDevice[s.device_type || "unknown"] || 0) + 1; });

      return respond({
        totalSessions,
        totalConversions: conversions.length,
        conversionRate: totalSessions ? +(conversions.length / totalSessions * 100).toFixed(1) : 0,
        avgDuration,
        returningPct,
        avgPages,
        eventBreakdown,
        sessionsByDay: Object.entries(byDay).sort().map(([day, count]) => ({ day, count })),
        deviceBreakdown: byDevice,
      });
    }

    if (action === "sections") {
      const { data: events } = await supabase
        .from("analytics_events")
        .select("section_id, event_type, scroll_percent, time_on_section_ms")
        .not("section_id", "is", null)
        .gte("timestamp", since)
        .limit(5000);

      const sections: Record<string, { views: number; clicks: number; avgScroll: number; avgTime: number; scrollSum: number; timeSum: number; rageClicks: number; deadClicks: number }> = {};
      (events || []).forEach(e => {
        if (!e.section_id) return;
        if (!sections[e.section_id]) sections[e.section_id] = { views: 0, clicks: 0, avgScroll: 0, avgTime: 0, scrollSum: 0, timeSum: 0, rageClicks: 0, deadClicks: 0 };
        const s = sections[e.section_id];
        if (e.event_type === "view") { s.views++; }
        if (e.event_type === "click") { s.clicks++; }
        if (e.event_type === "rage_click") { s.rageClicks++; }
        if (e.event_type === "dead_click") { s.deadClicks++; }
        if (e.scroll_percent) { s.scrollSum += e.scroll_percent; }
        if (e.time_on_section_ms) { s.timeSum += e.time_on_section_ms; }
      });

      const result = Object.entries(sections).map(([id, s]) => {
        const totalInteractions = s.views + s.clicks;
        return {
          section_id: id,
          views: s.views,
          clicks: s.clicks,
          engagementScore: s.views ? +(s.clicks / s.views * 100).toFixed(1) : 0,
          avgScroll: s.views ? Math.round(s.scrollSum / s.views) : 0,
          avgTimeMs: s.views ? Math.round(s.timeSum / s.views) : 0,
          rageClicks: s.rageClicks,
          deadClicks: s.deadClicks,
          frictionScore: totalInteractions ? +((s.rageClicks + s.deadClicks) / totalInteractions * 100).toFixed(1) : 0,
        };
      }).sort((a, b) => b.views - a.views);

      return respond(result);
    }

    if (action === "funnel") {
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_type, page_path, section_id, metadata")
        .in("event_type", ["view", "focus", "click", "abandon", "convert"])
        .gte("timestamp", since)
        .limit(5000);

      const funnel: Record<string, number> = { view: 0, focus: 0, click: 0, abandon: 0, convert: 0 };
      (events || []).forEach(e => {
        if (funnel[e.event_type] !== undefined) funnel[e.event_type]++;
      });

      return respond({
        steps: [
          { name: "Page View", count: funnel.view },
          { name: "Form Focus", count: funnel.focus },
          { name: "Interaction", count: funnel.click },
          { name: "Abandon", count: funnel.abandon },
          { name: "Conversion", count: funnel.convert },
        ],
      });
    }

    if (action === "paths") {
      const { data: events } = await supabase
        .from("analytics_events")
        .select("session_id, page_path, event_type, timestamp")
        .eq("event_type", "navigation")
        .gte("timestamp", since)
        .order("timestamp", { ascending: true })
        .limit(5000);

      const sessionPaths: Record<string, string[]> = {};
      (events || []).forEach(e => {
        if (!sessionPaths[e.session_id]) sessionPaths[e.session_id] = [];
        if (e.page_path) sessionPaths[e.session_id].push(e.page_path);
      });

      const pathCounts: Record<string, number> = {};
      Object.values(sessionPaths).forEach(paths => {
        const key = paths.slice(0, 5).join(" → ");
        pathCounts[key] = (pathCounts[key] || 0) + 1;
      });

      const topPaths = Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([path, count]) => ({ path, count }));

      return respond({ topPaths, totalSessions: Object.keys(sessionPaths).length });
    }

    if (action === "heatmap") {
      const { data: clicks } = await supabase
        .from("analytics_events")
        .select("element_id, section_id, page_path, event_type, metadata")
        .in("event_type", ["click", "dead_click", "rage_click"])
        .gte("timestamp", since)
        .limit(5000);

      const elements: Record<string, { clicks: number; deadClicks: number; rageClicks: number; page: string }> = {};
      (clicks || []).forEach(e => {
        const key = e.element_id || e.section_id || "unknown";
        if (!elements[key]) elements[key] = { clicks: 0, deadClicks: 0, rageClicks: 0, page: e.page_path || "" };
        if (e.event_type === "click") elements[key].clicks++;
        if (e.event_type === "dead_click") elements[key].deadClicks++;
        if (e.event_type === "rage_click") elements[key].rageClicks++;
      });

      return respond(Object.entries(elements).map(([id, d]) => ({ element: id, ...d })).sort((a, b) => b.clicks - a.clicks).slice(0, 100));
    }

    if (action === "sessions") {
      const page = parseInt(url.searchParams.get("page") || "0");
      const { data: sessions } = await supabase
        .from("analytics_sessions")
        .select("*")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .range(page * 50, (page + 1) * 50 - 1);

      return respond(sessions || []);
    }

    if (action === "session_replay") {
      const sid = url.searchParams.get("session_id");
      if (!sid) return respond({ error: "session_id required" });

      const { data: events } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("session_id", sid)
        .order("timestamp", { ascending: true })
        .limit(2000);

      return respond(events || []);
    }

    if (action === "friction") {
      const { data: events } = await supabase
        .from("analytics_events")
        .select("section_id, page_path, event_type, time_on_section_ms, scroll_percent")
        .in("event_type", ["rage_click", "dead_click", "hesitation", "abandon"])
        .gte("timestamp", since)
        .limit(3000);

      const zones: Record<string, { rageClicks: number; deadClicks: number; hesitations: number; abandons: number; page: string }> = {};
      (events || []).forEach(e => {
        const key = e.section_id || e.page_path || "unknown";
        if (!zones[key]) zones[key] = { rageClicks: 0, deadClicks: 0, hesitations: 0, abandons: 0, page: e.page_path || "" };
        if (e.event_type === "rage_click") zones[key].rageClicks++;
        if (e.event_type === "dead_click") zones[key].deadClicks++;
        if (e.event_type === "hesitation") zones[key].hesitations++;
        if (e.event_type === "abandon") zones[key].abandons++;
      });

      const frictionZones = Object.entries(zones)
        .map(([zone, d]) => ({
          zone,
          ...d,
          frictionScore: d.rageClicks * 3 + d.deadClicks * 2 + d.hesitations + d.abandons * 2,
        }))
        .sort((a, b) => b.frictionScore - a.frictionScore)
        .slice(0, 20);

      return respond(frictionZones);
    }

    if (action === "insights") {
      const { data } = await supabase
        .from("analytics_insights")
        .select("*")
        .order("computed_at", { ascending: false })
        .limit(50);

      return respond(data || []);
    }

    return respond({ error: "Unknown action" });
  } catch (err) {
    console.error("Admin error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function respond(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
