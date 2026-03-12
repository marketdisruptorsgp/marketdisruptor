import { useState } from "react";
import { useAnalyticsAdmin } from "@/hooks/useAnalyticsAdmin";
import { Shield, Layers, GitBranch, Database, Cpu, Route, AlertTriangle, Activity, ChevronDown, ChevronRight, Zap } from "lucide-react";

const TOKEN_KEY = "md_ax_admin_token";

/* ── Section data ── */

const SECTIONS = [
  {
    id: "layers",
    title: "System Layer Architecture",
    icon: Layers,
    content: `
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│                                                             │
│  Pages:                                                     │
│    StartPage → WorkspacePage → NewAnalysisPage              │
│    ReportPage → DisruptPage → RedesignPage                  │
│    StressTestPage → PitchPage → BusinessResultsPage         │
│    IntelligencePage → PricingPage → AboutPage               │
│    MethodologyPage → FaqsPage → ApiPage                     │
│                                                             │
│  Navigation: PlatformNav (desktop+mobile) + MobileBottomNav │
│  Shell: AnalysisPageShell (shared layout for all step pages)│
│  Modals: PaywallModal, WelcomeModal, ShareAnalysis          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                APPLICATION LOGIC LAYER                       │
│                                                             │
│  Context:                                                   │
│    AnalysisContext  → products, analysisId, step, all data  │
│    AuthProvider     → user, session, loading                │
│    SubscriptionProvider → tier, limits, usage               │
│                                                             │
│  Hooks:                                                     │
│    useAuth          → auth state + session management       │
│    useSubscription  → tier detection + paywall gating       │
│    useActiveModes   → mode/lens selection                   │
│    usePersistedSections → step persistence                  │
│    useHydrationGuard → prevents premature navigation        │
│    useBIExtraction  → document upload + BI extraction       │
│                                                             │
│  Engines:                                                   │
│    convergenceEngine  → multi-signal synthesis              │
│    frictionEngine     → UX friction scoring                 │
│    innovationEngine   → opportunity detection               │
│    lensOrchestrator   → lens-weighted analysis              │
│    strategicOS        → strategy generation                 │
│    confidenceGating   → data provenance + research gates    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                 AI PROCESSING LAYER                          │
│                                                             │
│  Edge Functions → Lovable AI Gateway (ai.gateway.lovable)   │
│                                                             │
│  Primary Analysis:                                          │
│    analyze-products     → product analysis (Gemini 2.5 Pro) │
│    business-model-analysis → business analysis              │
│    first-principles-analysis → first principles             │
│                                                             │
│  Intelligence:                                              │
│    generate-market-intel  → market intelligence             │
│    scout-competitors      → competitor scanning             │
│    patent-analysis        → patent intelligence             │
│    scrape-market-news     → news aggregation                │
│    scrape-trend-intel     → trend signals                   │
│                                                             │
│  Deep Analysis:                                             │
│    critical-validation    → stress testing                  │
│    generate-flip-ideas    → disruption ideas                │
│    generate-pitch-deck    → pitch synthesis                 │
│    hypothesis-interrogation → assumption testing            │
│    reasoning-interrogation  → reasoning challenges          │
│    bundle-deep-dive       → bundle analysis                 │
│                                                             │
│  Utility:                                                   │
│    extract-business-intelligence → document BI extraction   │
│    help-assistant         → in-app help                     │
│    workspace-query        → natural language workspace      │
│    share-analysis         → sharing                         │
│    generate-product-visual → visual generation              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     DATA LAYER                              │
│                                                             │
│  Supabase (Lovable Cloud)                                   │
│                                                             │
│  Core Tables:                                               │
│    saved_analyses      → all analysis records + JSON blob   │
│    profiles            → user profiles                      │
│    user_usage          → usage tracking + limits            │
│    user_lenses         → custom analysis lenses             │
│    user_streaks        → engagement streaks                 │
│                                                             │
│  Intelligence Tables:                                       │
│    market_intel        → cached market intelligence         │
│    market_news         → scraped news articles              │
│    patent_filings      → patent data                        │
│    trend_signals       → trend signals                      │
│    platform_intel      → platform-level analytics           │
│                                                             │
│  Collaboration Tables:                                      │
│    explorer_conversations → workspace AI conversations     │
│    interrogation_conversations → analysis interrogations   │
│    portfolio_action_items → action items                    │
│                                                             │
│  System Tables:                                             │
│    analytics_events    → event tracking                     │
│    analytics_sessions  → session tracking                   │
│    analytics_insights  → computed insights                  │
│    api_keys / api_usage → API management                   │
│    webhooks            → webhook configuration              │
│    referral_codes / referrals → referral system             │
└─────────────────────────────────────────────────────────────┘`,
  },
  {
    id: "component-tree",
    title: "Component Dependency Tree",
    icon: GitBranch,
    content: `
App
 ├─ QueryClientProvider
 ├─ TooltipProvider
 ├─ BrowserRouter
 │   └─ ScrollToTopProvider
 │       └─ AuthProvider (useAuth)
 │           └─ SubscriptionProvider (useSubscription)
 │               └─ AnalysisProvider (AnalysisContext)
 │                   ├─ AppRoutes
 │                   │   ├─ StartPage
 │                   │   │   ├─ PlatformNav
 │                   │   │   ├─ HeroSection
 │                   │   │   ├─ ShowcaseGallery
 │                   │   │   ├─ DemoSection
 │                   │   │   └─ AppFooter
 │                   │   │
 │                   │   ├─ WorkspacePage
 │                   │   │   ├─ PlatformNav
 │                   │   │   ├─ SavedAnalyses
 │                   │   │   │   └─ ProductCard (per analysis)
 │                   │   │   ├─ WorkspaceExplorer
 │                   │   │   │   └─ SavedConversations
 │                   │   │   └─ ActionItemsPanel
 │                   │   │
 │                   │   ├─ NewAnalysisPage
 │                   │   │   ├─ PlatformNav
 │                   │   │   ├─ AnalysisForm
 │                   │   │   │   ├─ StrategicProfileSelector
 │                   │   │   │   └─ StepLoadingTracker
 │                   │   │   └─ ContinueBanner
 │                   │   │
 │                   │   ├─ ReportPage (analysis/:id/report)
 │                   │   │   ├─ AnalysisPageShell
 │                   │   │   ├─ IntelDigest
 │                   │   │   ├─ PatentIntelligence
 │                   │   │   ├─ CompetitorScoutPanel
 │                   │   │   ├─ AssumptionsMap
 │                   │   │   ├─ StructuralDiagnosisPanel
 │                   │   │   ├─ OpportunityMatrix
 │                   │   │   └─ ExportPanel
 │                   │   │
 │                   │   ├─ DisruptPage (analysis/:id/disrupt)
 │                   │   │   ├─ AnalysisPageShell
 │                   │   │   ├─ FlippedIdeaCard[]
 │                   │   │   ├─ InsightSelector
 │                   │   │   ├─ InsightRating
 │                   │   │   └─ DecisionSynthesisPanel
 │                   │   │
 │                   │   ├─ RedesignPage (analysis/:id/redesign)
 │                   │   │   ├─ AnalysisPageShell
 │                   │   │   ├─ StructureTab
 │                   │   │   ├─ RedesignTab
 │                   │   │   └─ RedesignVisualGenerator
 │                   │   │
 │                   │   ├─ StressTestPage (analysis/:id/stress-test)
 │                   │   │   ├─ AnalysisPageShell
 │                   │   │   ├─ CriticalValidation
 │                   │   │   ├─ HypothesisInterrogation
 │                   │   │   └─ ReasoningInterrogation
 │                   │   │
 │                   │   ├─ PitchPage (analysis/:id/pitch)
 │                   │   │   ├─ AnalysisPageShell
 │                   │   │   ├─ PitchDeck
 │                   │   │   │   └─ PitchSlideFrame[]
 │                   │   │   ├─ PresentationMode
 │                   │   │   └─ PitchDeckToggle
 │                   │   │
 │                   │   └─ BusinessResultsPage (business/:id)
 │                   │       ├─ AnalysisPageShell
 │                   │       ├─ BusinessModelAnalysis
 │                   │       └─ DealEconomicsPanel
 │                   │
 │                   └─ HelpAssistantPanel (global floating)
 │
 ├─ Toaster (toast notifications)
 └─ Sonner (sonner notifications)`,
  },
  {
    id: "state-flow",
    title: "React State Flow Graph",
    icon: Activity,
    content: `
┌─────────────────── AnalysisContext State ───────────────────┐
│                                                             │
│  Variable              │ Writers              │ Readers     │
│  ──────────────────────┼──────────────────────┼──────────── │
│  products              │ handleAnalyze        │ ReportPage  │
│                        │ handleLoadSaved      │ DisruptPage │
│                        │ auto-hydration       │ All steps   │
│                        │                      │             │
│  selectedProduct       │ setSelectedProduct   │ Step pages  │
│                        │                      │ InsightSel  │
│                        │                      │             │
│  analysisId            │ handleAnalyze        │ All pages   │
│                        │ handleLoadSaved      │ saveStep    │
│                        │ URL param extract    │ sharing     │
│                        │                      │             │
│  analysisParams        │ AnalysisForm         │ NewAnalysis │
│                        │ handleLoadSaved      │ Step pages  │
│                        │                      │             │
│  step                  │ StepNavigator        │ All pages   │
│                        │ handleAnalyze        │ PlatformNav │
│                        │                      │             │
│  disruptData           │ DisruptPage fetch    │ DisruptPage │
│                        │ auto-hydration       │ PitchPage   │
│                        │                      │             │
│  stressTestData        │ StressTestPage fetch │ StressTest  │
│                        │ auto-hydration       │             │
│                        │                      │             │
│  redesignData          │ RedesignPage fetch   │ RedesignPg  │
│                        │ auto-hydration       │             │
│                        │                      │             │
│  pitchDeckData         │ PitchPage fetch      │ PitchPage   │
│                        │ auto-hydration       │             │
│                        │                      │             │
│  governedData          │ pipeline governed    │ ReportPage  │
│                        │ auto-hydration       │ Strategy    │
│                        │                      │             │
│  businessAnalysisData  │ BusinessPage fetch   │ Business    │
│                        │ auto-hydration       │             │
│                        │                      │             │
│  adaptiveContext       │ pipeline compute     │ All steps   │
│                        │ auto-hydration       │ Engines     │
│                        │                      │             │
│  userScores            │ InsightRating        │ Strategy    │
│                        │ auto-hydration       │ Pitch       │
│                        │                      │             │
│  outdatedSteps         │ saveStepData         │ StepNav     │
│                        │ handleAnalyze        │ Banners     │
└─────────────────────────────────────────────────────────────┘

⚠ RISK: Non-atomic saveStepData (read-merge-write pattern)
  → Two tabs saving simultaneously can overwrite each other
  → Fix: Postgres jsonb_set function for atomic merge

⚠ RISK: Dual-ID race in handleAnalyze
  → Client UUID generated before DB insert returns real ID
  → Pipeline outputs may reference stale client UUID briefly`,
  },
  {
    id: "pipeline",
    title: "Analysis Pipeline Flowchart",
    icon: Cpu,
    content: `
┌──────────────────────────────────────────────────────────────┐
│                    ANALYSIS PIPELINE                         │
└──────────────────────────────────────────────────────────────┘

User Input (AnalysisForm)
    │
    ├── Product Mode ──────────── scrape-products
    │                                  │
    ├── Service Mode ──────────── scrape-url-autofill (optional)
    │                                  │
    ├── Business Model Mode ─── extract-business-intelligence
    │                                  │
    └── First Principles ────── direct input
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ analyze-products │  ← Primary AI analysis
                              │      OR          │     (Gemini 2.5 Pro)
                              │ business-model   │     60-120s execution
                              │      OR          │
                              │ first-principles │
                              └────────┬────────┘
                                       │
                                       ▼
                              Context State Population
                              (products, governedData, adaptiveContext)
                                       │
                                       ▼
                              Navigate to /analysis/:id/report
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
              Intel Report       Assumptions        Competitors
              (auto-loaded)    (auto-generated)    (scout-competitors)
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
               Disrupt            Redesign          Stress Test
         (generate-flip-ideas)  (client-side)   (critical-validation)
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                                       ▼
                                 Pitch Deck
                           (generate-pitch-deck)
                                       │
                                       ▼
                              saveStepData()
                              (merge into analysis_data JSON)
                                       │
                                       ▼
                              Workspace Display
                              (saved_analyses table)`,
  },
  {
    id: "database",
    title: "Database Schema Map",
    icon: Database,
    content: `
saved_analyses
 ├── id                  (uuid, PK)
 ├── user_id             (uuid, FK → auth.users)
 ├── title               (text)
 ├── category            (text: "Technology", "Healthcare", etc.)
 ├── era                 (text: "current", "emerging")
 ├── audience            (text: "investor", "operator", etc.)
 ├── analysis_type       (text: "product"|"service"|"business_model"|"first_principles")
 ├── analysis_depth      (text: "standard"|"deep")
 ├── batch_size          (int)
 ├── product_count       (int)
 ├── products            (jsonb: scraped/input product data)
 ├── avg_revival_score   (float)
 ├── is_favorite         (boolean)
 ├── is_anonymous        (boolean)
 │
 ├── analysis_data       (jsonb) ─────────────────────────────┐
 │                                                            │
 │   ├── disrupt         → FlippedIdeaCard[] data             │
 │   │     Writers: DisruptPage                               │
 │   │     Readers: DisruptPage, PitchPage                    │
 │   │                                                        │
 │   ├── stressTest      → CriticalValidation data            │
 │   │     Writers: StressTestPage                             │
 │   │     Readers: StressTestPage                             │
 │   │                                                        │
 │   ├── pitchDeck       → PitchDeck slide data               │
 │   │     Writers: PitchPage                                  │
 │   │     Readers: PitchPage, PresentationMode               │
 │   │                                                        │
 │   ├── redesign        → Redesign tab data                  │
 │   │     Writers: RedesignPage                               │
 │   │     Readers: RedesignPage                               │
 │   │                                                        │
 │   ├── governed        → Pipeline governed output           │
 │   │     Writers: handleAnalyze (initial pipeline)           │
 │   │     Readers: ReportPage, all downstream steps          │
 │   │                                                        │
 │   ├── userScores      → User insight ratings               │
 │   │     Writers: InsightRating component                    │
 │   │     Readers: Strategy, Pitch synthesis                  │
 │   │                                                        │
 │   ├── adaptiveContext → Adaptive execution context         │
 │   │     Writers: handleAnalyze, convergenceEngine           │
 │   │     Readers: All step pages, prompt builders            │
 │   │                                                        │
 │   ├── competitorIntel → Competitor scouting data           │
 │   │     Writers: scout-competitors edge function            │
 │   │     Readers: CompetitorScoutPanel, strategy             │
 │   │                                                        │
 │   └── strategy        → Strategic synthesis                │
 │         Writers: StrategicSummaryPanel                      │
 │         Readers: PitchPage, ExportPanel                    │
 │                                                            │
 ├── created_at          (timestamptz)                         │
 └── updated_at          (timestamptz)                         │
                                                              │
 Merge function: saveStepData()                               │
   Pattern: read → spread merge → write                       │
   ⚠ Non-atomic: race condition for concurrent saves          │
──────────────────────────────────────────────────────────────┘

Related Tables:
 profiles              → user_id, first_name, last_seen_at
 user_usage            → analysis_count, bonus_analyses, period_start
 user_lenses           → custom lens configurations per user
 user_streaks          → weekly engagement tracking
 explorer_conversations → workspace AI chat (FK → saved_analyses)
 interrogation_conversations → step-level AI conversations
 portfolio_action_items → per-analysis action items`,
  },
  {
    id: "routing",
    title: "Routing + Hydration Diagram",
    icon: Route,
    content: `
┌─────────────────── Route Architecture ──────────────────────┐
│                                                             │
│  PUBLIC ROUTES (no auth required):                          │
│    /admin/analytics     → AdminAnalyticsPage                │
│    /admin/health        → AdminHealthPage                   │
│    /admin/governance    → GovernanceAuditPage                │
│    /admin/architecture  → AdminArchitecturePage (this page) │
│    /demo                → DemoPage                          │
│    /instant-analysis    → InstantAnalysisPage               │
│    /share               → SharePage                         │
│    /analysis/share/:id  → ShareableAnalysisPage             │
│                                                             │
│  AUTHENTICATED ROUTES:                                      │
│    /                    → StartPage                         │
│    /workspace           → WorkspacePage                     │
│    /analysis/new        → NewAnalysisPage                   │
│    /intelligence        → IntelligencePage                  │
│    /analysis/:id/report → ReportPage                        │
│    /analysis/:id/disrupt→ DisruptPage                       │
│    /analysis/:id/redesign → RedesignPage                    │
│    /analysis/:id/stress-test → StressTestPage               │
│    /analysis/:id/pitch  → PitchPage                         │
│    /business/:id        → BusinessResultsPage               │
│    /pricing             → PricingPage                       │
│    /about               → AboutPage                         │
│    /methodology         → MethodologyPage                   │
│    /faqs                → FaqsPage                          │
│    /api                 → ApiPage                           │
│    /pipeline            → PipelinePage                      │
│    /admin/pipeline      → PipelineObservabilityPage         │
│                                                             │
│  LEGACY REDIRECTS:                                          │
│    /portfolio       → /workspace                            │
│    /intel           → /intelligence                         │
│    /start/product   → /analysis/new                         │
│    /start/service   → /analysis/new                         │
│    /start/business  → /analysis/new                         │
│                                                             │
│  FALLBACK:                                                  │
│    Unauthenticated *  → AuthPage                           │
│    Authenticated *    → NotFound                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────── Hydration Flow ──────────────────────────┐
│                                                             │
│  Route: /analysis/:id/report                                │
│    1. Extract :id from URL params                           │
│    2. Check if analysisId matches context                   │
│    3. If mismatch → load from saved_analyses                │
│    4. Populate: products, governedData, adaptiveContext      │
│    5. useHydrationGuard prevents render until ready          │
│       (1200ms grace period)                                 │
│    6. Render step UI with hydrated data                     │
│                                                             │
│  ⚠ Risk: If hydration fails silently, UI shows empty state  │
│  ⚠ Risk: Grace period may be too short for slow connections │
└─────────────────────────────────────────────────────────────┘`,
  },
  {
    id: "risks",
    title: "Known Risks + Vulnerabilities",
    icon: AlertTriangle,
    content: `
┌─────────────────── CRITICAL RISKS ──────────────────────────┐
│                                                             │
│  1. NON-ATOMIC saveStepData                                 │
│     Severity: HIGH                                          │
│     Pattern: read analysis_data → spread merge → write      │
│     Risk: Two tabs saving simultaneously overwrite data     │
│     Fix: Create Postgres function using jsonb_set for       │
│          atomic step-level merges                           │
│                                                             │
│  2. DUAL-ID RACE CONDITION                                  │
│     Severity: MEDIUM                                        │
│     Pattern: Client UUID generated before DB insert         │
│     Risk: Pipeline outputs may reference wrong ID briefly   │
│     Fix: Await DB insert before starting pipeline           │
│                                                             │
│  3. EDGE FUNCTION TIMEOUTS                                  │
│     Severity: MEDIUM                                        │
│     Functions at risk: analyze-products, business-model     │
│     Typical: 30-90s execution, max ~150s                    │
│     Risk: "connection closed before message completed"      │
│     Fix: AbortController + defensive body reading           │
│          (applied to extract-BI, needs rollout to others)   │
│                                                             │
│  4. DUPLICATED HYDRATION LOGIC                              │
│     Severity: LOW                                           │
│     Location: handleLoadSaved + auto-hydration effect       │
│     Risk: Logic drift between two paths                     │
│     Fix: Extract shared hydrateAnalysis() function          │
│                                                             │
│  5. JSON BLOB SIZE GROWTH                                   │
│     Severity: LOW (growing)                                 │
│     Location: analysis_data in saved_analyses               │
│     Risk: As analyses accumulate steps, JSON can exceed     │
│           1MB+ causing slow loads and parse overhead         │
│     Fix: Consider normalizing heavy step data to separate   │
│          tables or lazy-loading step data on demand          │
│                                                             │
│  6. SINGLE POINT OF FAILURE: AI GATEWAY                     │
│     Severity: MEDIUM                                        │
│     All AI calls route through ai.gateway.lovable.dev       │
│     Risk: Gateway outage blocks entire analysis pipeline    │
│     Mitigation: Retry logic + user-facing error messages    │
│                                                             │
│  7. 1000-ROW QUERY LIMIT                                    │
│     Severity: LOW                                           │
│     Supabase default limit may hide analyses in workspace   │
│     Risk: Power users with 1000+ analyses lose visibility   │
│     Fix: Implement pagination in workspace queries          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────── PERFORMANCE BOTTLENECKS ─────────────────┐
│                                                             │
│  Critical Path (new analysis):                              │
│    User Input → scrape (5-15s) → AI analysis (30-90s)       │
│    → context population (< 1s) → navigation (< 1s)         │
│    Total: 35-106s end-to-end                                │
│                                                             │
│  Critical Path (step generation):                           │
│    Step trigger → edge function (10-45s) → parse + save     │
│    Total: 12-50s per step                                   │
│                                                             │
│  Critical Path (workspace load):                            │
│    Auth check → query saved_analyses → render cards          │
│    Total: 1-3s (< 100 analyses)                             │
│    Risk: Degrades with large datasets                       │
└─────────────────────────────────────────────────────────────┘`,
  },
  {
    id: "isolation",
    title: "Cross-Analysis Isolation Model",
    icon: Shield,
    content: `
┌─────────────────── ISOLATION BOUNDARIES ────────────────────┐
│                                                             │
│  Analysis A (id: aaa-111)                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ products: [Product A1, A2]                  │            │
│  │ analysis_data: { disrupt: {...}, ... }      │            │
│  │ user_id: user-001                           │            │
│  └─────────────────────────────────────────────┘            │
│         ▲ analysisId scoping                                │
│         │ saveStepData(analysisId, stepKey, data)            │
│         │ RLS: user_id = auth.uid()                         │
│                                                             │
│  Analysis B (id: bbb-222)                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ products: [Product B1]                      │            │
│  │ analysis_data: { disrupt: {...}, ... }      │            │
│  │ user_id: user-001                           │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  ISOLATION MECHANISMS:                                      │
│    ✓ Each analysis has unique UUID                          │
│    ✓ All saves scoped by analysisId                         │
│    ✓ Context resets on new analysis                         │
│    ✓ URL params enforce correct analysis loading            │
│    ✓ RLS policies enforce user ownership                    │
│                                                             │
│  ⚠ CONTAMINATION RISK:                                      │
│    - AnalysisContext is a singleton                         │
│    - If user navigates between analyses without full        │
│      context reset, stale data from Analysis A may          │
│      briefly appear on Analysis B                           │
│    - Mitigation: auto-hydration effect detects ID mismatch  │
│      and reloads from database                              │
│                                                             │
│  ⚠ MULTI-TAB RISK:                                          │
│    - Tab A: Analysis A context                              │
│    - Tab B: Analysis B context                              │
│    - Each tab has independent React state (safe)            │
│    - DB writes from both tabs use read-merge-write          │
│    - If both save to SAME analysis: last write wins         │
└─────────────────────────────────────────────────────────────┘`,
  },
  {
    id: "edge-functions",
    title: "Edge Function Reliability Profile",
    icon: Zap,
    content: `
┌─────────────────── EDGE FUNCTION PROFILES ──────────────────┐
│                                                             │
│  Function                    │ Avg Time │ Risk    │ Status  │
│  ────────────────────────────┼──────────┼─────────┼──────── │
│  analyze-products            │ 30-90s   │ HIGH    │ ⚠       │
│  business-model-analysis     │ 30-60s   │ HIGH    │ ⚠       │
│  first-principles-analysis   │ 20-45s   │ MEDIUM  │ ⚠       │
│  extract-business-intel      │ 15-60s   │ MEDIUM  │ ✓ Fixed │
│  generate-flip-ideas         │ 10-25s   │ LOW     │ ✓       │
│  generate-pitch-deck         │ 15-30s   │ MEDIUM  │ ⚠       │
│  critical-validation         │ 10-20s   │ LOW     │ ✓       │
│  scout-competitors           │ 10-20s   │ LOW     │ ✓       │
│  generate-market-intel       │ 10-20s   │ LOW     │ ✓       │
│  hypothesis-interrogation    │ 5-15s    │ LOW     │ ✓       │
│  reasoning-interrogation     │ 5-15s    │ LOW     │ ✓       │
│  bundle-deep-dive            │ 10-20s   │ LOW     │ ✓       │
│  help-assistant              │ 3-10s    │ LOW     │ ✓       │
│  workspace-query             │ 5-15s    │ LOW     │ ✓       │
│  share-analysis              │ 1-3s     │ LOW     │ ✓       │
│  scrape-products             │ 5-15s    │ MEDIUM  │ ⚠       │
│  scrape-url-autofill         │ 3-10s    │ LOW     │ ✓       │
│  scrape-market-news          │ 5-15s    │ LOW     │ ✓       │
│  patent-analysis             │ 10-20s   │ LOW     │ ✓       │
│                                                             │
│  ⚠ = Timeout risk, needs AbortController + defensive read   │
│  ✓ = Within safe execution limits                           │
│  ✓ Fixed = Recently hardened (extract-BI)                   │
│                                                             │
│  Common Error: "connection closed before message completed" │
│  Root Causes:                                               │
│    1. AI response exceeds edge function timeout             │
│    2. Large JSON payload causes slow body transfer          │
│    3. User navigates away before response completes         │
│    4. Gateway drops connection on slow generation           │
│                                                             │
│  Recommended Fix Pattern:                                   │
│    const ctrl = new AbortController();                      │
│    const timeout = setTimeout(() => ctrl.abort(), 150_000); │
│    try {                                                    │
│      response = await fetch(url, { signal: ctrl.signal });  │
│      rawText = await response.text();                       │
│      data = JSON.parse(rawText);                            │
│    } catch { ... } finally { clearTimeout(timeout); }       │
└─────────────────────────────────────────────────────────────┘`,
  },
];

