/**
 * External Presentation Layer — Shared Tokens
 *
 * Unified design tokens for ALL outward-facing surfaces:
 * - Shareable analysis views (/analysis/share/:id)
 * - Share/referral landing pages (/share)
 * - Email templates (magic link, share, referral)
 * - Pitch deck exports
 * - Any unauthenticated public route
 *
 * These tokens derive from the core design system (index.css + designTokens.ts)
 * and must be used instead of inline values on all external surfaces.
 */

// ── Brand Identity ──
export const brand = {
  name: "Market Disruptor",
  tagline: "Developed by SGP Capital",
  monogram: "MD",
  privacyLine: "Privacy by design · TLS encrypted",
  confidentialLabel: "Confidential",
} as const;

// ── Mode Accent Colors ──
// Hex values for email templates (no CSS vars available)
export const modeAccentHex = {
  product:  "#4b68f5",
  service:  "#d64174",
  business: "#9030ea",
  default:  "#4b68f5",
} as const;

// CSS-var-based values for web surfaces
export const modeAccentVar = {
  product:  "hsl(var(--mode-product))",
  service:  "hsl(var(--mode-service))",
  business: "hsl(var(--mode-business))",
  default:  "hsl(var(--primary))",
} as const;

// ── Typography Tokens (Email-safe) ──
export const emailTypography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headingFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  // Minimum 13px enforced
  body:     { fontSize: "15px", fontWeight: "400", lineHeight: "1.65", color: "#0f0f12" },
  bodyMuted:{ fontSize: "14px", fontWeight: "400", lineHeight: "1.6",  color: "#52525b" },
  heading:  { fontSize: "24px", fontWeight: "800", lineHeight: "1.3",  color: "#0f0f12" },
  subhead:  { fontSize: "18px", fontWeight: "700", lineHeight: "1.35", color: "#0f0f12" },
  meta:     { fontSize: "13px", fontWeight: "600", lineHeight: "1.4",  color: "#71717a" },
  eyebrow:  { fontSize: "13px", fontWeight: "700", lineHeight: "1.3",  color: "#71717a", letterSpacing: "0.15em", textTransform: "uppercase" as const },
  footer:   { fontSize: "13px", fontWeight: "400", lineHeight: "1.5",  color: "#a1a1aa" },
} as const;

// ── Layout Tokens ──
export const externalLayout = {
  maxWidth: "560px",        // email max width
  webMaxWidth: "900px",     // shareable page max width (matches analysis)
  borderRadius: "12px",     // cards, buttons
  borderRadiusSm: "8px",    // inner elements
  padding: {
    card: "28px 32px",
    section: "20px 24px",
  },
} as const;

// ── Email Palette ──
export const emailPalette = {
  bodyBg:   "#ffffff",        // MUST be white for email client compatibility
  cardBg:   "#f8fafc",
  border:   "#e2e8f0",
  divider:  "#e8e8ec",
  textPrimary: "#0f0f12",
  textBody:    "#374151",
  textMuted:   "#71717a",
  textFooter:  "#a1a1aa",
  white:       "#ffffff",
  success:     "#22c55e",
} as const;

// ── Button Styles ──
export const emailButton = {
  padding: "14px 36px",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "700",
  letterSpacing: "0.02em",
} as const;

// ── Web External Surface CSS Classes ──
// These map to existing index.css tokens for web-rendered external pages
export const externalClasses = {
  container: "max-w-[900px] mx-auto px-4 sm:px-6",
  card: "rounded-xl border border-border bg-card shadow-sm",
  cardHover: "rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/20",
  heading: "typo-page-title",
  subheading: "typo-section-title",
  body: "typo-card-body text-foreground",
  meta: "typo-card-meta",
  eyebrow: "typo-card-eyebrow",
  label: "text-[13px] font-semibold uppercase tracking-wider text-muted-foreground",
  buttonPrimary: "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors",
  buttonSecondary: "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-[13px] border border-border transition-colors hover:bg-muted",
  footer: "text-[13px] text-muted-foreground text-center",
  banner: "py-3 text-center rounded-none",
} as const;

/**
 * Build a branded email HTML shell with consistent header and footer.
 * Used by all email edge functions.
 */
export function buildEmailShell(options: {
  accentColor?: string;
  content: string;
  preheader?: string;
}): string {
  const accent = options.accentColor || modeAccentHex.default;
  const preheader = options.preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${options.preheader}</span>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${brand.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${emailPalette.bodyBg};font-family:${emailTypography.fontFamily};-webkit-font-smoothing:antialiased;">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${emailPalette.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:${externalLayout.maxWidth};background-color:${emailPalette.white};border-radius:${externalLayout.borderRadius};border:1px solid ${emailPalette.border};overflow:hidden;">
          <!-- Top accent bar -->
          <tr>
            <td style="height:4px;background:${accent};"></td>
          </tr>

          <!-- Logo header -->
          <tr>
            <td style="padding:28px 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:38px;height:38px;background-color:${accent};border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;color:${emailPalette.white};font-weight:bold;">${brand.monogram}</span>
                  </td>
                  <td style="padding-left:12px;font-size:17px;font-weight:700;color:${emailPalette.textPrimary};font-family:${emailTypography.headingFamily};">
                    ${brand.name}
                  </td>
                </tr>
              </table>
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
              <hr style="border:none;border-top:1px solid ${emailPalette.divider};margin:0 0 16px;">
              <p style="margin:0;font-size:${emailTypography.footer.fontSize};color:${emailTypography.footer.color};line-height:${emailTypography.footer.lineHeight};">
                ${brand.privacyLine}
              </p>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr>
            <td style="height:3px;background:${accent};"></td>
          </tr>
        </table>

        <!-- Brand footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:${externalLayout.maxWidth};padding:16px 0;">
          <tr>
            <td align="center" style="font-size:${emailTypography.footer.fontSize};color:${emailTypography.footer.color};">
              ${brand.tagline}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Build a CTA button for emails.
 */
export function buildEmailCTA(options: {
  href: string;
  label: string;
  accentColor?: string;
}): string {
  const accent = options.accentColor || modeAccentHex.default;
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
  <tr>
    <td align="center">
      <a href="${options.href}" target="_blank" style="display:inline-block;padding:${emailButton.padding};background-color:${accent};color:${emailPalette.white};font-size:${emailButton.fontSize};font-weight:${emailButton.fontWeight};text-decoration:none;border-radius:${emailButton.borderRadius};letter-spacing:${emailButton.letterSpacing};">
        ${options.label}
      </a>
    </td>
  </tr>
</table>`;
}
