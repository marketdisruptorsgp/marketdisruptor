/**
 * Shared types for the pipeline state machine.
 */

export type PipelineStepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface StepTiming {
  startedAt: number;
  completedAt?: number;
  elapsedMs?: number;
}

export interface StepRunnerContext {
  analysisId: string;
  product: any;
  extractedContext: string;
  steeringText?: string;
  adaptiveContext?: any;
  activeMode?: string;
  insightPreferences?: any;
  userScores?: any;
  analysisData?: any;
  focusTerritory?: any;
  activeLens?: any;
}

export interface StepRunnerCallbacks {
  updateStatus: (key: string, status: PipelineStepStatus, error?: string) => void;
  setCurrentStep: (step: string | null) => void;
  onRecompute?: () => void;
  onStepComplete?: (stepKey: string) => void;
  saveStepData: (key: string, data: unknown, analysisId: string) => Promise<void>;
}

export interface StepDataStore {
  decompositionData: unknown;
  disruptData: unknown;
  redesignData: unknown;
  stressTestData: unknown;
  pitchDeckData: unknown;
  conceptsData: unknown;
  businessAnalysisData: unknown;
  businessModelInput: { type?: string; description?: string } | null;

  setDecompositionData: (d: any) => void;
  setDisruptData: (d: any) => void;
  setRedesignData: (d: any) => void;
  setStressTestData: (d: any) => void;
  setPitchDeckData: (d: any) => void;
  setGovernedData: (d: any) => void;
  setConceptsData: (d: any) => void;
  clearStepOutdated: (step: string) => void;
}

export const STEP_DEFS = [
  { key: "decompose", label: "Understanding Structure" },
  { key: "synthesis", label: "Finding Opportunities" },
  { key: "concepts", label: "Generating Concepts" },
  { key: "stressTest", label: "Stress Testing", lazy: true },
  { key: "pitch", label: "Building Pitch", lazy: true },
] as const;
