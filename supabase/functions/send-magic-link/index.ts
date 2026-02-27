import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

function buildFeatureRow(label: string, desc: string): string {
  return `<tr><td style="padding:8px 0;font-size:15px;color:${BRAND.textBody};line-height:1.65;">
    <strong style="color:${BRAND.textPrimary};">${label}</strong> — ${desc}
  </td></tr>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim(),
      options: {
        redirectTo: redirectTo || Deno.env.get("SUPABASE_URL"),
        data: { first_name: firstName?.trim() || "" },
      },
    });

    if (error) {
      console.error("Generate link error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return new Response(JSON.stringify({ error: "Failed to generate magic link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalLink = redirectTo
      ? actionLink.replace(
          /redirect_to=[^&]*/,
          `redirect_to=${encodeURIComponent(redirectTo)}`
        )
      : actionLink;

    const safeName = (firstName || "there").replace(/[<>"'&]/g, "");

    const content = `
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${BRAND.textPrimary};line-height:1.3;font-family:${BRAND.headingFont};">
        Hey ${safeName}, you're one click away.
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textBody};line-height:1.65;">
        Your workspace is ready. Click below to jump straight in — instant, secure access.
      </p>

      ${buildCTA(finalLink, "Open My Workspace")}

      <hr style="border:none;border-top:1px solid ${BRAND.divider};margin:0 0 20px;">

      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:${BRAND.textPrimary};text-transform:uppercase;letter-spacing:0.08em;">
        What's waiting for you inside
      </p>

      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
        ${buildFeatureRow("AI Product Intelligence", "Deep-dive any product with live market data and community intelligence")}
        ${buildFeatureRow("First Principles Analysis", "Challenge every assumption, flip conventional thinking, uncover hidden opportunities")}
        ${buildFeatureRow("Innovation Engine", "AI-generated product concepts with feasibility scores, action plans and revenue projections")}
        ${buildFeatureRow("Pricing and Supply Chain Intel", "Suppliers, vendors, margins, and go-to-market strategies ready to execute")}
      </table>

      <p style="margin:0;font-size:13px;color:${BRAND.textFooter};line-height:1.5;">
        If you didn't request this link, you can safely ignore this email.
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
        to: [email.trim()],
        subject: "Your Magic Link",
        html,
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.text();
      console.error("Resend error:", resendError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
