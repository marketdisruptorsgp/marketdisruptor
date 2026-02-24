import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recipientEmail, recipientName, shareUrl, analysisTitle } = await req.json();

    if (!recipientEmail || !shareUrl) {
      return new Response(JSON.stringify({ error: "recipientEmail and shareUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.first_name || "A colleague";
    const safe = (s: string) => s.replace(/[<>"'&]/g, "");

    const html = `<!DOCTYPE html>
<html style="background-color:#080b10;">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#080b10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080b10;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0d1117;border-radius:16px;border:1px solid #1b2130;overflow:hidden;">
        <tr><td style="height:4px;background:linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa);"></td></tr>
        <tr><td style="padding:32px 36px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:38px;height:38px;background-color:#2563eb;border-radius:10px;text-align:center;vertical-align:middle;">
              <span style="font-size:14px;color:#fff;font-weight:bold;">MD</span>
            </td>
            <td style="padding-left:12px;font-size:17px;font-weight:700;color:#e6edf3;">Market Disruptor</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 36px 32px;">
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#fff;">
            ${safe(senderName)} shared an analysis with you
          </h1>
          <p style="margin:0 0 8px;font-size:15px;color:#fff;line-height:1.75;">
            Hi ${safe(recipientName || "there")},
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#fff;line-height:1.75;">
            ${safe(senderName)} has shared their Market Disruptor analysis <strong>"${safe(analysisTitle || "Analysis")}"</strong> with you. Click below to view the full strategic breakdown.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="${shareUrl}" target="_blank" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;">
                View Analysis
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#8b949e;">
            You received this because ${safe(senderName)} shared it via Market Disruptor.
          </p>
        </td></tr>
        <tr><td style="height:3px;background:linear-gradient(90deg,#60a5fa,#3b82f6,#2563eb);"></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Market Disruptor <noreply@marketdisruptor.xyz>",
        to: [recipientEmail],
        subject: `${senderName} shared "${analysisTitle || "an analysis"}" with you`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      throw new Error(`Resend API error: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
