import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

function buildEmailHtml(firstName: string, magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Magic Link</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#141414;border-radius:16px;border:1px solid #262626;overflow:hidden;">
          
          <!-- Header gradient bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6,#3b82f6);"></td>
          </tr>

          <!-- Logo + Brand -->
          <tr>
            <td style="padding:32px 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background-color:#f59e0b;border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;font-size:16px;font-weight:700;color:#ffffff;">
                    Product Intelligence AI
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">
                Hey ${firstName}, you're one click away.
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Your workspace is ready. Click below to jump straight in — no password needed, ever.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="${magicLink}" target="_blank" style="display:inline-block;background-color:#f59e0b;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.02em;">
                      Open My Workspace →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #262626;margin:0 0 24px;">

              <!-- What's waiting -->
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.08em;">
                What's waiting for you inside
              </p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#d4d4d8;line-height:1.5;">
                    🔍 &nbsp;<strong style="color:#ffffff;">AI Product Intelligence</strong> — Deep-dive any product with live market data from eBay, Etsy, Reddit & more
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#d4d4d8;line-height:1.5;">
                    🧠 &nbsp;<strong style="color:#ffffff;">First Principles Analysis</strong> — Challenge every assumption, flip conventional thinking, uncover hidden opportunities
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#d4d4d8;line-height:1.5;">
                    💡 &nbsp;<strong style="color:#ffffff;">Innovation Engine</strong> — AI-generated product concepts with feasibility scores, action plans & revenue projections
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#d4d4d8;line-height:1.5;">
                    📊 &nbsp;<strong style="color:#ffffff;">Pricing & Supply Chain Intel</strong> — Suppliers, vendors, margins, and go-to-market strategies ready to execute
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 12px;font-size:12px;color:#52525b;line-height:1.5;">
                🔒 Privacy by design — all connections are TLS encrypted, analysis runs in isolated serverless functions, and your data is never sold, shared, or used for training.
              </p>
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Bottom gradient bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6,#ef4444,#f59e0b);"></td>
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
    const { email, firstName, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to generate magic link without sending default email
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

    // Build the verification URL from the returned token properties
    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return new Response(JSON.stringify({ error: "Failed to generate magic link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rewrite the redirect in the action link to point to the user's app
    const finalLink = redirectTo
      ? actionLink.replace(
          /redirect_to=[^&]*/,
          `redirect_to=${encodeURIComponent(redirectTo)}`
        )
      : actionLink;

    const safeName = (firstName || "there").replace(/[<>"'&]/g, "");

    // Send custom email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Product Intelligence AI <hello@marketreinventor.com>",
        to: [email.trim()],
        subject: "Your Magic Link",
        html: buildEmailHtml(safeName, finalLink),
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
