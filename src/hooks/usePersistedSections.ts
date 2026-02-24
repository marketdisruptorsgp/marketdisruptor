import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "visited_sections";

function getStore(): Record<string, Record<string, string[]>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveStore(store: Record<string, Record<string, string[]>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Persists visited section IDs per analysisId + stepKey in localStorage.
 * Returns [visitedSet, markVisited] where markVisited adds an id and persists.
 */
export function usePersistedSections(analysisId: string | null, stepKey: string, initialIds: string[] = []) {
  const [visited, setVisited] = useState<Set<string>>(() => {
    const stored = analysisId ? getStore()[analysisId]?.[stepKey] : null;
    return new Set(stored?.length ? stored : initialIds);
  });

  // Sync when analysisId changes
  useEffect(() => {
    if (!analysisId) return;
    const stored = getStore()[analysisId]?.[stepKey];
    if (stored?.length) {
      setVisited(prev => new Set([...prev, ...stored]));
    }
  }, [analysisId, stepKey]);

  const markVisited = useCallback((id: string) => {
    setVisited(prev => {
      const next = new Set([...prev, id]);
      if (analysisId) {
        const store = getStore();
        if (!store[analysisId]) store[analysisId] = {};
        store[analysisId][stepKey] = [...next];
        saveStore(store);
      }
      return next;
    });
  }, [analysisId, stepKey]);

  const markAll = useCallback((ids: string[]) => {
    setVisited(prev => {
      const next = new Set([...prev, ...ids]);
      if (analysisId) {
        const store = getStore();
        if (!store[analysisId]) store[analysisId] = {};
        store[analysisId][stepKey] = [...next];
        saveStore(store);
      }
      return next;
    });
  }, [analysisId, stepKey]);

  return { visited, markVisited, markAll } as const;
}
