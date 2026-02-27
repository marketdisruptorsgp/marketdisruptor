import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import {
  Upload, Briefcase, Building2, ArrowRight, CheckCircle2,
  ShieldCheck, BookOpen, Camera,
} from "lucide-react";

const MODES = [
  {
    id: "product",
    label: "Product Analysis",
    icon: Upload,
    cssVar: "--mode-product",
    path: "/start/product",
    description:
      "Upload any physical or digital product and get a full competitive teardown — positioning gaps, overlooked segments, and data-driven redesign paths.",
    capabilities: [
      "Competitive landscape mapping",
      "Assumption stress-testing",
      "Redesign & disruption paths",
      "Investor-ready pitch deck",
    ],
  },
  {
    id: "service",
    label: "Service Analysis",
    icon: Briefcase,
    cssVar: "--mode-service",
    path: "/start/service",
    description:
      "Deconstruct any service business — from SaaS to consulting — to expose friction, pricing leverage, and differentiation opportunities.",
    capabilities: [
      "User journey deconstruction",
      "Service model stress-test",
      "Pricing & packaging analysis",
      "Competitive moat assessment",
    ],
  },
  {
    id: "business",
    label: "Business Model Analysis",
    icon: Building2,
    cssVar: "--mode-business",
    path: "/start/business",
    description:
      "Full business model teardown across revenue, cost structure, and value chain — revealing hidden leverage and structural vulnerabilities.",
    capabilities: [
      "Revenue model decomposition",
      "Cost structure analysis",
      "Value chain mapping",
      "First-principles reconstruction",
    ],
  },
];

export default function StartPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection
        tier={tier}
        remainingAnalyses={0}
        profileFirstName={profile?.first_name}
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-6">
        <h1 className="typo-page-title text-3xl sm:text-5xl tracking-tight text-center">
          Start Disrupting
        </h1>
        <p className="typo-page-meta text-sm sm:text-base md:text-lg mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed text-center">
          Choose an analysis mode. Each applies rigorous, data-driven scrutiny
          tailored to the type of opportunity you're exploring.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
                style={{ borderTopWidth: "3px", borderTopColor: `hsl(var(${mode.cssVar}))` }}
              >
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `hsl(var(${mode.cssVar}) / 0.12)` }}
                  >
                    <Icon size={20} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                  </div>

                  <h2 className="typo-section-title text-lg mb-2">{mode.label}</h2>
                  <p className="typo-card-body text-muted-foreground leading-relaxed mb-5">
                    {mode.description}
                  </p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {mode.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: `hsl(var(${mode.cssVar}))` }}
                        />
                        <span className="typo-card-body text-foreground/80">{cap}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate(mode.path)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl typo-nav-primary text-primary-foreground transition-colors hover:opacity-90"
                    style={{ background: `hsl(var(${mode.cssVar}))` }}
                  >
                    Get Started <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Photo Analysis — quick-access tool */}
        <div
          onClick={() => navigate("/instant-analysis")}
          className="mt-5 sm:mt-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Camera size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="typo-section-title text-base mb-1">Photo Analysis</h3>
            <p className="typo-card-body text-muted-foreground text-sm leading-relaxed">
              Point. Shoot. Understand Everything. — Snap a photo or upload an image and instantly map its supply chain, user journey, patent landscape, and market position.
            </p>
          </div>
          <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 hidden sm:block" />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1"><ShieldCheck size={11} /> Your data is encrypted & never shared</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1"><BookOpen size={11} /> Analyses scoped to your account via RLS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
