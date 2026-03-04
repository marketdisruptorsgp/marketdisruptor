

# ETA Buyer Strategic Expansion Plan

## The ETA Buyer Journey — Where You Play

```text
SEARCH & SCREEN          DUE DILIGENCE           DEAL STRUCTURE          DAY 1-90              ONGOING OWNERSHIP
─────────────────        ─────────────────        ──────────────          ──────────────         ─────────────────
Find listings            Upload CIM               Valuation sanity       100-day playbook       Track improvements
Quick "worth a look?"    Deep-dive operations     SBA math check         Quick wins execution   Re-run analysis
Compare 3-5 deals        Owner dependency risk    LOI talking points     Team transition plan   Quarterly pulse
                         Hidden value discovery   Negotiation ammo       Baseline metrics       Exit readiness
                         ↑                        ↑                      ↑                      ↑
                    [YOU ARE HERE]           [GAPS TODAY]           [GAPS TODAY]           [GAPS TODAY]
```

Your platform already covers the "Deep Diligence" phase well with the BI extraction + Business Model analysis + ETA lens. But the buyer doesn't stop there. Here's where to push.

---

## Phase 1: CIM-Specific Intelligence (Biggest Impact, Fastest Build)

The current BI extractor is generic. CIMs have a predictable structure that, when parsed with domain awareness, unlocks massively more value.

### What to build

**Enhanced extraction schema for CIM documents** — when the ETA lens is active and a document is uploaded, the extraction engine adds an ETA-specific layer:

- **Financial snapshot**: SDE (Seller's Discretionary Earnings), revenue, COGS, addbacks the seller claims, margins. Flag missing financials.
- **Owner dependency score**: How many customer relationships, vendor relationships, and operational decisions run through the owner? This is the #1 killer of ETA deals.
- **Customer concentration risk**: % of revenue from top 1/3/5 customers. Flag if >25% from any single customer.
- **Employee dependency map**: Key-person risk, institutional knowledge gaps, management layer assessment.
- **Addback skepticism**: CIM addbacks are notoriously inflated. Flag each claimed addback with a confidence rating and note common broker inflation patterns.
- **Missing information flags**: What a CIM *should* tell you but didn't — a checklist of due diligence questions to ask the broker.

### Files to change
- `supabase/functions/extract-business-intelligence/index.ts` — Add conditional ETA extraction schema when lens context is provided
- `src/hooks/useBIExtraction.ts` — Extend `BIExtraction` type with optional `eta_assessment` field
- `src/components/AnalysisForm.tsx` — Pass active lens to extraction call so the edge function knows to apply ETA schema

---

## Phase 2: Deal Economics Calculator

ETA buyers live and die by SBA math. No tool does this well for them.

### What to build

A **Deal Economics Panel** that appears in the Business Model results when ETA lens is active:

- **SBA 7(a) loan calculator**: Given asking price, estimate down payment (10-20%), monthly debt service, required cash flow to cover DSCR (typically 1.25x)
- **Valuation sanity check**: Compare asking price to SDE multiple. Flag if multiple is above industry norms (pull from the analysis data)
- **Break-even timeline**: Given current SDE + identified improvements from the analysis, when does the deal math work?
- **Sensitivity table**: What happens to returns if revenue drops 10/20/30%? If one improvement doesn't materialize?

### Files to change
- New component: `src/components/DealEconomicsPanel.tsx`
- `src/components/BusinessModelAnalysis.tsx` — Add new tab "Deal Economics" when ETA lens is active
- Edge function enhancement or client-side calculation (pure math, no AI needed)

---

## Phase 3: Owner Dependency Deep Dive

This deserves its own section because it's the single biggest risk ETA buyers face and brokers actively downplay it.

### What to build

Expand the business model analysis prompt (when ETA lens active) to produce a structured **Owner Dependency Assessment**:

- **Relationship concentration**: Which customer/vendor/partner relationships are personal to the owner?
- **Knowledge concentration**: What operational knowledge exists only in the owner's head?
- **Transition risk score** (1-10): How likely is value destruction during ownership transition?
- **Mitigation playbook**: Specific actions to de-risk each dependency (e.g., "Document pricing logic before close", "Introduce key accounts to buyer during transition period")

### Files to change
- `supabase/functions/business-model-analysis/index.ts` — Add owner dependency section to JSON schema when ETA lens detected
- `src/components/BusinessModelAnalysis.tsx` — Render the new section

---

## Phase 4: 100-Day Ownership Playbook

After the analysis identifies improvements, generate a phased action plan specifically framed for a new owner.

### What to build

A **post-acquisition playbook** generated from the analysis findings:

- **Week 1-2**: Listen & learn actions (don't change anything yet)
- **Month 1**: Quick wins from the operational audit (low-effort, high-impact items)
- **Month 2-3**: Process improvements and pricing changes
- **Month 3-6**: Structural changes, new revenue streams
- **Month 6-12**: Scale plays and technology enablement

This already partially exists in the `reinventedModel.implementationRoadmap` — but it's framed as "disruption" language. For ETA, reframe as ownership-transition language.

### Files to change
- `supabase/functions/business-model-analysis/index.ts` — Add `ownership_playbook` to output schema (conditional on ETA lens)
- New component: `src/components/OwnershipPlaybook.tsx`
- Wire into Business Model results as a new tab

---

## Phase 5: Deal Comparison View

ETA buyers evaluate 50-100 CIMs to find 3-5 serious candidates. They need side-by-side comparison.

### What to build

Extend the existing Portfolio page to support **ETA comparison mode**:

- Side-by-side comparison of 2-3 saved business analyses
- Compare across: SDE, owner dependency, customer concentration, improvement potential, deal economics
- Highlight which deal has better risk/reward profile
- "Which would you buy?" synthesis using the ETA lens priorities

### Files to change
- `src/pages/PortfolioPage.tsx` — Add comparison mode for business model analyses
- `src/components/portfolio/ComparisonInsightView.tsx` — Extend for ETA-specific dimensions

---

## Phase 6: Post-Acquisition Pulse (Ongoing Value)

This is what makes them *keep coming back*. After they buy, they re-run analysis quarterly to track progress.

### What to build

- **Re-analysis with baseline**: When re-running a business model analysis on a previously saved business, show delta against the original analysis
- **Improvement tracker**: Which quick wins from the playbook have been executed? What's the estimated impact?
- **Evolution view**: Already exists in `src/components/analysis/EvolutionView.tsx` — extend it to support business model comparisons over time

### Files to change
- `src/components/analysis/EvolutionView.tsx` — Support business model type
- `src/pages/PortfolioPage.tsx` — "Re-analyze" action on saved business analyses

---

## Implementation Priority

| Phase | Impact | Effort | Build Order |
|-------|--------|--------|-------------|
| 1. CIM-specific extraction | Very High | Medium | First — immediate differentiation |
| 2. Deal economics calculator | Very High | Low | Second — pure math, no AI cost |
| 3. Owner dependency deep dive | High | Low | Third — prompt enhancement only |
| 4. 100-day playbook | High | Medium | Fourth — reframes existing output |
| 5. Deal comparison | Medium | Medium | Fifth — extends existing portfolio |
| 6. Post-acquisition pulse | Medium | Medium | Sixth — retention/stickiness play |

## Architectural Approach

- All ETA-specific features are **conditionally rendered** based on active lens type. Non-ETA users never see them.
- No new edge functions needed for Phase 2 (client-side math). Phases 1, 3, 4 are prompt/schema enhancements to existing functions.
- The ETA lens already injects into all downstream analysis steps. These changes make the *input* and *output* layers ETA-aware, not just the reasoning layer.

