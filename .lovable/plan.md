

## Fix All Share Links to Be Direct Public Analysis Links (Not Referral Links)

### Problem

Currently, every "share" link across the platform generates a referral-style URL like:
- `http://marketdisruptor.sgpcapital.com/share?ref=USER_ID&preview=ANALYSIS_ID`
- `${window.location.origin}/share?ref=USER_ID&preview=ANALYSIS_ID`

The `/share` route is a **marketing/referral landing page** — it does NOT show the analysis. The actual public analysis view lives at `/analysis/share/:id` (rendered by `ShareableAnalysisPage`). This means no shared link actually shows the project to the recipient.

### Solution

Change all share URLs across the app to point to the **public analysis view**:
```
https://productideas.lovable.app/analysis/share/{analysisId}
```

This route already exists, is publicly accessible (outside the auth gate in `App.tsx`), and calls the `fetch-shared-analysis` edge function which uses the service role key to bypass RLS. No backend changes needed — just fix the URLs in the frontend.

### Files Changed

| File | Change |
|------|--------|
| `src/components/ShareAnalysis.tsx` | Change `shareUrl` from `/share?ref=...&preview=...` to `${window.location.origin}/analysis/share/${analysisId}` |
| `src/components/export/ExportPanel.tsx` | Change `handleCopyLink` URL from `/share?ref=...&preview=...` to `${window.location.origin}/analysis/share/${analysisId}` |

### What Stays the Same

- **Referral system** — The `UserHeader.tsx` referral link (`/share?ref=CODE`) remains untouched. That's the marketing referral flow and is separate from project sharing.
- **`/share` route** — Still exists as a referral landing page.
- **`/analysis/share/:id` route** — Already public, already works, already fetches data via `fetch-shared-analysis` edge function. No changes needed.
- **`ShareableAnalysisPage`** — No changes. Already renders the read-only view correctly.
- **`fetch-shared-analysis` edge function** — No changes. Already queries `saved_analyses` by ID using service role key.
- **Email sharing** — The `share-analysis` edge function email will now contain the correct public URL since `ShareAnalysis.tsx` passes `shareUrl` to it.

### Existing + Future Projects

Since the share URL is computed at the time of sharing (not stored in the DB), this fix applies to all projects — past, present, and future — the moment the code deploys. The analysis ID in the `saved_analyses` table is already the correct UUID used by the public route.

### Technical Detail

The `saved_analyses` table has RLS restricting reads to the owner (`auth.uid() = user_id`). Public sharing works because `fetch-shared-analysis` uses the **service role key** to bypass RLS, so no RLS policy changes are needed.

