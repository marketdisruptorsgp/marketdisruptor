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

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import {
  Upload, Briefcase, Building2, ShieldCheck, BookOpen,
  Rocket, TrendingUp, Users, FileText, ArrowRight } from
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-5 sm:pb-10">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight whitespace-nowrap pl-[15%] sm:pl-[20%] md:text-5xl text-center mx-px">
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
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed px-2 text-center">
            Deconstruct markets, stress-test strategies, and build what's next with AI-powered competitive intelligence.
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6">
            <button
              onClick={() => navigate("/about")}
              className="px-4 sm:px-6 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground transition-colors hover:bg-muted">

              Learn More
            </button>
          </div>

          {/* Built For */}
          <p className="text-sm sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-8 sm:mt-10 mb-3 sm:mb-4 text-center">Built For</p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-3xl mx-auto text-left">
            {[
            { icon: Rocket, title: "Entrepreneurs", desc: "Data-driven conviction, not guesswork." },
            { icon: TrendingUp, title: "Investors", desc: "Adversarial rigor before committing capital." },
            { icon: Users, title: "Product Teams", desc: "Stress-test strategy before launch." },
            { icon: FileText, title: "Agencies", desc: "Data-backed perspectives beyond surface-level." }].
            map(({ icon: Icon, title, desc }) =>
            <div key={title} className="rounded-xl border border-border bg-card p-3 sm:p-5 flex flex-col items-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-2.5">
                  <Icon size={16} className="text-primary" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-foreground mb-0.5">{title}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workflow Pipeline */}
      <DisruptionPathBanner />

      {/* Scrutiny CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        <div
          className="rounded-2xl px-5 py-6 sm:py-8 text-center cursor-pointer transition-all hover:shadow-md"
          style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          onClick={() => navigate("/start/product")}>

          <p className="text-sm sm:text-base font-bold text-foreground mb-1.5">
            Apply a level of scrutiny that exceeds normal bandwidth.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            See what a deep deconstruction reveals about your market.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm font-semibold text-primary-foreground transition-colors"
            style={{ background: "hsl(var(--primary))" }}>

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

      {/* Showcase Gallery */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 mb-6 sm:mb-10">
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
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors hover:shadow-sm"
                  style={{
                    borderColor: `hsl(var(${pill.cssVar}))`,
                    color: `hsl(var(${pill.cssVar}))`
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