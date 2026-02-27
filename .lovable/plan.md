

# Downplay AI References Across the Platform

## Goal
Replace prominent "AI" language with outcome-focused, plain-language alternatives throughout the user-facing UI. Keep FAQ and Methodology pages as-is (technical users who go there expect detail). Internal function names and error handlers stay unchanged.

## Files & Changes

### 1. `src/pages/DashboardPage.tsx`
- Line 102: `"...with AI-powered competitive intelligence"` → `"...with deep competitive intelligence"`

### 2. `src/pages/StartPage.tsx`
- Line 76: `"Each applies rigorous, AI-powered scrutiny"` → `"Each applies rigorous, data-driven scrutiny"`

### 3. `src/components/DisruptionPathBanner.tsx`
- Line 26 detail: `"The AI breaks down the product..."` → `"The platform breaks down the product..."` 
- Line 77: `"Six stages of AI-powered analysis"` → `"Six stages of structured analysis"`

### 4. `src/components/StartPageLayout.tsx`
- Line 20: `"the AI uses computer vision..."` → `"the platform uses visual analysis..."` 
- Line 31: `"the AI maps the entire customer journey..."` → `"the platform maps the entire customer journey..."`
- Line 32: `"gives the AI a sharper starting point"` → `"gives the analysis a sharper starting point"`

### 5. `src/components/WelcomeModal.tsx`
- Line 18: `"Proprietary multi-model AI pipelines — not a wrapper"` → `"Proprietary multi-source data pipelines"`
- Line 19: `"Deep web crawling, vision AI, and strategic analysis"` → `"Deep web crawling, visual analysis, and strategic modeling"`
- Line 27: `"let the AI tear it apart"` → `"let the platform tear it apart"`
- Line 28: `"the AI runs proprietary crawling pipelines"` → `"the platform runs proprietary crawling pipelines"`
- Line 31: `"AI challenges every assumption"` → `"Every assumption gets challenged"`
- Line 40: `"the AI maps competitive landscapes"` → `"the platform maps competitive landscapes"`
- Line 52: `"the AI breaks down cost structures"` → `"the platform breaks down cost structures"`

### 6. `src/pages/SharePage.tsx`
- Line 8: `"AI Product Intelligence"` → `"Product Intelligence"`
- Line 9: `"powered by AI"` → remove
- Line 19: `"AI-generated product concepts"` → `"Data-driven product concepts"`
- Line 81: `"AI-Powered Product Intelligence"` → `"Deep Product Intelligence"`
- Line 93: `"AI platform that scrapes..."` → `"intelligence platform that scrapes..."`
- Line 127: `"advanced AI reasoning"` → `"advanced analytical reasoning"`

### 7. `src/pages/AboutPage.tsx`
- Line 22: `"Not a surface-level tool or a simple AI wrapper"` → `"Not a surface-level tool or a simple wrapper"`
- Line 25: `"advanced multi-model AI, real-time data analysis, computer vision"` → `"advanced analytical models, real-time data analysis, computer vision"`

### 8. `src/components/LoadingTracker.tsx`
- Line 16: `{ label: "AI Reasoning", detail: "Parsing all collected data" }` → `{ label: "Deep Analysis", detail: "Parsing all collected data" }`

### 9. `src/components/StepLoadingTracker.tsx`
- Line 17: `"Initializing AI reasoning engine…"` → `"Initializing analysis engine…"`

### 10. `src/pages/Index.tsx`
- Line 98: `label: "AI Analysis"` → `label: "Deep Analysis"`
- Line 412: `"Gemini AI building deep intelligence..."` → `"Building deep intelligence..."`
- Line 415: `"AI reasoning — parsing..."` → `"Parsing product data & community sentiment..."`
- Line 462: `"No products returned by AI."` → `"No products returned from analysis."`

### 11. `src/contexts/AnalysisContext.tsx`
- Same loading log changes as Index.tsx (lines 331, 334): remove "Gemini AI" / "AI reasoning" prefixes

### 12. `src/components/BusinessModelAnalysis.tsx`
- Line 204: `"AI credits exhausted"` → `"Analysis credits exhausted"`
- Line 367: `"Steer the AI — add direction"` → `"Refine your analysis — add direction"`
- Line 585: `"AI Opportunities & Platform Potential"` → `"Technology Opportunities & Platform Potential"`

### 13. `src/components/FirstPrinciplesAnalysis.tsx`
- Line 381: `"AI credits exhausted"` → `"Analysis credits exhausted"`
- Line 690: `"Steer the AI — add direction"` → `"Refine your analysis — add direction"`

### 14. `src/components/CriticalValidation.tsx`
- Line 198: `"Steer the AI — add direction"` → `"Refine your analysis — add direction"`

### 15. `src/components/SteeringPanel.tsx`
- Line 10: default title `"Guide the AI"` → `"Guide Your Analysis"`

### 16. `src/components/portfolio/ActionItemsPanel.tsx`
- Line 78: `"get AI-powered suggestions"` → `"get smart suggestions"`
- Line 98: `"AI credits exhausted"` → `"Analysis credits exhausted"`
- Line 330: `"generate AI suggestions"` → `"generate suggestions"`

### 17. `src/pages/PricingPage.tsx`
- Line 62: `"advanced AI capabilities"` → `"advanced analysis capabilities"`

## NOT changed (intentionally kept)
- `src/pages/FaqsPage.tsx` — technical audience expects AI detail
- `src/pages/MethodologyPage.tsx` — methodology page is for informed users
- `src/pages/ResourcesPage.tsx` — "AI-Powered Tutoring" is a product name in example data
- Edge function prompts — backend only, users never see these
- Internal function/variable names (e.g. `generateAISuggestions`) — no user impact

