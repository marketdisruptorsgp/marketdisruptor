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
│  Edge Functions → AI Gateway                                │
│                                                             │
│  Phase 1 — Foundation:                                      │
│    structural-decomposition → product/service/biz parsing   │
│    scrape-products        → web scraping (specs, pricing)   │
│    analyze-products       → photo analysis (image→product)  │
│    photo-analysis         → image recognition pipeline      │
│    scrape-market-news     → market news & trend signals     │
│    geo-market-data        → geographic market sizing        │
│    research-competitive-positioning → competitor scouting   │
│                                                             │
│  Phase 1.5 — Confidence Gating (cross-cutting):             │
│    confidenceGating.ts    → 7-domain confidence assessment  │
│    Provenance tags: SCRAPED | PARAMETRIC | AI_INFERRED      │
│    Low-confidence gates → research questions (score < 0.4)  │
│                                                             │
│  Phase 2 — Synthesis:                                       │
│    strategic-synthesis    → hidden assumptions, flipped     │
│                             logic, friction analysis         │
│    transformation-engine  → structural redesign concepts    │
│                                                             │
│  Phase 3 — Concepts:                                        │
│    concept-architecture   → morphological design space      │
│    concept-synthesis      → product cards, unit economics   │
│    generate-product-visual → AI visual mockups              │
│    generate-opportunity-vectors → opportunity detection     │
│                                                             │
│  Phase 4 — Validation + Pitch:                              │
│    critical-validation    → red/green team validation       │
│    generate-pitch-deck    → 5-slide pitch synthesis         │
│    business-model-analysis → business model analysis        │
│    analyze-business-structure → structural biz analysis     │
│    industry-benchmarks    → industry benchmark data         │
│                                                             │
│  Utility:                                                   │
│    help-assistant         → in-app help                     │
│    api-proxy              → external API routing            │
│    fire-webhook           → webhook dispatch                │
│    compute-analytics-insights → platform analytics          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     DATA LAYER                              │
│                                                             │
│  Supabase (managed hosting)                                 │
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
└─────────────────────────────────────────────────────────────┘
