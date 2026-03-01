interface AnalysisStepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { num: 1, label: "Select Mode" },
  { num: 2, label: "Configure Target" },
  { num: 3, label: "Run Analysis" },
];

export function AnalysisStepIndicator({ currentStep }: AnalysisStepIndicatorProps) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.num} className="contents">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step.num <= currentStep ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: step.num <= currentStep ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {step.num}
            </div>
            <span
              className="typo-nav-primary"
              style={{
                color: step.num <= currentStep ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}
