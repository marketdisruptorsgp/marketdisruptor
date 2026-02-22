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
  <title>${from} thinks you should see this</title>
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
              <p style="margin:0 0 20px;font-size:15px;color:#ffffff;line-height:1.7;">
                Hi ${to} — this is an intelligence platform that uses <strong>multi-model AI orchestration</strong>, real-time web crawling, computer vision, and structured reasoning to deconstruct any product, service, or business model — then rebuild it from scratch.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#ffffff;line-height:1.7;">
                It doesn't summarize. It challenges every assumption — pricing architecture, supply chain logic, patent landscapes, competitive blind spots, and the friction that incumbents have normalized. The output is a <strong>completely original strategic perspective</strong> with investor-ready pitch decks, first-principles analysis, and actionable disruption paths.
              </p>

              <!-- CTA -->
...
              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #21262d;margin:0 0 28px;">

              <!-- Analysis Modes Header -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:18px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:0.15em;">
                      Four Ways to Uncover Opportunity
                    </p>
                    <div style="width:60px;height:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);margin:10px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>
              </table>

              <!-- Mode 1: Disrupt This Product -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(59,130,246,0.1) 0%,rgba(59,130,246,0.03) 100%);border:1px solid rgba(59,130,246,0.25);border-left:4px solid #3b82f6;border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt This Product</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; AI-powered web crawling scans marketplaces, review platforms, and competitor sites — extracting specs, pricing, and sentiment using <strong style="color:#93c5fd;">computer vision and NLP</strong></p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Multi-model reasoning engine cross-references <strong style="color:#93c5fd;">supply chain data, demand signals, and competitive positioning</strong> to expose blind spots</p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Outputs reimagined product concepts with feasibility scores, cost modeling, and go-to-market blueprints</p>
                  </td>
                </tr>
              </table>

              <!-- Mode 2: Disrupt This Service -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(139,92,246,0.1) 0%,rgba(139,92,246,0.03) 100%);border:1px solid rgba(139,92,246,0.25);border-left:4px solid #8b5cf6;border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt This Service</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Deconstructs pricing tiers, delivery mechanics, and margin structures using <strong style="color:#c4b5fd;">structured reasoning across multiple AI models</strong></p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Identifies normalized inefficiencies — the friction points customers accept but shouldn't — through <strong style="color:#c4b5fd;">behavioral and operational pattern analysis</strong></p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Models alternative revenue architectures, channel strategies, and automation opportunities backed by real market data</p>
                  </td>
                </tr>
              </table>

              <!-- Mode 3: Disrupt The Business Model -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(245,158,11,0.1) 0%,rgba(245,158,11,0.03) 100%);border:1px solid rgba(245,158,11,0.25);border-left:4px solid #f59e0b;border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt The Business Model</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; <strong style="color:#fcd34d;">First-principles deconstruction</strong> breaks apart inherited assumptions about value chains, pricing logic, and competitive moats</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Generates strategic alternatives with revenue projections, unit economics, and risk assessments using <strong style="color:#fcd34d;">multi-source data fusion</strong></p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Outputs investor-ready pitch decks and patent landscape analysis in seconds — not hours</p>
                  </td>
                </tr>
              </table>

              <!-- Mode 4: Disrupt This Nostalgia -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:4px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(34,197,94,0.1) 0%,rgba(34,197,94,0.03) 100%);border:1px solid rgba(34,197,94,0.25);border-left:4px solid #22c55e;border-radius:12px;padding:18px 20px;">
                    <p style="margin:0 0 8px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt This Nostalgia</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Surfaces forgotten products from any era using <strong style="color:#86efac;">cultural and commercial context analysis</strong> across historical data sources</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Scores revival potential against modern demand, consumer trends, and <strong style="color:#86efac;">manufacturing feasibility models</strong></p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.6;">&#8226; Uncovers latent demand for products people didn't know they missed — with actionable relaunch strategies</p>
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
        subject: `${senderName} thinks you need to see this`,
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
