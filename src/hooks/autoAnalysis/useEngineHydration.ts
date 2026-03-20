/**
 * Hydrates strategic engine + insight graph state from persisted DB data
 * when loading/reloading a saved analysis.
 */

import { useEffect, type MutableRefObject } from "react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { EngineSetters } from "./types";

export function useEngineHydration(
  analysisId: string | null,
  hasRun: boolean,
  narrative: StrategicNarrative | null,
  deepenedOpportunities: DeepenedOpportunity[],
  hydratedRef: MutableRefObject<boolean>,
  setters: EngineSetters,
  runAnalysis: () => void,
) {
  useEffect(() => {
    if (!analysisId || hydratedRef.current || hasRun) return;
    if (narrative || deepenedOpportunities.length > 0) return;

    import("@/integrations/supabase/client").then(({ supabase }) => {
      Promise.resolve(
        supabase.from("saved_analyses").select("analysis_data").eq("id", analysisId).maybeSingle()
      ).then(({ data }) => {
        const ad = data?.analysis_data as any;
        const rawSe = ad?.strategicEngine;
        const se = typeof rawSe === "string"
          ? (() => { try { return JSON.parse(rawSe); } catch { return null; } })()
          : rawSe;
        const rawGraph = ad?.insightGraph;
        const persistedGraph = typeof rawGraph === "string"
          ? (() => { try { return JSON.parse(rawGraph); } catch { return null; } })()
          : rawGraph;

        // Hydrate graph first (instant display)
        if (persistedGraph?.nodes?.length > 0) {
          hydratedRef.current = true;
          setters.setGraph({
            nodes: persistedGraph.nodes,
            edges: persistedGraph.edges,
            topNodes: {
              primaryConstraint: null,
              keyDriver: null,
              breakthroughOpportunity: null,
              highestConfidence: null,
            },
          });
          console.log("[StrategicEngine] ✓ Hydrated graph from DB:",
            `${persistedGraph.nodes.length} nodes, ${persistedGraph.edges.length} edges`);
        }

        // Hydrate engine state
        if (se?.structuralProfile) {
          hydratedRef.current = true;
          setters.setStructuralProfile(se.structuralProfile);
          if (se.deepenedOpportunities?.length > 0) {
            setters.setDeepenedOpportunities(se.deepenedOpportunities);
          }
          if (se.narrative) {
            setters.setNarrative(se.narrative);
          }
          if (se.insights?.length > 0) {
            setters.setInsights(se.insights);
          }
          setters.setHasRun(true);
          console.log("[StrategicEngine] ✓ Hydrated strategicEngine from DB:",
            `narrative=${!!se.narrative}, opportunities=${se.deepenedOpportunities?.length ?? 0}, insights=${se.insights?.length ?? 0}`);

          // Recompute if graph missing OR narrative missing (old persistence format)
          if (!persistedGraph?.nodes?.length || !se.narrative) {
            setTimeout(() => runAnalysis(), 1500);
          }
        }
      }).catch(() => { /* non-critical */ });
    });
  }, [analysisId, hasRun, narrative, deepenedOpportunities.length]);
}
