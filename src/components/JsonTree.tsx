/**
 * JsonTree — Reusable recursive JSON tree component for diagnostics/observability.
 * Features: collapsible objects/arrays, truncated strings, typed value coloring,
 * configurable maxDepth, expand/collapse all controls, circular reference detection.
 */

import React, { useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/* ─── Types ─── */
interface JsonTreeProps {
  /** The value to render */
  data: unknown;
  /** Maximum depth before truncating (default: 4) */
  maxDepth?: number;
  /** Show root-level expand/collapse all controls */
  showControls?: boolean;
  /** Initial expanded state for all nodes */
  defaultExpanded?: boolean;
}

interface NodeProps {
  value: unknown;
  depth: number;
  maxDepth: number;
  expandAll: boolean | null; // null = use local state
  seen: WeakSet<object>;
}

const STRING_TRUNCATE = 200;

/* ─── Color helpers ─── */
function getValueColor(value: unknown): string {
  if (value === null) return "hsl(var(--muted-foreground))";
  if (value === undefined) return "hsl(var(--muted-foreground))";
  if (typeof value === "boolean") return value ? "hsl(142 70% 35%)" : "hsl(var(--destructive))";
  if (typeof value === "number") return "hsl(217 91% 60%)";
  if (typeof value === "string") return "hsl(38 92% 42%)";
  return "hsl(var(--foreground))";
}

/* ─── Primitive value renderer ─── */
function PrimitiveNode({ value }: { value: string | number | boolean | null | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const strVal = String(value === null ? "null" : value === undefined ? "undefined" : value);
  const isLongString = typeof value === "string" && value.length > STRING_TRUNCATE;
  const display = isLongString && !expanded ? `"${strVal.slice(0, STRING_TRUNCATE)}…"` : typeof value === "string" ? `"${strVal}"` : strVal;

  return (
    <span style={{ color: getValueColor(value) }}>
      {display}
      {isLongString && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-xs underline opacity-70 hover:opacity-100"
          style={{ color: "hsl(var(--primary))" }}
        >
          {expanded ? "collapse" : `+${value?.toString().length ?? 0 - STRING_TRUNCATE} chars`}
        </button>
      )}
    </span>
  );
}

/* ─── Recursive node ─── */
function JsonNode({ value, depth, maxDepth, expandAll, seen }: NodeProps) {
  const [localOpen, setLocalOpen] = useState(depth < 2);
  const isOpen = expandAll !== null ? expandAll : localOpen;

  // Primitive types
  if (value === null || value === undefined || typeof value !== "object") {
    return <PrimitiveNode value={value as string | number | boolean | null | undefined} />;
  }

  // Circular reference detection
  if (seen.has(value as object)) {
    return <span style={{ color: "hsl(var(--destructive))" }}>[Circular]</span>;
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);
  const count = entries.length;
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";

  if (count === 0) {
    return <span className="text-muted-foreground">{openBracket}{closeBracket}</span>;
  }

  // At max depth: show truncated summary
  if (depth >= maxDepth) {
    return (
      <span className="text-muted-foreground italic text-xs">
        {openBracket}…{count} {isArray ? "items" : "keys"}{closeBracket}
      </span>
    );
  }

  // Add current object to seen set before recursing
  seen.add(value as object);

  return (
    <span>
      <button
        onClick={() => { if (expandAll === null) setLocalOpen(!localOpen); }}
        className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {isOpen
          ? <ChevronDown className="w-3 h-3 inline-block" />
          : <ChevronRight className="w-3 h-3 inline-block" />}
        <span className="text-muted-foreground">{openBracket}</span>
        {!isOpen && (
          <span className="text-muted-foreground text-xs">
            {count} {isArray ? "items" : "keys"}{closeBracket}
          </span>
        )}
      </button>
      {isOpen && (
        <span className="block">
          {entries.map(([key, val]) => (
            <span key={key} className="block" style={{ paddingLeft: "1.25rem" }}>
              <span className="text-muted-foreground" style={{ color: "hsl(var(--muted-foreground))" }}>
                {isArray ? "" : <><span style={{ color: "hsl(262 52% 65%)" }}>{key}</span><span className="text-muted-foreground">: </span></>}
              </span>
              {isArray && <span style={{ color: "hsl(var(--muted-foreground))" }} className="text-xs">{key}: </span>}
              <JsonNode
                value={val}
                depth={depth + 1}
                maxDepth={maxDepth}
                expandAll={expandAll}
                seen={seen}
              />
            </span>
          ))}
          <span className="block text-muted-foreground" style={{ paddingLeft: "0" }}>
            {closeBracket}
          </span>
        </span>
      )}
    </span>
  );
}

/* ─── Public component ─── */
export function JsonTree({ data, maxDepth = 4, showControls = true, defaultExpanded = false }: JsonTreeProps) {
  const [expandAll, setExpandAll] = useState<boolean | null>(defaultExpanded ? true : null);
  const seen = useRef(new WeakSet<object>()).current;

  const handleExpandAll = useCallback(() => setExpandAll(true), []);
  const handleCollapseAll = useCallback(() => setExpandAll(false), []);
  const handleReset = useCallback(() => setExpandAll(null), []);

  return (
    <div className="font-mono text-xs leading-relaxed">
      {showControls && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleExpandAll}
            className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            Expand all
          </button>
          <button
            onClick={handleCollapseAll}
            className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            Collapse all
          </button>
          {expandAll !== null && (
            <button
              onClick={handleReset}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted/50 text-muted-foreground transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      )}
      <div className="overflow-auto">
        <JsonNode
          value={data}
          depth={0}
          maxDepth={maxDepth}
          expandAll={expandAll}
          seen={seen}
        />
      </div>
    </div>
  );
}
