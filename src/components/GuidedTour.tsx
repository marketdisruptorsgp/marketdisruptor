/**
 * GuidedTour — Step-by-step walkthrough of the workspace and analysis flow.
 * Shows a modal overlay with numbered steps explaining key areas.
 * Persists "seen" state in localStorage so it only auto-shows once.
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Zap, LayoutDashboard, GitBranch,
  Search, Lightbulb, Shield, Brain, Sparkles, Target, CheckCircle2,
} from "lucide-react";

const TOUR_STEPS = [
  {
    icon: Zap,
    title: "Welcome to Market Disruptor",
    description: "This is your strategic discovery workspace. The platform guides you through a structured analytical journey — from understanding a market to generating actionable strategic moves. Let's walk through how it works.",
    accent: "hsl(var(--primary))",
  },
  {
    icon: LayoutDashboard,
    title: "Step 1: Start an Analysis",
    description: "Click 'New Analysis' in the sidebar or from the home screen. Enter a product, service, or business model you want to analyze. The system will automatically detect the analysis mode (Product, Service, or Business Model) and begin gathering intelligence.",
    accent: "hsl(var(--primary))",
  },
  {
    icon: Search,
    title: "Step 2: Understand — Market Intelligence",
    description: "The first pipeline step automatically runs an Understand/Intel Report. This gathers demand signals, competitive landscape data, cost structures, and distribution patterns. You'll see results populate in the workspace as evidence accumulates.",
    accent: "hsl(142 70% 45%)",
  },
  {
    icon: Lightbulb,
    title: "Step 3: Deconstruct & Reimagine",
    description: "The Deconstruct step breaks down existing assumptions using first-principles thinking. Reimagine generates concept variants — different 'how' configurations for strategic opportunities. Think of it as exploring the full design space before committing.",
    accent: "hsl(262 83% 58%)",
  },
  {
    icon: Shield,
    title: "Step 4: Stress Test & Pitch",
    description: "Stress Test runs adversarial scenarios against your strategy to find weak points. Pitch synthesizes everything into a coherent narrative. Both steps add evidence that deepens the strategic model.",
    accent: "hsl(38 92% 50%)",
  },
  {
    icon: Brain,
    title: "The Command Deck — Your Strategic Briefing",
    description: "This is where everything comes together. The Command Deck shows your Hero Insight (biggest finding), Strategic Diagnosis (the one-sentence verdict), an Intelligence Feed (actionable cards tagged as New Ideas, Execution, or Iterate), and key metrics. It updates automatically as pipeline steps complete.",
    accent: "hsl(var(--primary))",
  },
  {
    icon: GitBranch,
    title: "The Insight Graph — Trace the Reasoning",
    description: "Toggle to the Insight Graph to visually trace the causal chain: Evidence → Signals → Constraints → Drivers → Leverage Points → Opportunities → Pathways. Every recommendation is traceable back to specific evidence. Click any node to see its supporting data.",
    accent: "hsl(199 89% 48%)",
  },
  {
    icon: Target,
    title: "Scenario Lab & Iteration",
    description: "Use the Scenario Lab to test 'What if?' hypotheses. Adjust variables and watch the entire strategic model recalculate. Save scenarios for side-by-side comparison. The Intelligence Feed's 'Iterate' cards suggest structural patterns worth exploring further.",
    accent: "hsl(var(--warning))",
  },
  {
    icon: Sparkles,
    title: "You're Ready",
    description: "Start by creating a new analysis with any product, service, or business. The automated pipeline will handle the heavy lifting — your job is to review, challenge, and iterate on the strategic findings. Every insight is backed by traceable evidence, never black-box AI.",
    accent: "hsl(var(--success))",
  },
];

const STORAGE_KEY = "md-tour-seen-v1";

export function useGuidedTour() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Auto-show on first visit after a small delay
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  return { isOpen, open, close };
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  const handleNext = () => {
    if (isLast) {
      onClose();
      setStep(0);
    } else {
      setStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setStep(s => s - 1);
  };

  const handleClose = () => {
    onClose();
    setStep(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "hsl(0 0% 0% / 0.6)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors z-10"
            >
              <X size={16} className="text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 sm:px-8 pt-8 pb-6">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${current.accent}15` }}
              >
                <Icon size={22} style={{ color: current.accent }} />
              </div>

              {/* Step indicator */}
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                {step + 1} of {TOUR_STEPS.length}
              </p>

              {/* Title */}
              <h2 className="text-xl font-black text-foreground leading-tight mb-3">
                {current.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Progress dots + navigation */}
            <div className="px-6 sm:px-8 pb-6 flex items-center justify-between">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="transition-all"
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? current.accent : "hsl(var(--muted-foreground) / 0.25)",
                    }}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ArrowLeft size={12} />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: current.accent,
                    color: "white",
                  }}
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 size={13} />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
