import { CheckCircle2 } from "lucide-react";

const STEP_LABELS = ["Intel", "Disrupt", "Redesign", "Stress Test", "Pitch"];

interface StepProgressDotsProps {
  analysisData: Record<string, unknown> | null;
  analysisType?: string;
}

/** Extract completed steps from analysis_data blob */
function getCompletedSteps(data: Record<string, unknown> | null, type?: string): Set<number> {
  const completed = new Set<number>();
  if (!data) return completed;

  // Step 1 (Intel) is always complete if we have analysis data
  completed.add(0);

  // Check for disrupt data
  if (data.disrupt || data.firstPrinciples) completed.add(1);

  // Check for redesign data
  if (data.redesign || data.productVisuals) completed.add(2);

  // Check for stress test data
  if (data.stressTest || data.criticalValidation) completed.add(3);

  // Check for pitch deck data
  if (data.pitchDeck || data.pitch) completed.add(4);

  // Business model variants
  if (type === "business_model") {
    if (data.hiddenAssumptions || data.disruptionVulnerabilities) completed.add(1);
  }

  // Check visited steps if stored
  const visitedSteps = data.visitedSteps as number[] | undefined;
  if (Array.isArray(visitedSteps)) {
    visitedSteps.forEach(s => {
      if (s === 2) completed.add(0); // Intel
      if (s === 3) completed.add(1); // Disrupt
      if (s === 4) completed.add(2); // Redesign
      if (s === 5) completed.add(3); // Stress Test
      if (s === 6) completed.add(4); // Pitch
    });
  }

  return completed;
}

export function StepProgressDots({ analysisData, analysisType }: StepProgressDotsProps) {
  const completed = getCompletedSteps(analysisData as Record<string, unknown> | null, analysisType);
  const count = completed.size;
  const allDone = count >= 5;

  if (allDone) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)" }} />
        <span className="text-[10px] font-bold" style={{ color: "hsl(142 70% 40%)" }}>Complete</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            title={label}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              background: completed.has(i)
                ? "hsl(var(--primary))"
                : "hsl(var(--border))",
            }}
          />
        ))}
      </div>
      <span className="text-[9px] text-muted-foreground">{count} of 5 explored</span>
    </div>
  );
}

export { getCompletedSteps };
