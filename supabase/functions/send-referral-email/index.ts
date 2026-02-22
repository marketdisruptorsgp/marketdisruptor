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
<html style="background-color:#080b10;" bgcolor="#080b10">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Thought you'd get a ton of value from this! - ${from}</title>
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    body, html { background-color: #080b10 !important; }
    .dark-bg { background-color: #080b10 !important; }
    .card-bg { background-color: #0d1117 !important; }
  </style>
</head>
<body class="dark-bg" bgcolor="#080b10" style="margin:0;padding:0;background-color:#080b10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#080b10" class="dark-bg" style="background-color:#080b10;padding:40px 20px;">
    <tr>
      <td align="center" bgcolor="#080b10" class="dark-bg" style="background-color:#080b10;">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0d1117" class="card-bg" style="max-width:560px;background-color:#0d1117;border-radius:16px;border:1px solid #1b2130;overflow:hidden;box-shadow:0 8px 32px -8px rgba(0,0,0,0.6);">
          <!-- Top accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa);"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td style="padding:32px 36px 0;background-color:#0d1117;">
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
            <td style="padding:28px 36px 32px;background-color:#0d1117;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                Hi ${to},
              </h1>

              <p style="margin:0 0 18px;font-size:15px;color:#ffffff;line-height:1.75;">
                You've been invited to access Market Disruptor, a proprietary deep analytics platform built for entrepreneurs, investors, and product teams who want to see opportunities others overlook.
              </p>

              <p style="margin:0 0 18px;font-size:15px;color:#ffffff;line-height:1.75;">
                This is not a surface-level tool or a simple AI wrapper. Market Disruptor combines advanced multi-model AI, real-time data analysis, computer vision, and structured strategic modeling to break down any product, service, or business model into its core components and reconstruct it from entirely new angles.
              </p>

              <p style="margin:0 0 18px;font-size:15px;color:#ffffff;line-height:1.75;">
                It doesn't assume the current model is right. It deliberately flips it on its head. It questions pricing logic, supply chain design, patent positioning, competitive assumptions, operational constraints, and the friction incumbents accept as inevitable. It examines what is taken for granted, isolates structural weaknesses, and tests alternative configurations that most teams would never consider.
              </p>

              <p style="margin:0 0 18px;font-size:15px;color:#ffffff;line-height:1.75;">
                The goal isn't to promise a "better" answer every time. The goal is to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth, revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
              </p>

              <p style="margin:0 0 28px;font-size:15px;color:#ffffff;line-height:1.75;">
                The output is not a generic report. It delivers a rigorously constructed strategic perspective, investor-ready pitch decks, and clearly mapped pathways for experimentation, disruption, or targeted optimization.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${shareUrl}" target="_blank" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.02em;">
                      Access Here
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #161b22;margin:0 0 32px;">

              <!-- Analysis Modes Header -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:0.15em;">
                      Four Disruption Paths
                    </p>
                    <div style="width:80px;height:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);margin:12px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>
              </table>

              <!-- Mode 1: Disrupt This Product (deep blue hsl(217 91% 38%) → #1249a3) -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(18,73,163,0.15) 0%,rgba(18,73,163,0.04) 100%);border:1px solid rgba(18,73,163,0.35);border-left:4px solid #1249a3;border-radius:12px;padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt This Product</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Commercial intelligence dossier</strong> from deep web crawling</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; Real <strong style="color:#93c5fd;">pricing data</strong>, market averages, premiums, and trend trajectories</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Supply chain mapping</strong> with OEMs, cost breakdowns, and alt sourcing</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Competitive landscape</strong> with pricing gaps and positioning blind spots</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Patent intel</strong>, expired IP to leverage, active patents to avoid, white space</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; Unfiltered <strong style="color:#93c5fd;">community complaints</strong> and feature requests from forums</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Flipped product ideas</strong> challenging original design assumptions</p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; 3-phase <strong style="color:#93c5fd;">go-to-market plan</strong> with stress-tested projections</p>
                  </td>
                </tr>
              </table>

              <!-- Mode 2: Disrupt This Service (rose/pink hsl(340 75% 50%) → #df2060) -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(223,32,96,0.12) 0%,rgba(223,32,96,0.04) 100%);border:1px solid rgba(223,32,96,0.3);border-left:4px solid #df2060;border-radius:12px;padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt This Service</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Market positioning</strong> against the full competitive landscape</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Pricing breakdown</strong> &mdash; how competitors charge and where gaps exist</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Customer journey friction map</strong> with drop-off points and causes</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Underserved segments</strong> the competition has overlooked</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Operational workflow analysis</strong> &mdash; inefficiencies and automation opportunities</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Growth strategy</strong> with acquisition channels, costs, and retention mechanics</p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#fda4af;">Scaling projections</strong> grounded in real market data</p>
                  </td>
                </tr>
              </table>

              <!-- Mode 3: Disrupt The Business Model (purple hsl(271 81% 55%) → #8b3fd9) -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(139,63,217,0.12) 0%,rgba(139,63,217,0.04) 100%);border:1px solid rgba(139,63,217,0.3);border-left:4px solid #8b3fd9;border-radius:12px;padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt The Business Model</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">Customer journey friction map</strong> ranked by impact</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">Cost structure deconstruction</strong>, where money leaks and why</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">Technology leverage audit</strong> with automation difficulty ratings</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">User workflow analysis</strong>, actual behavior vs. assumptions</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">Competitive repositioning</strong> with a defensible moat plan</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">Revenue paths</strong> surfaced by challenging pricing assumptions</p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#c4b5fd;">Reinvention blueprint</strong> with IP considerations and phased timeline</p>
                  </td>
                </tr>
              </table>

              <!-- Mode 4: Disrupt This Nostalgia (primary blue hsl(217 91% 50%) → #2563eb) -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:4px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(37,99,235,0.12) 0%,rgba(37,99,235,0.04) 100%);border:1px solid rgba(37,99,235,0.3);border-left:4px solid #2563eb;border-radius:12px;padding:20px 22px;">
                    <p style="margin:0 0 12px;font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">Disrupt This Nostalgia</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Revival Potential Score</strong> (1-10) across 6 dimensions per product</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Reinvented product concepts</strong> with bill-of-materials estimates</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Live pricing</strong> from eBay, Etsy, and collector marketplaces</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Community sentiment</strong> from Reddit, TikTok, and Google trends</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Supply chain mapping</strong> with verified suppliers and MOQs</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Patent landscape</strong>, expired IP goldmines, active risks, and innovation gaps</p>
                    <p style="margin:0 0 5px;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; <strong style="color:#93c5fd;">Friction analysis</strong>, why the product lost traction and what was never fixed</p>
                    <p style="margin:0;font-size:13px;color:#ffffff;line-height:1.65;">&#8226; 3-phase <strong style="color:#93c5fd;">execution roadmap</strong> with budget and ROI projections</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 36px 28px;background-color:#0d1117;">
              <hr style="border:none;border-top:1px solid #161b22;margin:0 0 20px;">
              <p style="margin:0 0 8px;font-size:14px;color:#ffffff;line-height:1.7;font-weight:700;">
                🔒 Privacy &amp; Security
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#e6edf3;line-height:1.7;font-weight:500;">
                All connections use TLS encryption in transit. Analysis runs in isolated serverless functions that process your data and discard it after responding — nothing is logged or retained by AI providers. When you save an analysis, it's encrypted at rest and scoped exclusively to your account via row-level security policies. Your data is never sold or shared.
              </p>
              <p style="margin:0;font-size:12px;color:#8b949e;">
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
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#080b10" style="max-width:560px;padding:24px 0;background-color:#080b10;">
          <tr>
            <td align="center" bgcolor="#080b10" style="font-size:11px;color:#484f58;background-color:#080b10;">
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
