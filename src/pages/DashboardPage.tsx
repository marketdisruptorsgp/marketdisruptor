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
  Layers, RefreshCw, Shield, Zap,
} from "lucide-react";

const PLATFORM_SIGNALS = [
  { icon: Layers, label: "Persistent Workspaces", desc: "Every analysis auto-saves and evolves over time" },
  { icon: RefreshCw, label: "Iterative Intelligence", desc: "Re-run, regenerate, and refine from any step" },
  { icon: Shield, label: "Adversarial Validation", desc: "Red Team attacks your strategy before competitors do" },
  { icon: Zap, label: "Actionable Output", desc: "Pitch decks, moats, and go-to-market — not just insights" },
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            <DisruptionPathBanner />

            {/* Analysis mode tabs + form */}
            {(() => {
              const TABS = [
                { id: "custom" as const, label: "Product", icon: Upload, accent: "hsl(217 91% 38%)" },
                { id: "service" as const, label: "Service", icon: Briefcase, accent: "hsl(340 75% 50%)" },
                { id: "business" as const, label: "Business Model", icon: Building2, accent: "hsl(271 81% 55%)" },
                { id: "discover" as const, label: "Nostalgia", icon: Telescope, accent: "hsl(var(--primary))" },
              ];
              return (
                <div className="rounded overflow-hidden border border-border" style={{ background: "hsl(var(--card))" }}>
                  <div className="flex border-b border-border">
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
                            borderBottom: isActive ? `2px solid ${tab.accent}` : "2px solid transparent",
                            background: isActive ? "hsl(var(--muted) / 0.5)" : "transparent",
                          }}
                        >
                          <Icon size={14} />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden text-[10px]">{tab.label}</span>
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
          </div>

          {/* Right sidebar */}
          <aside className="space-y-5 hidden lg:block">
            {/* Recent projects */}
            <div className="rounded border border-border p-4" style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Projects</p>
                <button
                  onClick={() => setShowSavedPanel(true)}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  View All
                </button>
              </div>
              <SavedAnalyses
                onLoad={(a) => { analysis.handleLoadSaved(a); }}
                refreshTrigger={analysis.savedRefreshTrigger}
                onCountChange={setSavedCount}
                compact
              />
            </div>

            {/* Platform capabilities */}
            <div className="rounded border border-border p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform</p>
              {PLATFORM_SIGNALS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border border-border bg-background">
                    <Icon size={11} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground leading-tight">{label}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="rounded border border-border p-4 space-y-2" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded p-2.5 border border-border bg-background">
                  <p className="text-lg font-bold text-primary leading-none">{savedCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Projects</p>
                </div>
                <div className="rounded p-2.5 border border-border bg-background">
                  <p className="text-lg font-bold text-foreground leading-none">4</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Paths</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t mt-8 py-6 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-xs">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-opacity hover:opacity-80 text-primary">
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
