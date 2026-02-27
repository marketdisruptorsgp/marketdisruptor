

## Plan: Remove Specific Platform References (Reddit, TikTok, etc.) System-Wide

Replace all hardcoded references to Reddit, TikTok, Trustpilot, eBay, Etsy, etc. with generic terms ("community", "web sources", "online platforms") unless the data itself surfaces those platforms as analytically relevant.

### Files to Change

**1. `supabase/functions/scrape-products/index.ts`** — Scraping queries
- Remove `site:reddit.com`, `site:trustpilot.com`, `site:g2.com`, `site:capterra.com` from hardcoded queries
- Replace with generic queries: `"customer reviews complaints"`, `"community discussion forums"`, etc.
- Remove `TikTok viral nostalgia trend` query, replace with generic trend/viral query
- Remove `site:reddit.com` from custom product search queries
- Rename `redditPosts` array/stats → `communityPosts`
- Rename `redditContent` response field → `communityContent`

**2. `supabase/functions/analyze-products/index.ts`** — AI prompts & schemas
- Rename `redditSentiment` → `communitySentiment` in both JSON schema examples (service + product)
- Remove `"with specific subreddit references"` and `"Reddit community sentiment"` from descriptions
- Change `socialSignals` examples from `{"platform": "TikTok"...}`, `{"platform": "Reddit"...}` → generic `{"platform": "Social Media"...}`, `{"platform": "Community Forums"...}`
- Rename `redditContent` variable → `communityContent`
- Remove `"Real Reddit community sentiment"` from user prompt, replace with `"Real community sentiment"`
- Remove `"MAIN SCRAPED CONTENT (eBay, Etsy, Google, TikTok)"` → `"MAIN SCRAPED CONTENT"`
- Remove `"REDDIT COMMUNITY POSTS"` → `"COMMUNITY POSTS"`
- Change `"Community suggestion or improvement request from Reddit/forums"` → `"Community suggestion or improvement request"`

**3. `supabase/functions/generate-flip-ideas/index.ts`** — Prompt examples
- Remove `"r/smartphones discusses weekly"` and `"TikTok Shop"` from the GOOD example
- Replace with generic: `"sold via social commerce targeting the specific grip frustration that online communities discuss weekly"`
- Remove hardcoded `"TikTok Shop"` from `channels` example array → `"Social Commerce"`

**4. `src/contexts/AnalysisContext.tsx`** — Data pipeline
- Rename `scrapeData.redditPosts` → `scrapeData.communityPosts` in log
- Rename `scrapeData.redditContent` → `scrapeData.communityContent` in body sent to analyze

**5. `src/pages/Index.tsx`** — Data pipeline (duplicate of above)
- Same renames: `redditPosts` → `communityPosts`, `redditContent` → `communityContent`

**6. `src/pages/ReportPage.tsx`** — UI rendering
- Rename all `redditSentiment` type references → `communitySentiment`
- Update `hasRealSentiment` regex filter to remove `reddit` references
- Label already says "Community Sentiment" — no change needed there

**7. `src/pages/ShareableAnalysisPage.tsx`** — Shareable view
- Rename `redditSentiment` → `communitySentiment`
- Update regex filter

**8. `src/components/KeyTakeawayBanner.tsx`** — Helper type
- Rename `redditSentiment` → `communitySentiment` in `getCommunityTakeaway` param type

**9. `src/lib/explainers.ts`** — Explainer text
- Change `"Community Intel scrapes Reddit, forums, and review platforms"` → `"Community Intel scrapes forums, review platforms, and public discussions"`

### Deployment
- Redeploy `scrape-products`, `analyze-products`, `generate-flip-ideas` edge functions

