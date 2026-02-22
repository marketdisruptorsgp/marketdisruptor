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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#161b22;border-radius:16px;border:1px solid #21262d;overflow:hidden;box-shadow:0 8px 32px -8px rgba(0,0,0,0.5);">

          <!-- Top accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa);"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td style="padding:32px 36px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:38px;height:38px;background-color:#2563eb;border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;color:#ffffff;font-weight:bold;">MD</span>
                  </td>
                  <td style="padding-left:12px;font-size:17px;font-weight:700;color:#e6edf3;letter-spacing:-0.01em;">
                    Market Disruptor
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:28px 36px 32px;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#e6edf3;line-height:1.25;letter-spacing:-0.02em;">
                ${from} thinks you need to see this
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#8b949e;line-height:1.7;">
                Hi ${to}, you've been invited to a proprietary intelligence platform that flips conventional product thinking on its head.
              </p>

              <p style="margin:0 0 20px;font-size:15px;color:#c9d1d9;line-height:1.7;">
                Most tools summarize markets. This one tears them apart. Powered by deep web crawling, vision AI, and multi-model strategic analysis, it challenges every assumption about a product — why it exists in its current form, whether the pricing model is actually right, what friction users have normalized, and what a version rebuilt from scratch would look like.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#c9d1d9;line-height:1.7;">
                You get a completely new take — not a summary. Complete with supply chain intelligence, patent analysis, and investor-ready pitch decks generated in seconds. Give it a try.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="\${shareUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 48px;border-radius:12px;letter-spacing:0.02em;box-shadow:0 4px 24px -4px rgba(37,99,235,0.5);text-transform:uppercase;">
                      Click Here to Start Exploring
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Bonus callout -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(34,197,94,0.08) 0%,rgba(34,197,94,0.02) 100%);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#4ade80;">
                      You both receive 5 bonus analyses
                    </p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.6;">
                      Sign up through this link and you'll each receive 5 additional analyses. No credit card required.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #21262d;margin:0 0 24px;">

              <!-- Capabilities -->
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:0.1em;">
                What Powers It
              </p>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #21262d;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e6edf3;">Multi-Model AI Pipelines</p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.5;">Proprietary analysis engine with deep web crawling and vision AI</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #21262d;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e6edf3;">First Principles Deconstruction</p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.5;">Questions why a product exists in its current form and rebuilds it from scratch</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #21262d;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e6edf3;">Supply Chain & Patent Intel</p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.5;">Suppliers, margins, patent landscape, and go-to-market strategies</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e6edf3;">Pitch Deck Generator</p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.5;">Investor-ready presentations created in seconds from analysis data</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 36px 28px;">
              <hr style="border:none;border-top:1px solid #21262d;margin:0 0 20px;">
              <p style="margin:0 0 8px;font-size:12px;color:#484f58;line-height:1.6;">
                All connections are TLS encrypted. Analysis runs in isolated serverless functions. Your data is never sold, shared, or used for training.
              </p>
              <p style="margin:0;font-size:11px;color:#484f58;">
                You received this email because ${from} invited you. No action is needed if you're not interested.
              </p>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#60a5fa,#3b82f6,#2563eb);"></td>
          </tr>
        </table>

        <!-- Branding footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;padding:24px 0;">
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

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.first_name || "A colleague";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Market Disruptor <hello@marketdisruptor.sgpcapital.com>",
        to: [recipientEmail.trim()],
        subject: `${senderName} invited you to Market Disruptor`,
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
