

## Plan: Complete Platform Reference Cleanup (Round 2)

The previous cleanup pass missed several files. The surfboard project shows Reddit text because it's **old saved data** — but Index.tsx also still reads from the old `redditSentiment` field exclusively, which needs fixing.

### Files to Change

**1. `src/pages/Index.tsx`** — Missed in previous pass
- Line 1017: Change type from `redditSentiment` → `communitySentiment`
- Line 1021: Change comment `{/* Reddit Sentiment */}` → `{/* Community Sentiment */}`
- Lines 1022-1026: Change all `redditSentiment` type casts → `communitySentiment`
- Line 1026: Update `hasRealSentiment` to use `ci.communitySentiment || (ci as any).redditSentiment` (backward compat) and remove `reddit` from the regex filter
- Line 1034: Display `sentiment` variable instead of `ci.redditSentiment`

**2. `supabase/functions/send-magic-link/index.ts`** — Line 186
- Change `"Deep-dive any product with live market data from eBay, Etsy, Reddit and more"` → `"Deep-dive any product with live market data and community intelligence"`

**3. `src/pages/ResourcesPage.tsx`** — Lines 37, 39
- Line 37: Remove `"TikTok (28M views)"` → `"social media (28M views)"`
- Line 39: Remove `"Reddit and forum threads"` → `"Online community threads"`

**4. `supabase/functions/analyze-products/index.ts`** — Lines 20, 52, 170-171, 313-314
- Line 20: Remove `site:ebay.com` from image search query → use generic product image search
- Line 52: Remove `i.ebayimg` / `etsy.com/il` image domain filters → accept any product image
- Lines 170-171, 313-314: Rename schema fields `ebayAvgSold` → `resaleAvgSold`, `etsyAvgSold` → `vintageAvgSold` in JSON examples

**5. `supabase/functions/generate-flip-ideas/index.ts`** — Line 104
- Change `eBay avg: ${product.pricingIntel.ebayAvgSold}` → `Resale avg: ${product.pricingIntel.ebayAvgSold || product.pricingIntel.resaleAvgSold}`

**6. Update all UI field accessors** for backward compat with both old (`ebayAvgSold`) and new (`resaleAvgSold`) field names:
- `src/pages/ReportPage.tsx` line 454-455
- `src/pages/Index.tsx` lines 1191-1192
- `src/pages/ShareableAnalysisPage.tsx` lines 387-399

### What stays unchanged
- `scrape-products` `reddit.com` URL detection (line 165) — this correctly categorizes scraped results by source URL, not hardcoding queries. It's analytically valuable.
- Internal data field names as fallbacks — old saved analyses need backward compatibility

### Deployment
- Redeploy `send-magic-link`, `analyze-products`, `generate-flip-ideas`

