import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

function buildReferralEmailHtml(
  senderName: string,
  recipientName: string,
  shareUrl: string
): string {
  const safe = (s: string) => s.replace(/[<>"'&]/g, "");
  const from = safe(senderName);
  const to = safe(recipientName || "there");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited to Market Disruptor</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#161b22;border-radius:16px;border:1px solid #21262d;overflow:hidden;box-shadow:0 8px 32px -8px rgba(0,0,0,0.5);">

          <!-- Top gradient bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa);"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td style="padding:28px 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background-color:#2563eb;border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;color:#ffffff;font-weight:bold;">MD</span>
                  </td>
                  <td style="padding-left:10px;font-size:16px;font-weight:700;color:#e6edf3;">
                    Market Disruptor
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invitation badge -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.25);border-radius:20px;padding:6px 14px;">
                    <span style="font-size:12px;font-weight:700;color:#60a5fa;letter-spacing:0.03em;">🎁 Personal Invitation from ${from}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#e6edf3;line-height:1.3;">
                Hey ${to}, ${from} thinks you'll love this.
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#8b949e;line-height:1.7;">
                Market Disruptor is an AI-powered product intelligence platform that scrapes live market data, deconstructs any product to its first principles, and generates actionable business opportunities — complete with supply chains, pricing intel, and investor-ready pitch decks.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="${shareUrl}" target="_blank" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.02em;box-shadow:0 4px 20px -4px rgba(37,99,235,0.5);">
                      Claim Your Free Analyses →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Bonus callout -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(34,197,94,0.08) 0%,rgba(34,197,94,0.02) 100%);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#4ade80;">
                      🎉 You both get +5 bonus analyses
                    </p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.5;">
                      Sign up through this link and you'll each receive 5 extra product analyses on top of the free tier. No credit card required.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #21262d;margin:0 0 24px;">

              <!-- Features -->
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#e6edf3;text-transform:uppercase;letter-spacing:0.1em;">
                What you'll get access to
              </p>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:10px 0;font-size:14px;color:#8b949e;line-height:1.6;">
                    <span style="color:#60a5fa;font-weight:700;">⚡ AI Product Intelligence</span><br/>
                    Deep-dive any product with live market data from eBay, Etsy, Reddit, Google &amp; TikTok
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:14px;color:#8b949e;line-height:1.6;">
                    <span style="color:#60a5fa;font-weight:700;">🧠 First Principles Analysis</span><br/>
                    Challenge every assumption, flip conventional thinking, uncover hidden opportunities
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:14px;color:#8b949e;line-height:1.6;">
                    <span style="color:#60a5fa;font-weight:700;">✨ Innovation Engine</span><br/>
                    AI-generated product concepts with feasibility scores, action plans &amp; revenue projections
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:14px;color:#8b949e;line-height:1.6;">
                    <span style="color:#60a5fa;font-weight:700;">📊 Supply Chain Intel</span><br/>
                    Suppliers, vendors, margins, and go-to-market strategies ready to execute
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:14px;color:#8b949e;line-height:1.6;">
                    <span style="color:#60a5fa;font-weight:700;">📑 Pitch Deck Generator</span><br/>
                    Investor-ready presentations created in seconds from your analysis data
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 12px;font-size:12px;color:#484f58;line-height:1.5;">
                Privacy by design — all connections are TLS encrypted, analysis runs in isolated serverless functions, and your data is never sold, shared, or used for training.
              </p>
              <p style="margin:0;font-size:11px;color:#484f58;">
                You received this because ${from} invited you. If you're not interested, no action is needed.
              </p>
            </td>
          </tr>

          <!-- Bottom gradient bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#60a5fa,#3b82f6,#2563eb);"></td>
          </tr>
        </table>

        <!-- Branding footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;padding:20px 0;">
          <tr>
            <td align="center" style="font-size:11px;color:#484f58;">
              Developed by SGP Capital
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

    // Verify the caller
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recipientEmail, recipientName, shareUrl } = await req.json();

    if (!recipientEmail || !shareUrl) {
      return new Response(
        JSON.stringify({ error: "recipientEmail and shareUrl are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get sender's name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.first_name || "A friend";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Market Disruptor <hello@marketdisruptor.sgpcapital.com>",
        to: [recipientEmail.trim()],
        subject: `${senderName} invited you to Market Disruptor — claim your free analyses`,
        html: buildReferralEmailHtml(senderName, recipientName?.trim() || "", shareUrl),
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
