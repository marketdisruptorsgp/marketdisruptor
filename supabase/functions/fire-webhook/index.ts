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
    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Test mode: send sample payload to a specific webhook
    if (body.test && body.webhookId) {
      const { data: wh } = await supabaseAdmin
        .from("webhooks")
        .select("url")
        .eq("id", body.webhookId)
        .eq("user_id", userId)
        .single();

      if (!wh) {
        return new Response(JSON.stringify({ error: "Webhook not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const testPayload = {
        event: "test",
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test payload from Market Disruptor",
          id: "test-uuid",
          title: "Test Analysis",
          category: "Electronics",
          avg_revival_score: 8.5,
          product_count: 3,
        },
      };

      try {
        await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testPayload),
        });
      } catch (e) {
        console.error("Test webhook delivery failed:", e);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Normal mode: fire all active webhooks for user
    const { data: webhooks } = await supabaseAdmin
      .from("webhooks")
      .select("url, events")
      .eq("user_id", userId)
      .eq("active", true);

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ success: true, fired: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const event = body.event || "analysis.completed";
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data: body.data || {},
    };

    let fired = 0;
    for (const wh of webhooks) {
      if (wh.events && !wh.events.includes(event)) continue;
      try {
        await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        fired++;
      } catch (e) {
        console.error("Webhook delivery failed:", e);
      }
    }

    return new Response(JSON.stringify({ success: true, fired }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("fire-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
