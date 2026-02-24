import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { AnalysisForm, type AnalysisMode } from "@/components/AnalysisForm";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import { BusinessModelAnalysis, type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";

import { ContextualTip } from "@/components/ContextualTip";
import MobileTour from "@/components/MobileTour";
import { HeroSection } from "@/components/HeroSection";
import { DisruptionPathBanner } from "@/components/DisruptionPathBanner";
import { Target } from "lucide-react";
import { LoadingTracker } from "@/components/LoadingTracker";
import PaywallModal from "@/components/PaywallModal";
import { MarketChangeAlert } from "@/components/MarketChangeAlert";
import { StreakBadge } from "@/components/StreakBadge";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, Upload, Briefcase, Building2, ShieldCheck, BookOpen,
  Rocket, TrendingUp, Users, FileText, ArrowRight,
} from "lucide-react";

const MODE_WORDS = [
  { label: "product", mode: "custom" as const, color: "hsl(var(--mode-product))" },
  { label: "service", mode: "service" as const, color: "hsl(var(--mode-service))" },
  { label: "business model", mode: "business" as const, color: "hsl(var(--mode-business))" },
];

const MODE_PILLS = [
  { id: "custom" as const, label: "Product", icon: Upload, cssVar: "--mode-product" },
  { id: "service" as const, label: "Service", icon: Briefcase, cssVar: "--mode-service" },
  { id: "business" as const, label: "Business Model", icon: Building2, cssVar: "--mode-business" },
];

const MODE_TIPS: Record<"custom" | "service" | "business", string[]> = {
  custom: [
    "Upload a product photo alongside the URL — the AI uses computer vision to catch design details that text listings miss, like material quality, ergonomic flaws, and packaging inefficiencies.",
    "Add competitor URLs in the same batch. The analysis cross-references pricing, features, and positioning across all inputs to find gaps no single product review would reveal.",
    "The Disrupt step doesn't just improve — it deliberately flips every assumption. If a product is heavy, it asks: what if weight is the feature? That's where breakthrough ideas live.",
    "After analysis, use the Red Team / Green Team debate to stress-test the AI's own conclusions. The best strategies survive adversarial scrutiny.",
  ],
  service: [
    "Paste your service's landing page URL — the AI maps the entire customer journey, from first impression to post-purchase, and flags friction points competitors accept as normal.",
    "Describe your service in the notes field even if you add a URL. Insider context about operational pain points gives the AI a sharper starting point for deconstruction.",
    "Service analysis skips product-centric logic and focuses on what matters: customer journey friction, operational workflows, and where technology can create structural advantages.",
    "The best service disruptions come from questioning delivery models, not just pricing. The AI tests configurations like unbundling, self-service layers, and subscription pivots.",
  ],
  business: [
    "Be specific about your revenue model and pain points — the more context you provide, the deeper the AI can go on operational audits and revenue reinvention.",
    "The analysis deconstructs your model across multiple dimensions: core reality, operations audit, revenue structure, and adjacency opportunities most teams overlook.",
    "Try running the same business type with different geography or scale inputs. A laundromat strategy in a dense urban market looks completely different from a suburban one.",
    "After the intelligence report, the Disrupt step generates flipped concepts you can guide with custom goals — tell the AI what constraints or objectives matter most to you.",
  ],
};

