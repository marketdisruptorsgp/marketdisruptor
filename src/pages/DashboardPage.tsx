import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import MobileTour from "@/components/MobileTour";
import { HeroSection } from "@/components/HeroSection";
import { DisruptionPathBanner } from "@/components/DisruptionPathBanner";
import PaywallModal from "@/components/PaywallModal";
import { MarketChangeAlert } from "@/components/MarketChangeAlert";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import {
  Upload, Briefcase, Building2, ShieldCheck, BookOpen,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { remainingAnalyses, tier } = useSubscription();
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {user && <MobileTour userId={user.id} />}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      {/* Nav */}
      <HeroSection tier={tier} remainingAnalyses={remainingAnalyses()} profileFirstName={profile?.first_name} onOpenSaved={() => setShowSavedPanel(true)} savedCount={savedCount} />

      {/* Market Change Notifications */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <MarketChangeAlert />
      </div>

      {/* Saved Projects Sheet */}
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

      {/* ── HERO ── */}
      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8 sm:pb-12 text-center">
          <h1 className="typo-page-title text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground leading-tight">
            Rethink Any Market —{" "}
            <span className="text-primary">Product, Service, or Business Model</span>
          </h1>
          <p className="typo-page-meta text-sm sm:text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
            Analyze opportunities, stress-test assumptions, and generate investor-ready outputs.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <button
              onClick={() => navigate("/start")}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full typo-button-primary bg-primary text-primary-foreground hover:bg-primary-dark transition-colors text-base"
            >
              Start Analysis <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("showcase-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition-colors"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
            >
              View Example Output
            </button>
          </div>

          {/* ── MODE PREVIEW CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto text-left">
            {[
              { label: "Product", desc: "Deconstruct physical & digital products — positioning, pricing, supply chain.", cssVar: "--mode-product", icon: Upload, path: "/start/product" },
              { label: "Service", desc: "Tear down service businesses — user journeys, friction points, pricing leverage.", cssVar: "--mode-service", icon: Briefcase, path: "/start/service" },
              { label: "Business Model", desc: "Full model teardown — revenue, cost structure, value chain, hidden assumptions.", cssVar: "--mode-business", icon: Building2, path: "/start/business" },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.label}
                  onClick={() => navigate(mode.path)}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:border-primary/30 text-left group"
                  style={{ borderTopWidth: "3px", borderTopColor: `hsl(var(${mode.cssVar}))` }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `hsl(var(${mode.cssVar}) / 0.12)` }}>
                    <Icon size={18} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                  </div>
                  <p className="typo-card-title font-bold text-foreground">{mode.label}</p>
                  <p className="typo-card-meta text-muted-foreground leading-relaxed">{mode.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate("/start")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Start Analysis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── PIPELINE DIAGRAM — below fold ── */}
      <DisruptionPathBanner />

      {/* ── SHOWCASE GALLERY ── */}
      <div id="showcase-section" className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 mb-6 sm:mb-10">
        <ShowcaseGallery />
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1"><ShieldCheck size={11} /> Your data is encrypted & never shared</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1"><BookOpen size={11} /> Analyses scoped to your account via RLS</span>
          </div>
          <a href="/pricing" className="font-semibold text-primary hover:underline py-1">Enterprise & Teams</a>
        </div>
        <div className="border-t border-border py-5 text-center px-4">
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
