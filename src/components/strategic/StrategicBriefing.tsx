/**
 * StrategicBriefing — 3-Zone Executive Intelligence Layout
 *
 * Wraps the three strategic zones into a clean briefing structure:
 *   Zone 1 — Situation Assessment (What Is)
 *   Zone 2 — Breakthrough Vectors (What Could Be)
 *   Zone 3 — Action Directive (What To Do)
 *
 * All engineering complexity is hidden. Only strategic intelligence is visible.
 */

import { SituationAssessment } from "./SituationAssessment";
import { BreakthroughVectors, type BreakthroughVector } from "./BreakthroughVectors";
import { ActionDirective } from "./ActionDirective";

interface StrategicBriefingProps {
  // Zone 1 — Situation Assessment
  constraint: string | null;
  verdict: string | null;
  verdictRationale: string | null;
  marketPosition: string | null;

  // Zone 2 — Breakthrough Vectors
  vectors: BreakthroughVector[];

  // Zone 3 — Action Directive
  action: string | null;
  mechanism: string | null;
  timingRationale: string | null;
  riskMitigation: string | null;
  timeline: string;

  modeAccent: string;
  isComputing: boolean;
}

export function StrategicBriefing({
  constraint,
  verdict,
  verdictRationale,
  marketPosition,
  vectors,
  action,
  mechanism,
  timingRationale,
  riskMitigation,
  timeline,
  modeAccent,
  isComputing,
}: StrategicBriefingProps) {
  return (
    <div className="space-y-5">
      {/* Zone 1 — Situation Assessment */}
      <SituationAssessment
        constraint={constraint}
        verdict={verdict}
        verdictRationale={verdictRationale}
        marketPosition={marketPosition}
        modeAccent={modeAccent}
        isComputing={isComputing}
      />

      {/* Zone 2 — Breakthrough Vectors */}
      {vectors.length > 0 && (
        <BreakthroughVectors vectors={vectors} modeAccent={modeAccent} />
      )}

      {/* Zone 3 — Action Directive */}
      {action && (
        <ActionDirective
          action={action}
          mechanism={mechanism}
          timingRationale={timingRationale}
          riskMitigation={riskMitigation}
          timeline={timeline}
          modeAccent={modeAccent}
        />
      )}
    </div>
  );
}
