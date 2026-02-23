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
  AlertCircle,
  BookOpen, Users, Rocket, TrendingUp, ShieldCheck, Tag, Layers, FileText,
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

  // Real user stats for sidebar
  const [userStats, setUserStats] = useState<{ totalAnalyses: number; latestScore: number | null }>({ totalAnalyses: 0, latestScore: null });

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { count } = await (supabase.from("saved_analyses") as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { data: latest } = await (supabase.from("saved_analyses") as any)
        .select("avg_revival_score")
        .eq("user_id", user.id)
        .not("avg_revival_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setUserStats({ totalAnalyses: count ?? 0, latestScore: latest?.avg_revival_score ?? null });
    })();
  }, [user?.id, analysis.savedRefreshTrigger]);

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

            {/* Analysis form — mode is set from top nav */}
            <div className="rounded overflow-hidden border border-border" style={{ background: "hsl(var(--card))" }}>
              <div className="px-4 pt-3 pb-1 border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {analysis.mainTab === "custom" ? "Disrupt This Product" : analysis.mainTab === "service" ? "Disrupt This Service" : analysis.mainTab === "business" ? "Disrupt This Business Model" : "Analysis"}
                </p>
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

            {/* Quick Start Templates */}
            <QuickStartTemplates
              onSelect={(tab, category, era) => {
                analysis.setMainTab(tab);
                analysis.setActiveMode(tab as AnalysisMode);
              }}
            />
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

            {/* How It Works */}
            <div className="rounded border border-border p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How It Works</p>
              {[
                { icon: Layers, label: "3-Layer Deconstruction", desc: "Every market analyzed across supply, demand, and positioning" },
                { icon: ShieldCheck, label: "Adversarial Validation", desc: "Red Team attacks your strategy before competitors do" },
                { icon: Tag, label: "Claim Tagging", desc: "Outputs tagged as Verified, Modeled, or Assumption" },
                { icon: TrendingUp, label: "Leverage Scoring", desc: "Assumptions scored 1–10 for strategic impact" },
              ].map(({ icon: Icon, label, desc }) => (
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

            {/* Built For */}
            <div className="rounded border border-border p-4 space-y-2.5" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Built For</p>
              {[
                { icon: Rocket, label: "Entrepreneurs", desc: "Scouting new markets & niches" },
                { icon: TrendingUp, label: "Investors", desc: "Evaluating opportunities with rigor" },
                { icon: Users, label: "Product Teams", desc: "Validating strategy before launch" },
                { icon: FileText, label: "Agencies", desc: "Building data-driven client pitches" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon size={12} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-foreground">{label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Your Stats — real data */}
            <div className="rounded border border-border p-4 space-y-2" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded p-2.5 border border-border bg-background">
                  <p className="text-lg font-bold text-primary leading-none">{userStats.totalAnalyses}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Projects</p>
                </div>
                <div className="rounded p-2.5 border border-border bg-background">
                  <p className="text-lg font-bold text-foreground leading-none">{userStats.latestScore !== null ? userStats.latestScore : "—"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Latest Score</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t mt-8" style={{ borderColor: "hsl(var(--border))" }}>
        {/* Trust + enterprise row */}
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck size={10} /> Your data is encrypted & never shared</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1"><BookOpen size={10} /> Analyses scoped to your account via RLS</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="font-semibold text-primary hover:underline">Enterprise & Teams →</a>
          </div>
        </div>
        {/* Brand row */}
        <div className="border-t py-5 text-center" style={{ borderColor: "hsl(var(--border))" }}>
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

/* ─── Quick Start Templates ─── */
const TEMPLATES = [
  { tab: "custom" as const, label: "Vintage Electronics", desc: "Retro tech with revival potential", icon: "📻" },
  { tab: "service" as const, label: "Local Service Audit", desc: "Analyze a service business model", icon: "🏪" },
  { tab: "business" as const, label: "DTC Brand Audit", desc: "Deconstruct a direct-to-consumer brand", icon: "📦" },
];

function QuickStartTemplates({ onSelect }: { onSelect: (tab: "custom" | "service" | "business" | "discover", category: string, era: string) => void }) {
  return (
    <div className="rounded border border-border p-4" style={{ background: "hsl(var(--card))" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quick Start</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => onSelect(t.tab, "", "")}
            className="text-left rounded border border-border px-3 py-2.5 transition-colors hover:bg-muted"
            style={{ background: "hsl(var(--background))" }}
          >
            <span className="text-base">{t.icon}</span>
            <p className="text-[11px] font-semibold text-foreground mt-1 leading-tight">{t.label}</p>
            <p className="text-[9px] text-muted-foreground leading-snug mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
