import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import MobileTour from "@/components/MobileTour";
import { HeroSection } from "@/components/HeroSection";
import { DisruptionPathBanner } from "@/components/DisruptionPathBanner";
import { Target } from "lucide-react";
import PaywallModal from "@/components/PaywallModal";
import { MarketChangeAlert } from "@/components/MarketChangeAlert";

import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { BuiltForSection } from "@/components/BuiltForSection";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import {
  Upload, Briefcase, Building2, ShieldCheck, BookOpen,
  Rocket, TrendingUp, Users, FileText, ArrowRight, Camera } from
"lucide-react";

const MODE_WORDS = [
{ label: "product", color: "hsl(var(--mode-product))" },
{ label: "service", color: "hsl(var(--mode-service))" },
{ label: "business", color: "hsl(var(--mode-business))" }];


const MODE_PILLS = [
{ id: "custom" as const, label: "Product", icon: Upload, cssVar: "--mode-product", path: "/start/product" },
{ id: "service" as const, label: "Service", icon: Briefcase, cssVar: "--mode-service", path: "/start/service" },
{ id: "business" as const, label: "Business Model", icon: Building2, cssVar: "--mode-business", path: "/start/business" }];


export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { remainingAnalyses, tier } = useSubscription();
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

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
              onLoad={(a) => {analysis.handleLoadSaved(a);setShowSavedPanel(false);}}
              refreshTrigger={analysis.savedRefreshTrigger}
              onCountChange={setSavedCount} />

          </div>
        </SheetContent>
      </Sheet>

      {/* Hero Section */}
      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-3 sm:pb-6">
          <h1 className="typo-page-title text-4xl sm:text-5xl tracking-tight leading-tight whitespace-nowrap pl-[15%] sm:pl-[20%] md:text-5xl text-center mx-px">
            Rethink any{" "}
            <span
              className="inline-block transition-opacity duration-300 text-left min-w-[180px] sm:min-w-[320px]"
              style={{
                opacity: visible ? 1 : 0,
                color: MODE_WORDS[wordIndex].color
              }}>

              {MODE_WORDS[wordIndex].label}
            </span>
          </h1>
          <p className="typo-page-meta text-base sm:text-base md:text-lg mt-2 sm:mt-3 max-w-2xl mx-auto leading-relaxed px-2 text-center">
            Deconstruct markets, stress-test strategies, and build what's next.
          </p>

          {/* Built For */}
          <div className="mt-6 sm:mt-8">
            <BuiltForSection />
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6">
            <button
              onClick={() => navigate("/about")}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-full typo-nav-primary bg-primary text-primary-foreground transition-colors hover:opacity-90">
              Learn More
            </button>
            <button
              onClick={() => document.getElementById("showcase-gallery")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-full typo-nav-primary bg-accent text-accent-foreground border border-border transition-colors hover:opacity-90">
              Example Output
            </button>
          </div>
        </div>
      </section>

      {/* Workflow Pipeline */}
      <DisruptionPathBanner accentColor={MODE_WORDS[wordIndex].color} />

      {/* Scrutiny CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6">
        <div
          className="rounded-2xl px-5 py-5 sm:py-6 text-center cursor-pointer transition-all hover:shadow-md"
          style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          onClick={() => navigate("/start")}>

          <p className="typo-card-title mb-1">
            Apply a level of scrutiny that exceeds normal bandwidth.
          </p>
          <p className="typo-section-description mb-3">
            See what a deep deconstruction reveals about your market.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-full typo-nav-primary text-primary-foreground transition-colors"
            style={{ background: "hsl(var(--primary))" }}>

            Start Analysis <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Value Proposition Callout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 my-4 sm:my-6">
        <div className="rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-3 sm:gap-4" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <Target size={18} className="flex-shrink-0 mt-0.5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="typo-card-title mb-0.5">What to expect</p>
            <p className="typo-card-body text-foreground/70 leading-relaxed text-sm">
              The goal isn't to promise a "better" answer every time. The goal is to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth — revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Instant Photo Analysis CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-5">
        <div
          className="rounded-2xl px-5 py-4 sm:py-5 flex flex-col sm:flex-row items-center gap-3 cursor-pointer transition-all hover:shadow-md bg-muted border border-border"
          onClick={() => navigate("/instant-analysis")}>

          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Camera size={20} className="text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="typo-card-title mb-0.5">Instant Photo Analysis</p>
            <p className="typo-card-body text-muted-foreground text-sm">
              Snap a photo of any product and get an AI-powered competitive teardown in seconds.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2 rounded-full typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-colors flex-shrink-0">
            Try It <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Showcase Gallery */}
      <div id="showcase-gallery" className="max-w-5xl mx-auto px-4 sm:px-6 mt-3 sm:mt-5 mb-4 sm:mb-6">
        <ShowcaseGallery />
      </div>

      {/* Mode Pills — navigate to start pages */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {MODE_PILLS.map((pill) => {
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  onClick={() => navigate(pill.path)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full typo-nav-primary text-white transition-colors hover:opacity-90 hover:shadow-sm"
                  style={{
                    background: `hsl(var(${pill.cssVar}))`,
                  }}>

                  <Icon size={14} />
                  {pill.label}
                  <ArrowRight size={12} />
                </button>);

            })}
          </div>
        </div>
      </div>

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
    </div>);

}