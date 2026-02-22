import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Invalid auth");

    const user = userData.user;
    const { referralCode } = await req.json();

    if (!referralCode) {
      return new Response(JSON.stringify({ error: "No referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the referrer by code
    const { data: codeData } = await supabase
      .from("referral_codes")
      .select("user_id")
      .eq("code", referralCode)
      .maybeSingle();

    if (!codeData) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't let users refer themselves
    if (codeData.user_id === user.id) {
      return new Response(JSON.stringify({ success: false, reason: "self_referral" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already claimed
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: false, reason: "already_claimed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record the referral
    await supabase.from("referrals").insert({
      referrer_id: codeData.user_id,
      referred_email: user.email || "",
      referred_user_id: user.id,
      referral_code: referralCode,
      bonus_credited: true,
    });

    // Credit +5 bonus analyses to BOTH referrer and referred user
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    const periodStart = now.toISOString();

    for (const userId of [codeData.user_id, user.id]) {
      const { data: usageRow } = await supabase
        .from("user_usage")
        .select("id, bonus_analyses")
        .eq("user_id", userId)
        .gte("period_start", periodStart)
        .maybeSingle();

      if (usageRow) {
        await supabase
          .from("user_usage")
          .update({ bonus_analyses: (usageRow.bonus_analyses || 0) + 5 })
          .eq("id", usageRow.id);
      } else {
        await supabase
          .from("user_usage")
          .insert({ user_id: userId, period_start: periodStart, analysis_count: 0, bonus_analyses: 5 });
      }
    }

    return new Response(JSON.stringify({ success: true, bonus: 5 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("claim-referral error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
