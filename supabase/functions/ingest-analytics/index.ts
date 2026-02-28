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
    const { events, session } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ error: "No events" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert session
    if (session?.session_id) {
      const { error: sessionErr } = await supabase
        .from("analytics_sessions")
        .upsert(
          {
            session_id: session.session_id,
            device_type: session.device_type || "unknown",
            viewport_width: session.viewport_width,
            viewport_height: session.viewport_height,
            user_agent_hash: session.user_agent_hash,
            is_returning: session.is_returning || false,
            referrer: session.referrer,
            landing_page: session.landing_page,
            last_active_at: new Date().toISOString(),
            page_count: session.page_count || 1,
            total_duration_ms: session.total_duration_ms || 0,
          },
          { onConflict: "session_id" }
        );

      if (sessionErr) {
        console.error("Session upsert error:", sessionErr);
      }
    }

    // Sanitize and insert events
    const sanitized = events.slice(0, 100).map((e: Record<string, unknown>) => ({
      session_id: String(e.session_id || ""),
      event_type: String(e.event_type || "unknown"),
      element_id: e.element_id ? String(e.element_id).slice(0, 200) : null,
      section_id: e.section_id ? String(e.section_id).slice(0, 200) : null,
      page_path: e.page_path ? String(e.page_path).slice(0, 500) : null,
      timestamp: e.timestamp || new Date().toISOString(),
      time_on_section_ms: typeof e.time_on_section_ms === "number" ? e.time_on_section_ms : null,
      scroll_percent: typeof e.scroll_percent === "number" ? Math.min(100, Math.max(0, e.scroll_percent)) : null,
      device_type: e.device_type ? String(e.device_type) : null,
      viewport_width: typeof e.viewport_width === "number" ? e.viewport_width : null,
      viewport_height: typeof e.viewport_height === "number" ? e.viewport_height : null,
      metadata: typeof e.metadata === "object" ? e.metadata : {},
    }));

    const { error: eventsErr } = await supabase
      .from("analytics_events")
      .insert(sanitized);

    if (eventsErr) {
      console.error("Events insert error:", eventsErr);
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, count: sanitized.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