const SESSION_SEED = Math.random();

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { remainingAnalyses, tier } = useSubscription();
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [selectedMode, setSelectedMode] = useState<"custom" | "service" | "business" | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = analysis.mainTab;
    if (ctx === "custom" || ctx === "service" || ctx === "business") {
      setSelectedMode(ctx);
    }
  }, [analysis.mainTab]);
  const modeTabsRef = useRef<HTMLDivElement>(null);

  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % MODE_WORDS.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  const handleModeSelect = (mode: "custom" | "service" | "business") => {
    setSelectedMode(mode);
    analysis.setMainTab(mode);
    analysis.setActiveMode(mode as AnalysisMode);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };


  const isLoading = analysis.step === "scraping" || analysis.step === "analyzing";

  const modeColor = selectedMode
    ? MODE_PILLS.find((m) => m.id === selectedMode)?.cssVar ?? "--mode-product"
    : "--mode-product";

  return (
    <div className="min-h-screen bg-background">
      {user && <MobileTour userId={user.id} />}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <HeroSection tier={tier} remainingAnalyses={remainingAnalyses()} profileFirstName={profile?.first_name} onOpenSaved={() => setShowSavedPanel(true)} savedCount={savedCount} />

      {/* Market Change Notifications */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <MarketChangeAlert />
      </div>

      <Sheet open={showSavedPanel} onOpenChange={setShowSavedPanel}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Saved Projects</SheetTitle>
            <SheetDescription>Click any project to reload its full analysis</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SavedAnalyses
              onLoad={(a) => { analysis.handleLoadSaved(a); setShowSavedPanel(false); }}
              refreshTrigger={analysis.savedRefreshTrigger}
              onCountChange={setSavedCount}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Hero Section */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-5 sm:pb-10 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Rethink any{" "}
            <span
              className="inline-block transition-opacity duration-300"
              style={{
                opacity: visible ? 1 : 0,
                color: MODE_WORDS[wordIndex].color,
              }}
            >
              {MODE_WORDS[wordIndex].label}
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed px-2">
            Deconstruct markets, stress-test strategies, and build what's next with AI-powered competitive intelligence.
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6">
            <button
              onClick={() => navigate("/about")}
              className="px-4 sm:px-6 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground transition-colors hover:bg-muted"
            >
              Learn More
            </button>
          </div>
          {/* Streak Badge */}
          <div className="flex justify-center mt-3">
            <StreakBadge />
          </div>

          {/* Built For */}
          <p className="text-sm sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-8 sm:mt-10 mb-3 sm:mb-4 text-center">Built For</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-3xl mx-auto text-left">
            {[
              { icon: Rocket, title: "Entrepreneurs", desc: "Data-driven conviction, not guesswork." },
              { icon: TrendingUp, title: "Investors", desc: "Adversarial rigor before committing capital." },
              { icon: Users, title: "Product Teams", desc: "Stress-test strategy before launch." },
              { icon: FileText, title: "Agencies", desc: "Data-backed perspectives beyond surface-level." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-3 sm:p-5 flex flex-col items-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-2.5">
                  <Icon size={16} className="text-primary" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground mb-0.5">{title}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Pipeline — prominent position */}
      <DisruptionPathBanner />

      {/* Scrutiny CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        <div
          className="rounded-2xl px-5 py-6 sm:py-8 text-center cursor-pointer transition-all hover:shadow-md"
          style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          onClick={() => {
            const formEl = document.querySelector('[data-tour="analysis-form"]');
            if (formEl) {
              formEl.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              // If no mode selected yet, select Product and scroll
              handleModeSelect("custom");
            }
          }}
        >
          <p className="text-sm sm:text-base font-bold text-foreground mb-1.5">
            Apply a level of scrutiny that exceeds normal bandwidth.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            See what a deep deconstruction reveals about your market.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm font-semibold text-primary-foreground transition-colors"
            style={{ background: "hsl(var(--primary))" }}
          >
            Start Analysis <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Value Proposition Callout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 my-6 sm:my-10">
        <div className="rounded-2xl px-4 sm:px-5 py-4 sm:py-5 flex items-start gap-3 sm:gap-4" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <Target size={18} className="flex-shrink-0 mt-0.5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground mb-1">What to expect</p>
            <p className="text-xs leading-relaxed text-foreground/70">
              The goal isn't to promise a "better" answer every time. The goal is to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth — revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
            </p>
          </div>
        </div>
      </div>


      {/* Mode Pills */}
      <div ref={modeTabsRef} className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {MODE_PILLS.map((pill) => {
              const Icon = pill.icon;
              const isActive = selectedMode === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => handleModeSelect(pill.id)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors"
                  style={
                    isActive
                      ? {
                          backgroundColor: `hsl(var(${pill.cssVar}))`,
                          borderColor: `hsl(var(${pill.cssVar}))`,
                          color: "white",
                        }
                      : {
                          borderColor: "hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }
                  }
                >
                  <Icon size={14} />
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analysis Form */}
      {selectedMode && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10" ref={formRef}>
          <div
            className="rounded-lg overflow-hidden border border-border bg-card shadow-sm"
            style={{ borderTop: `3px solid hsl(var(${modeColor}))` }}
          >
            <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 border-b border-border">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: `hsl(var(${modeColor}))` }}
              >
                {selectedMode === "custom" ? "Disrupt This Product" : selectedMode === "service" ? "Disrupt This Service" : "Disrupt This Business Model"}
              </p>
            </div>
            <div className="p-4 sm:p-6">
              {(() => {
                const tips = MODE_TIPS[selectedMode!];
                const tipIndex = Math.floor(SESSION_SEED * tips.length);
                const tipColor = `hsl(var(${modeColor}))`;
                return (
                  <ContextualTip
                    id={`tip-${selectedMode}-${tipIndex}`}
                    message={tips[tipIndex]}
                    accentColor={tipColor}
                  />
                );
              })()}
              <div className="mt-4" data-tour="analysis-form">
                <AnalysisForm
                  onAnalyze={analysis.handleAnalyze}
                  isLoading={isLoading}
                  mode={analysis.activeMode}
                  onModeChange={(m) => {
                    analysis.setActiveMode(m);
                    analysis.setMainTab(m as typeof analysis.mainTab);
                  }}
                  onBusinessAnalysis={(data) => {
                    analysis.setBusinessAnalysisData(data as BusinessModelAnalysisData);
                    const id = crypto.randomUUID();
                    analysis.setAnalysisId(id);
                    navigate(`/business/${id}`);
                  }}
                />
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="mt-6 sm:mt-8">
              <LoadingTracker
                step={analysis.step as "scraping" | "analyzing"}
                elapsedSeconds={analysis.elapsedSeconds}
                loadingLog={analysis.loadingLog}
              />
            </div>
          )}

          {analysis.step === "error" && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-lg flex items-start gap-3 bg-destructive/5 border border-destructive/20">
              <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-destructive">Analysis Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{analysis.errorMsg}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Try a more specific category or reduce batch size.
                </p>
              </div>
            </div>
          )}
        </main>
      )}


      {/* Footer */}
      <footer className="border-t border-border mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1"><ShieldCheck size={11} /> Your data is encrypted & never shared</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1"><BookOpen size={11} /> Analyses scoped to your account via RLS</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="font-semibold text-primary hover:underline py-1">Enterprise & Teams</a>
          </div>
        </div>
        <div className="border-t border-border py-5 sm:py-6 text-center px-4">
          <p className="text-xs leading-relaxed">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-opacity hover:opacity-80 text-primary">
              Built by SGP Capital
            </a>
            {profile && <span className="text-muted-foreground"> · Signed in as <strong className="text-foreground">{profile.first_name}</strong></span>}
          </p>
        </div>
      </footer>
    </div>
  );
}