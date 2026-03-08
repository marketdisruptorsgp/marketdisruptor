/**
 * RUN-SCOPED ID FACTORY — Centralized ID generation per analysis run.
 *
 * All evidence, signals, constraints, leverage, and opportunity IDs
 * are derived from a single runId, guaranteeing:
 *   1. No cross-run ID collisions
 *   2. All references valid within a single run
 *   3. Centralized creation point for canonical evidence objects
 *
 * Usage:
 *   const factory = createRunIdFactory();
 *   const id = factory.next("evidence");  // → "r-abc123-evidence-1"
 *   const runId = factory.runId;          // → "r-abc123"
 */

let globalRunCounter = 0;

export interface RunIdFactory {
  /** Unique identifier for this analysis run */
  readonly runId: string;
  /** Generate a new scoped ID with the given prefix */
  next(prefix: string): string;
  /** Get the total number of IDs generated in this run */
  get count(): number;
}

/**
 * Creates a new run-scoped ID factory.
 * Each call produces a factory with a unique runId.
 */
export function createRunIdFactory(): RunIdFactory {
  const runId = `r-${(++globalRunCounter).toString(36)}-${Date.now().toString(36).slice(-4)}`;
  let counter = 0;

  return {
    runId,
    next(prefix: string): string {
      return `${runId}-${prefix}-${++counter}`;
    },
    get count() {
      return counter;
    },
  };
}

/**
 * ID REMAPPING — Handles deduplication ID mapping.
 *
 * When evidence items are merged during deduplication, this mapping
 * tracks old → canonical ID so downstream references can be updated.
 */
export interface IdRemapTable {
  /** Map of removed ID → canonical surviving ID */
  readonly mapping: ReadonlyMap<string, string>;
  /** Remap an array of IDs, replacing any removed IDs with their canonical form */
  remap(ids: string[]): string[];
  /** Remap a single ID */
  remapOne(id: string): string;
  /** Number of IDs that were remapped */
  readonly remappedCount: number;
}

export function createIdRemapTable(): {
  table: IdRemapTable;
  /** Record that `removedId` was merged into `canonicalId` */
  addMapping(removedId: string, canonicalId: string): void;
} {
  const map = new Map<string, string>();

  const table: IdRemapTable = {
    get mapping() { return map; },
    remap(ids: string[]): string[] {
      return [...new Set(ids.map(id => map.get(id) ?? id))];
    },
    remapOne(id: string): string {
      return map.get(id) ?? id;
    },
    get remappedCount() { return map.size; },
  };

  return {
    table,
    addMapping(removedId: string, canonicalId: string) {
      map.set(removedId, canonicalId);
    },
  };
}
