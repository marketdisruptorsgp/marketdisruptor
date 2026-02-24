import React, { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { AnalysisForm, type AnalysisMode } from "@/components/AnalysisForm";
import { BusinessModelAnalysis, type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import { ContextualTip } from "@/components/ContextualTip";
import { LoadingTracker } from "@/components/LoadingTracker";
import { HeroSection } from "@/components/HeroSection";
import PaywallModal from "@/components/PaywallModal";
import { AlertCircle, ShieldCheck, BookOpen, Upload, Briefcase, Building2, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const MODE_CONFIG = {
  custom: {
    label: "Disrupt This Product",
    icon: Upload,
    cssVar: "--mode-product",
    tips: [
      "Upload a product photo alongside the URL — the AI uses computer vision to catch design details that text listings miss, like material quality, ergonomic flaws, and packaging inefficiencies.",
      "Add competitor URLs in the same batch. The analysis cross-references pricing, features, and positioning across all inputs to find gaps no single product review would reveal.",
      "The Disrupt step doesn't just improve — it deliberately flips every assumption. If a product is heavy, it asks: what if weight is the feature? That's where breakthrough ideas live.",
      "After analysis, use the Red Team / Green Team debate to stress-test the AI's own conclusions. The best strategies survive adversarial scrutiny.",
    ],
  },
  service: {
    label: "Disrupt This Service",
    icon: Briefcase,
    cssVar: "--mode-service",
    tips: [
      "Paste your service's landing page URL — the AI maps the entire customer journey, from first impression to post-purchase, and flags friction points competitors accept as normal.",
      "Describe your service in the notes field even if you add a URL. Insider context about operational pain points gives the AI a sharper starting point for deconstruction.",
      "Service analysis skips product-centric logic and focuses on what matters: customer journey friction, operational workflows, and where technology can create structural advantages.",
      "The best service disruptions come from questioning delivery models, not just pricing. The AI tests configurations like unbundling, self-service layers, and subscription pivots.",
    ],
  },
  business: {
    label: "Disrupt This Business Model",
    icon: Building2,
    cssVar: "--mode-business",
    tips: [
      "Be specific about your revenue model and pain points — the more context you provide, the deeper the AI can go on operational audits and revenue reinvention.",
      "The analysis deconstructs your model across multiple dimensions: core reality, operations audit, revenue structure, and adjacency opportunities most teams overlook.",
      "Try running the same business type with different geography or scale inputs. A laundromat strategy in a dense urban market looks completely different from a suburban one.",
      "After the intelligence report, the Disrupt step generates flipped concepts you can guide with custom goals — tell the AI what constraints or objectives matter most to you.",
    ],
  },
} as const;

const SESSION_SEED = Math.random();

interface StartPageLayoutProps {
  mode: "custom" | "service" | "business";
}

export default function StartPageLayout({ mode }: StartPageLayoutProps) {
  const { profile } = useAuth();
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const config = MODE_CONFIG[mode];
  const modeColor = config.cssVar;

  useEffect(() => {
    analysis.setMainTab(mode);
    analysis.setActiveMode(mode as AnalysisMode);
  }, [mode]);

  const isLoading = analysis.step === "scraping" || analysis.step === "analyzing";

  const tips = config.tips;
  const tipIndex = Math.floor(SESSION_SEED * tips.length);

  const { tier } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10" ref={formRef}>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
        <div
          className="rounded-lg overflow-hidden border border-border bg-card shadow-sm"
          style={{ borderTop: `3px solid hsl(var(${modeColor}))` }}
        >
          <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 border-b border-border">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: `hsl(var(${modeColor}))` }}
            >
              {config.label}
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <ContextualTip
              id={`tip-${mode}-${tipIndex}`}
              message={tips[tipIndex]}
              accentColor={`hsl(var(${modeColor}))`}
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

      {/* Footer */}
      <footer className="border-t border-border mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
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
