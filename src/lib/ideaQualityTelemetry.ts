/**
 * Idea Quality Feedback Telemetry
 *
 * Tracks correlation between user steering/preference inputs
 * and downstream thesis quality for closed-loop improvement.
 *
 * Records:
 * - Which ideas were liked/dismissed
 * - Active steering text at time of like/dismiss
 * - Downstream thesis scores (if available)
 * - Analysis mode and lens context
 */

export interface IdeaFeedbackEvent {
  analysisId: string;
  ideaId: string;
  action: "liked" | "dismissed" | "neutral";
  steeringText: string | null;
  lensType: string | null;
  analysisMode: string;
  timestamp: number;
  // Downstream quality signals (populated after thesis deepening)
  thesisCount?: number;
  avgThesisConfidence?: number;
}

const FEEDBACK_STORAGE_KEY = "idea_quality_feedback";
const MAX_EVENTS = 200;

/** Append a feedback event to local telemetry */
export function recordIdeaFeedback(event: IdeaFeedbackEvent): void {
  try {
    const existing = getStoredFeedback();
    existing.push(event);
    // Keep only the most recent events
    const trimmed = existing.slice(-MAX_EVENTS);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent failure — telemetry should never break the app
  }
}

/** Get all stored feedback events */
export function getStoredFeedback(): IdeaFeedbackEvent[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Compute quality correlation metrics */
export function computeQualityCorrelation(): {
  totalEvents: number;
  likedCount: number;
  dismissedCount: number;
  steeringCorrelation: number | null;
  avgThesisQualityAfterLikes: number | null;
  avgThesisQualityAfterDismissals: number | null;
} {
  const events = getStoredFeedback();
  const liked = events.filter(e => e.action === "liked");
  const dismissed = events.filter(e => e.action === "dismissed");

  // Check if steering was present during likes vs dismissals
  const likedWithSteering = liked.filter(e => !!e.steeringText).length;
  const dismissedWithSteering = dismissed.filter(e => !!e.steeringText).length;

  // Compute average thesis quality after likes vs dismissals
  const likedWithThesis = liked.filter(e => e.avgThesisConfidence != null);
  const dismissedWithThesis = dismissed.filter(e => e.avgThesisConfidence != null);

  const avgAfterLikes = likedWithThesis.length > 0
    ? likedWithThesis.reduce((s, e) => s + (e.avgThesisConfidence || 0), 0) / likedWithThesis.length
    : null;
  const avgAfterDismissals = dismissedWithThesis.length > 0
    ? dismissedWithThesis.reduce((s, e) => s + (e.avgThesisConfidence || 0), 0) / dismissedWithThesis.length
    : null;

  // Simple steering correlation: ratio of steering presence in liked vs dismissed
  const steeringCorrelation = (liked.length > 0 && dismissed.length > 0)
    ? (likedWithSteering / liked.length) - (dismissedWithSteering / dismissed.length)
    : null;

  return {
    totalEvents: events.length,
    likedCount: liked.length,
    dismissedCount: dismissed.length,
    steeringCorrelation,
    avgThesisQualityAfterLikes: avgAfterLikes,
    avgThesisQualityAfterDismissals: avgAfterDismissals,
  };
}
