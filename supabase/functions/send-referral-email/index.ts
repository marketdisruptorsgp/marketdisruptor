import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

// ── Unified Email Design Tokens ──
const BRAND = {
  name: "Market Disruptor",
  monogram: "MD",
  tagline: "Developed by SGP Capital",
  accent: "#4b68f5",
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headingFont: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  bodyBg: "#ffffff",
  cardBg: "#ffffff",
  border: "#e2e8f0",
  divider: "#e8e8ec",
  textPrimary: "#0f0f12",
  textBody: "#374151",
  textMuted: "#71717a",
  textFooter: "#a1a1aa",
  btnRadius: "12px",
  btnPadding: "14px 36px",
  btnFontSize: "16px",
  maxWidth: "560px",
  radius: "12px",
};

// Mode accent colors for feature highlights
const modeColors = {
  product:  { accent: "#4b68f5", highlight: "#93c5fd" },
  service:  { accent: "#d64174", highlight: "#fda4af" },
  business: { accent: "#9030ea", highlight: "#c4b5fd" },
};

function buildBrandedEmail(options: { content: string; accentColor?: string }): string {
  const accent = options.accentColor || BRAND.accent;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bodyBg};font-family:${BRAND.font};-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:${BRAND.maxWidth};background-color:${BRAND.cardBg};border-radius:${BRAND.radius};border:1px solid ${BRAND.border};overflow:hidden;">
          <!-- Top accent bar -->
          <tr><td style="height:4px;background:${accent};"></td></tr>

          <!-- Logo header -->
          <tr>
            <td style="padding:28px 32px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:38px;height:38px;background-color:${accent};border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:14px;color:#ffffff;font-weight:bold;">${BRAND.monogram}</span>
                </td>
                <td style="padding-left:12px;font-size:17px;font-weight:700;color:${BRAND.textPrimary};font-family:${BRAND.headingFont};">
                  ${BRAND.name}
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 32px 28px;">
              ${options.content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 24px;">
              <hr style="border:none;border-top:1px solid ${BRAND.divider};margin:0 0 16px;">
              <p style="margin:0;font-size:13px;color:${BRAND.textFooter};line-height:1.5;">
                Privacy by design · TLS encrypted
              </p>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr><td style="height:3px;background:${accent};"></td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:${BRAND.maxWidth};padding:16px 0;">
          <tr><td align="center" style="font-size:13px;color:${BRAND.textFooter};">${BRAND.tagline}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildCTA(href: string, label: string, accentColor?: string): string {
  const accent = accentColor || BRAND.accent;
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
  <tr><td align="center">
    <a href="${href}" target="_blank" style="display:inline-block;padding:${BRAND.btnPadding};background-color:${accent};color:#ffffff;font-size:${BRAND.btnFontSize};font-weight:700;text-decoration:none;border-radius:${BRAND.btnRadius};letter-spacing:0.02em;">
      ${label}
    </a>
  </td></tr>
</table>`;
}

function buildModeCard(title: string, bullets: string[], accentColor: string, highlightColor: string): string {
  const bulletHtml = bullets.map(b => 
    `<p style="margin:0 0 5px;font-size:14px;color:${BRAND.textBody};line-height:1.65;">• <strong style="color:${accentColor};">${b.split(' — ')[0]}</strong>${b.includes(' — ') ? ' — ' + b.split(' — ')[1] : ''}</p>`
  ).join("");

  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
  <tr><td style="background-color:${BRAND.cardBg};border:1px solid ${BRAND.border};border-left:4px solid ${accentColor};border-radius:${BRAND.radius};padding:20px 22px;">
    <p style="margin:0 0 12px;font-size:17px;font-weight:800;color:${BRAND.textPrimary};font-family:${BRAND.headingFont};">${title}</p>
    ${bulletHtml}
  </td></tr>
</table>`;
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
    const safe = (s: string) => s.replace(/[<>"'&]/g, "");
    const from = safe(senderName);
    const to = safe(recipientName?.trim() || "there");

    const content = `
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${BRAND.textPrimary};line-height:1.3;font-family:${BRAND.headingFont};">
        Hi ${to},
      </h1>

      <p style="margin:0 0 16px;font-size:15px;color:${BRAND.textBody};line-height:1.65;">
        You've been invited to access ${BRAND.name}, a proprietary deep analytics platform built for entrepreneurs, investors, and product teams who want to see opportunities others overlook.
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:${BRAND.textBody};line-height:1.65;">
        It combines advanced multi-model AI, real-time data analysis, computer vision, and structured strategic modeling to break down any product, service, or business model into its core components and reconstruct it from entirely new angles.
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:${BRAND.textBody};line-height:1.65;">
        The output is not a generic report. It delivers a rigorously constructed strategic perspective, investor-ready pitch decks, and clearly mapped pathways for experimentation, disruption, or targeted optimization.
      </p>

      ${buildCTA(shareUrl, "Get Started Free")}

      <hr style="border:none;border-top:1px solid ${BRAND.divider};margin:0 0 24px;">

      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${BRAND.textPrimary};text-transform:uppercase;letter-spacing:0.15em;text-align:center;">
        Four Disruption Paths
      </p>

      ${buildModeCard("Disrupt This Product", [
        "Commercial intelligence — from deep web crawling",
        "Real pricing data — market averages, premiums, and trends",
        "Supply chain mapping — with OEMs and cost breakdowns",
        "Patent intel — expired IP, active risks, and white space",
        "Flipped product ideas — challenging original assumptions",
      ], modeColors.product.accent, modeColors.product.highlight)}

      ${buildModeCard("Disrupt This Service", [
        "Market positioning — against the full competitive landscape",
        "Customer journey friction — with drop-off points and causes",
        "Underserved segments — the competition has overlooked",
        "Growth strategy — with acquisition channels and retention mechanics",
      ], modeColors.service.accent, modeColors.service.highlight)}

      ${buildModeCard("Disrupt The Business Model", [
        "Cost structure deconstruction — where money leaks and why",
        "Technology leverage audit — with automation difficulty ratings",
        "Competitive repositioning — with a defensible moat plan",
        "Reinvention blueprint — with IP considerations and phased timeline",
      ], modeColors.business.accent, modeColors.business.highlight)}

      <p style="margin:16px 0 0;font-size:13px;color:${BRAND.textFooter};">
        You received this email because ${from} invited you. No action is needed if you're not interested.
      </p>`;

    const html = buildBrandedEmail({ content });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${BRAND.name} <hello@marketdisruptor.sgpcapital.com>`,
        to: [recipientEmail.trim()],
        subject: `${senderName} invited you to ${BRAND.name}`,
        html,
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
