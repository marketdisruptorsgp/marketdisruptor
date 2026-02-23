import React, { useState, useRef } from "react";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Upload, Briefcase, Building2, Telescope, AlertCircle,
} from "lucide-react";

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
  const businessResultsRef = useRef<HTMLDivElement>(null);

  const handleCloseWelcome = () => {
    localStorage.setItem("welcomed_" + (user?.id ?? ""), "1");
    setShowWelcome(false);
  };

  const isLoading = analysis.step === "scraping" || analysis.step === "analyzing";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <DisruptionPathBanner />

        {/* Top-level tab bar */}
        {(() => {
          const TABS = [
            { id: "custom" as const, label: "Disrupt This Product", icon: Upload, accent: "hsl(217 91% 38%)" },
            { id: "service" as const, label: "Disrupt This Service", icon: Briefcase, accent: "hsl(340 75% 50%)" },
            { id: "business" as const, label: "Disrupt This Business Model", icon: Building2, accent: "hsl(271 81% 55%)" },
            { id: "discover" as const, label: "Disrupt This Nostalgia", icon: Telescope, accent: "hsl(var(--primary))" },
          ];
          return (
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
              <div className="flex border-b" style={{ borderColor: "hsl(var(--border))" }}>
                {TABS.map((tab) => {
                  const isActive = analysis.mainTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        analysis.setMainTab(tab.id);
                        analysis.setActiveMode(tab.id as AnalysisMode);
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors relative flex-1 justify-center"
                      style={{
                        color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                        borderBottom: isActive ? "2px solid hsl(var(--foreground))" : "2px solid transparent",
                        background: isActive ? "hsl(var(--muted) / 0.5)" : "transparent",
                      }}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden text-[10px]">{tab.label.replace("Disrupt This ", "")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
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
          );
        })()}

        {/* Loading tracker */}
        {isLoading && (
          <LoadingTracker
            step={analysis.step as "scraping" | "analyzing"}
            elapsedSeconds={analysis.elapsedSeconds}
            loadingLog={analysis.loadingLog}
          />
        )}

        {/* Error */}
        {analysis.step === "error" && (
          <div
            className="p-5 rounded flex items-start gap-3"
            style={{ background: "hsl(var(--destructive) / 0.05)", border: "1px solid hsl(var(--destructive) / 0.2)" }}
          >
            <AlertCircle size={20} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: "hsl(var(--destructive))" }}>Analysis Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{analysis.errorMsg}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Try a more specific category or reduce batch size.
              </p>
            </div>
          </div>
        )}

        {/* Business Model Form (when no results yet) */}
        {!analysis.businessAnalysisData && analysis.mainTab === "business" && (
          <div ref={businessResultsRef}>
            <BusinessModelAnalysis
              onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
              onAnalysisComplete={(data, input) => {
                analysis.setBusinessAnalysisData(data);
                analysis.setBusinessModelInput(input);
                const id = crypto.randomUUID();
                analysis.setAnalysisId(id);
                navigate(`/business/${id}`);
              }}
            />
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-8 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-xs mt-2">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-opacity hover:opacity-80" style={{ color: "hsl(var(--primary))" }}>
            Built by SGP Capital
          </a>
          <span className="text-muted-foreground"> · </span>
          <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
          {profile && <span className="text-muted-foreground"> · Signed in as <strong className="text-foreground">{profile.first_name}</strong></span>}
        </p>
      </footer>
    </div>
  );
}
