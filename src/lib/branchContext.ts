/**
 * Client-side branch context extraction.
 * Builds the branch payload to send to downstream edge functions.
 */

import type { RootHypothesis } from "@/lib/hypothesisRanking";

export interface BranchPayload {
  active_branch_id: string;
  hypothesis: RootHypothesis;
}

/**
 * Extract the active branch payload from governed data for sending to edge functions.
 * Returns null if no branch is active.
 */
export function getBranchPayload(
  governedData: Record<string, unknown> | null,
  activeBranchId: string | null
): BranchPayload | null {
  if (!governedData || !activeBranchId) return null;

  // Check promoted root_hypotheses first, then constraint_map
  let hypotheses: RootHypothesis[] | undefined;

  if (Array.isArray(governedData.root_hypotheses)) {
    hypotheses = governedData.root_hypotheses as RootHypothesis[];
  } else {
    const cm = governedData.constraint_map as Record<string, unknown> | undefined;
    if (cm && Array.isArray(cm.root_hypotheses)) {
      hypotheses = cm.root_hypotheses as RootHypothesis[];
    }
  }

  if (!hypotheses || hypotheses.length === 0) return null;

  const match = hypotheses.find(h => h.id === activeBranchId);
  if (!match) return null;

  return {
    active_branch_id: activeBranchId,
    hypothesis: match,
  };
}