/* ── Components ── */

function SectionBlock({ section, isOpen, onToggle }: { section: typeof SECTIONS[0]; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="p-2 rounded-lg bg-white/5">
          <Icon className="w-4 h-4 text-white/70" />
        </span>
        <span className="text-sm font-semibold text-white flex-1">{section.title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/10">
          <pre className="text-xs text-white/70 font-mono whitespace-pre overflow-x-auto leading-relaxed pt-3">
            {section.content.trim()}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AdminArchitecturePage() {
  const { authenticated, login, logout } = useAnalyticsAdmin();
  const [tokenInput, setTokenInput] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["layers"]));

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(SECTIONS.map((s) => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full max-w-sm">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Architecture Docs Access
          </h3>
          <input
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm mb-3 placeholder:text-white/30"
            placeholder="Enter admin token"
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tokenInput && login(tokenInput)}
          />
          <button
            onClick={() => tokenInput && login(tokenInput)}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Access Architecture Docs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">System Architecture</h1>
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <a href="/admin/analytics" className="text-xs text-white/40 hover:text-white/60">Analytics</a>
            <span className="text-white/20">·</span>
            <a href="/admin/health" className="text-xs text-white/40 hover:text-white/60">Health</a>
            <span className="text-white/20">·</span>
            <a href="/admin/governance" className="text-xs text-white/40 hover:text-white/60">Governance</a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="text-xs text-white/40 hover:text-white/60 px-2 py-1">Expand All</button>
          <button onClick={collapseAll} className="text-xs text-white/40 hover:text-white/60 px-2 py-1">Collapse All</button>
          <button onClick={logout} className="text-xs text-white/40 hover:text-white/60 px-2 py-1">Logout</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-3">
        <p className="text-xs text-white/40 mb-2">
          Complete platform architecture reference. {SECTIONS.length} diagnostic sections covering layers, state, pipelines, and risks.
        </p>
        {SECTIONS.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggle(section.id)}
          />
        ))}
      </div>
    </div>
  );
}
