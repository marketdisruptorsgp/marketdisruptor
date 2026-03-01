

## Navigation Restructure Plan

### Changes Summary

**4 files modified**, no new files.

---

### 1. Routing: Homepage is not Workspace (`src/App.tsx`)

**Current**: `"/" → Navigate to /workspace`
**Change**: `"/"` renders the `StartPage` component (the hero + mode selection page). Workspace stays at `/workspace`. Authenticated users land on the homepage, not workspace.

Also remove the `/start` → `/analysis/new` redirect since `/start` routes are still used by the analysis pipeline (`/start/product`, etc.).

---

### 2. PlatformNav Restructure (`src/components/PlatformNav.tsx`)

**Current nav structure**:
- Primary: Workspace, New Analysis, Intelligence
- Secondary: How It Works, Resources
- More dropdown: FAQs, API, Pricing

**New nav structure**:
- Primary tabs: **My Workspace** (`/workspace`), **New Analysis** (`/analysis/new`), **How It Works** (`/methodology`)
- **Resources** dropdown (replaces both "Resources" tab and "More" dropdown): contains Intelligence, FAQs, API & Integrations, Pricing — each as its own item linking to its own page
- Remove the standalone "Resources" and "Intelligence" tabs from the top bar
- Remove the old "More" dropdown entirely

Mobile menu mirrors the same grouping: Navigate section has My Workspace, New Analysis, How It Works. Resources section has Intelligence, FAQs, API & Integrations, Pricing.

---

### 3. Workspace tab label

Rename the nav label from "Workspace" to "My Workspace" in `PlatformNav.tsx` only. The `WorkspacePage` title already says "My Workspace".

---

### 4. Route cleanup

Keep all existing routes functional. The only routing change is `"/"` rendering `StartPage` instead of redirecting to `/workspace`.

---

### Technical Details

**`src/App.tsx`**:
- Import `StartPage`
- Change line 74: `<Route path="/" element={<StartPage />} />`
- Remove `/start` → `/analysis/new` redirect (line 81) since `/start` is still a valid prefix

**`src/components/PlatformNav.tsx`**:
- `PRIMARY_NAV`: `[{label: "My Workspace", path: "/workspace"}, {label: "New Analysis", path: "/analysis/new"}, {label: "How It Works", path: "/methodology"}]`
- Remove `SECONDARY_NAV` array entirely
- Rename `RESOURCES_ITEMS` to include Intelligence as first item, then FAQs, API, Pricing
- Replace the "More" button label with "Resources"
- Remove the secondary nav rendering loop and its divider
- Update mobile menu sections accordingly

