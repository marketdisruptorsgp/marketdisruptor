

# API / Integrations Page Under Resources

## Overview

Add a new `/api` page (linked under Resources in the nav) that serves two purposes:

1. **API Documentation** -- Users can generate a personal API key and use REST endpoints to pull their analysis data, patent filings, and market news into external tools (Notion, Sheets, Zapier, etc.)
2. **Webhook / Export Integrations** -- Users can configure a webhook URL so that every time an analysis completes, the platform pushes a JSON payload to their endpoint automatically.

This turns the platform from a "visit and view" tool into a connectable data source -- a major stickiness driver.

---

## What Users Can Do

**Pull data OUT (API):**
- `GET /api-proxy?resource=analyses` -- List all their saved analyses with scores, categories, products
- `GET /api-proxy?resource=patents` -- Get recent patent filings (last 30 days)
- `GET /api-proxy?resource=news` -- Get recent market news (last 30 days)
- `GET /api-proxy?resource=portfolio` -- Get aggregated portfolio stats

**Push data OUT (Webhooks):**
- Configure a webhook URL in settings
- When an analysis completes, the platform POSTs a JSON summary (title, score, category, top ideas) to their URL
- Works with Zapier, Make, n8n, Slack incoming webhooks, etc.

---

## Technical Implementation

### Database Changes

New `api_keys` table:
- `id` (uuid, primary key)
- `user_id` (text, references auth user)
- `key_hash` (text) -- SHA-256 hash of the API key (never store plaintext)
- `key_prefix` (text) -- First 8 chars for display (e.g., `md_live_a1b2...`)
- `name` (text) -- User label like "My Zapier Key"
- `created_at`, `last_used_at`, `revoked_at`
- RLS: users can only see/manage their own keys

New `webhooks` table:
- `id` (uuid, primary key)
- `user_id` (text)
- `url` (text) -- The destination URL
- `events` (text array) -- Which events trigger it (e.g., `["analysis.completed"]`)
- `active` (boolean, default true)
- `created_at`
- RLS: users can only see/manage their own webhooks

### New Edge Function: `api-proxy`

A single edge function that:
1. Validates the API key from the `Authorization: Bearer md_live_...` header
2. Looks up `key_hash` in `api_keys` table to find the user
3. Routes based on `resource` query param to query the appropriate table scoped to that user
4. Returns paginated JSON responses
5. Updates `last_used_at` on the key

### New Edge Function: `fire-webhook`

Called internally (from `AnalysisContext` after analysis completes):
1. Looks up active webhooks for the user
2. POSTs the analysis summary JSON to each configured URL
3. Logs success/failure (could add a `webhook_logs` table later)

### New Page: `src/pages/ApiPage.tsx`

A tabbed page with:
- **Overview tab**: What the API offers, use cases (Zapier, Sheets, Notion, Slack)
- **API Keys tab**: Generate, view (prefix only), revoke keys. Copy-to-clipboard.
- **Endpoints tab**: Interactive docs showing each endpoint with example curl commands and JSON responses
- **Webhooks tab**: Add/remove webhook URLs, select which events trigger them, test button that sends a sample payload

### Navigation

- Add "API & Integrations" to the `RESOURCES_ITEMS` array in `PlatformNav.tsx`
- Add route `/api` to `App.tsx`
- Gate key generation behind Builder/Disruptor tiers (Explorer can view docs but not generate keys)

---

## Technical Details

| Component | File | Purpose |
|---|---|---|
| API page | `src/pages/ApiPage.tsx` (new) | Tabbed docs + key management + webhook config |
| API proxy function | `supabase/functions/api-proxy/index.ts` (new) | Authenticated REST endpoints for external tools |
| Webhook function | `supabase/functions/fire-webhook/index.ts` (new) | Push data to user-configured URLs on events |
| DB migration | New migration | `api_keys` and `webhooks` tables with RLS |
| Nav update | `src/components/PlatformNav.tsx` | Add "API & Integrations" to Resources dropdown |
| Route | `src/App.tsx` | Add `/api` route |
| Webhook trigger | `src/contexts/AnalysisContext.tsx` | Call `fire-webhook` after analysis completes |

### API Key Flow
1. User clicks "Generate API Key" on the API page
2. Frontend generates a random key (`md_live_` + 32 random hex chars)
3. Shows the full key ONCE in a modal (copy-to-clipboard)
4. Stores SHA-256 hash + 8-char prefix in the database
5. Key is never retrievable again -- only the prefix is shown in the list

### Tier Gating
- **Explorer (Free)**: Can view API docs, no key generation
- **Builder**: 1 API key, 1 webhook, 100 API calls/day
- **Disruptor**: Unlimited keys, webhooks, and API calls

