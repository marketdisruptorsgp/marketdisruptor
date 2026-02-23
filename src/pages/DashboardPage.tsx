import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { AnalysisForm, type AnalysisMode } from "@/components/AnalysisForm";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import { BusinessModelAnalysis, type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import WelcomeModal from "@/components/WelcomeModal";
import { ContextualTip } from "@/components/ContextualTip";
import MobileTour from "@/components/MobileTour";
import { HeroSection } from "@/components/HeroSection";
import { DisruptionPathBanner } from "@/components/DisruptionPathBanner";
import { LoadingTracker } from "@/components/LoadingTracker";
import PaywallModal from "@/components/PaywallModal";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, Upload, Briefcase, Building2, ShieldCheck, BookOpen,
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

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { remainingAnalyses, tier } = useSubscription();
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("welcomed_" + (user?.id ?? ""));
  });
  const [selectedMode, setSelectedMode] = useState<"custom" | "service" | "business" | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Sync local selectedMode with context (e.g. when mode changed from PlatformNav)
  useEffect(() => {
    const ctx = analysis.mainTab;
    if (ctx === "custom" || ctx === "service" || ctx === "business") {
      setSelectedMode(ctx);
    }
  }, [analysis.mainTab]);
  const modeTabsRef = useRef<HTMLDivElement>(null);

  // Cycling word state
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

  const handleCloseWelcome = () => {
    localStorage.setItem("welcomed_" + (user?.id ?? ""), "1");
    setShowWelcome(false);
  };

  const handleModeSelect = (mode: "custom" | "service" | "business") => {
    setSelectedMode(mode);
    analysis.setMainTab(mode);
    analysis.setActiveMode(mode as AnalysisMode);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleStartAnalysis = () => {
    modeTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isLoading = analysis.step === "scraping" || analysis.step === "analyzing";

  const modeColor = selectedMode
    ? MODE_PILLS.find((m) => m.id === selectedMode)?.cssVar ?? "--mode-product"
    : "--mode-product";

  return (
    <div className="min-h-screen bg-background">
      {showWelcome && profile && (
        <WelcomeModal firstName={profile.first_name} onClose={handleCloseWelcome} />
      )}
      {user && !showWelcome && <MobileTour userId={user.id} />}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <HeroSection tier={tier} remainingAnalyses={remainingAnalyses()} profileFirstName={profile?.first_name} onOpenSaved={() => setShowSavedPanel(true)} savedCount={savedCount} />

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
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
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
          <p className="text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
            Deconstruct markets, stress-test strategies, and build what's next with AI-powered competitive intelligence.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={handleStartAnalysis}
              className="btn-primary"
            >
              Start Analysis
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-6 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground transition-colors hover:bg-muted"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Mode Pills */}
      <div ref={modeTabsRef} className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-3">
            {MODE_PILLS.map((pill) => {
              const Icon = pill.icon;
              const isActive = selectedMode === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => handleModeSelect(pill.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors"
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
                  <Icon size={15} />
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analysis Form (shown when mode selected) */}
      {selectedMode && (
        <main className="max-w-4xl mx-auto px-6 py-10" ref={formRef}>
          <div
            className="rounded-lg overflow-hidden border border-border bg-card shadow-sm"
            style={{ borderTop: `3px solid hsl(var(${modeColor}))` }}
          >
            <div className="px-5 pt-4 pb-2 border-b border-border">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: `hsl(var(${modeColor}))` }}
              >
                {selectedMode === "custom" ? "Disrupt This Product" : selectedMode === "service" ? "Disrupt This Service" : "Disrupt This Business Model"}
              </p>
            </div>
            <div className="p-6">
              <ContextualTip
                id="discovery-tip-1"
                message={`Pro tip, ${profile?.first_name ?? "explorer"}: The best opportunities are in weird niches — try '70s Fitness Equipment', 'Y2K Gadgets', or 'Retro Office Tech'. The stranger the category, the less competition you'll face.`}
              />
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

          {/* Loading tracker */}
          {isLoading && (
            <div className="mt-8">
              <LoadingTracker
                step={analysis.step as "scraping" | "analyzing"}
                elapsedSeconds={analysis.elapsedSeconds}
                loadingLog={analysis.loadingLog}
              />
            </div>
          )}

          {/* Error */}
          {analysis.step === "error" && (
            <div className="mt-8 p-6 rounded-lg flex items-start gap-3 bg-destructive/5 border border-destructive/20">
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

      {/* Methodology strip */}
      <DisruptionPathBanner />

      {/* Footer */}
      <footer className="border-t border-border mt-0">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck size={11} /> Your data is encrypted & never shared</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1"><BookOpen size={11} /> Analyses scoped to your account via RLS</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="font-semibold text-primary hover:underline">Enterprise & Teams</a>
          </div>
        </div>
        <div className="border-t border-border py-6 text-center">
          <p className="text-xs">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-opacity hover:opacity-80 text-primary">
              Built by SGP Capital
            </a>
            <span className="text-muted-foreground"> · </span>
            <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
            {profile && <span className="text-muted-foreground"> · Signed in as <strong className="text-foreground">{profile.first_name}</strong></span>}
          </p>
        </div>
      </footer>
    </div>
  );
}
