

# Enforce Fresh Data (< 30 Days) for Patent & Market News Intel

## Problem
Currently the patent filings stored in the database have filing dates as old as 2007, and market news has items dating back to 2024. The scraper searches are broad and don't enforce recency, so stale data gets displayed.

## Changes

### 1. Patent Scraper -- target last 24 hours / 50 most recent (`supabase/functions/scrape-patent-intel/index.ts`)

- Update `PATENT_SEARCHES` queries to explicitly target "past 24 hours" / "today" / "yesterday" phrasing and current date context (2025-2026)
- Add the Firecrawl `tbs: "qdr:d"` parameter (last 24 hours) to the search request, matching how market news already uses `tbs: "qdr:w"`
- In the AI extraction prompt, instruct the model to only extract patents with filing/publication dates within the last 30 days; discard anything older
- Cap total stored patents at 50 most recent (by filing_date descending) when inserting
- Before insert, delete all existing rows (current behavior) to ensure stale data doesn't persist

### 2. Market News Scraper -- enforce 30-day freshness (`supabase/functions/scrape-market-news/index.ts`)

- Change `tbs: "qdr:w"` (last week) to `tbs: "qdr:m"` (last month) to cast a wider net while staying within the 30-day window
- In the AI extraction prompt, instruct the model to only include articles published within the last 30 days
- After extraction, programmatically filter out any items with `published_at` older than 30 days before inserting

### 3. Frontend -- filter stale data client-side as a safety net (`src/pages/IntelPage.tsx`)

- After fetching patents and news from the database, apply a 30-day cutoff filter on `filing_date` (patents) and `published_at` (news)
- This ensures even if scraper data slips through, the UI never shows anything older than 30 days
- Add `.gte("filing_date", thirtyDaysAgo)` to the patent query and `.gte("published_at", thirtyDaysAgo)` to the news query directly in the Supabase calls
- Limit patent query to `.limit(50)` to enforce the 50 most recent cap

## Technical Details

| File | Changes |
|---|---|
| `supabase/functions/scrape-patent-intel/index.ts` | Add `tbs: "qdr:d"` to Firecrawl searches; update AI prompt to enforce 30-day recency; cap at 50 rows |
| `supabase/functions/scrape-market-news/index.ts` | Change `tbs: "qdr:w"` to `tbs: "qdr:m"`; add 30-day filter in prompt and post-extraction |
| `src/pages/IntelPage.tsx` | Add `.gte()` date filters and `.limit(50)` to patent/news queries |

No database schema changes needed. Edge functions will be redeployed after changes.

