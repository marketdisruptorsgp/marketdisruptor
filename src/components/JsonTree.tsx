import React, { useState, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function JsonValue({
  value,
  depth,
  maxDepth,
  seen,
}: {
  value: unknown;
  depth: number;
  maxDepth: number;
  seen: WeakSet<object>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [strExpanded, setStrExpanded] = useState(false);

  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (value === undefined) {
    return <span className="text-muted-foreground italic">undefined</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span style={{ color: "hsl(270 70% 55%)" }} className="font-mono text-xs">
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number") {
    return (
      <span style={{ color: "hsl(210 80% 55%)" }} className="font-mono text-xs">
        {String(value)}
      </span>
    );
  }
  if (typeof value === "string") {
    const truncated = value.length > 200;
    const display = truncated && !strExpanded ? value.slice(0, 200) + "…" : value;
    return (
      <span className="text-green-600 dark:text-green-400 font-mono text-xs break-all">
        "{display}"
        {truncated && (
          <button
            onClick={() => setStrExpanded(!strExpanded)}
            className="ml-1 text-primary text-xs underline"
          >
            {strExpanded ? "less" : `+${value.length - 200} more`}
          </button>
        )}
      </span>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-muted-foreground font-mono text-xs">[]</span>;

    if (seen.has(value)) return <span className="text-muted-foreground italic text-xs">[circular]</span>;

    if (depth >= maxDepth && !expanded) {
      return (
        <button onClick={() => setExpanded(true)} className="text-primary text-xs underline font-mono">
          [{value.length} items — expand]
        </button>
      );
    }

    // Mark as seen before rendering children
    seen.add(value);

    return (
      <span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 text-xs font-mono text-foreground hover:text-primary"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          [{value.length} items]
        </button>
        {expanded && (
          <div className="pl-4 border-l border-border ml-1 mt-1 space-y-1">
            {value.map((item, i) => (
              <div key={i} className="flex items-start gap-1 text-xs">
                <span className="text-muted-foreground font-mono flex-shrink-0">[{i}]:</span>
                <JsonValue value={item} depth={depth + 1} maxDepth={maxDepth} seen={seen} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  if (typeof value === "object") {
    if (seen.has(value as object))
      return <span className="text-muted-foreground italic text-xs">[circular]</span>;

    const keys = Object.keys(value as object);
    if (keys.length === 0)
      return <span className="text-muted-foreground font-mono text-xs">{"{}"}</span>;

    if (depth >= maxDepth && !expanded) {
      return (
        <button onClick={() => setExpanded(true)} className="text-primary text-xs underline font-mono">
          {"{"}…{keys.length} keys{"}"} — expand
        </button>
      );
    }

    // Mark as seen before rendering children
    seen.add(value as object);

    return (
      <span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-0.5 text-xs font-mono text-foreground hover:text-primary"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {"{"}…{keys.length} keys{"}"}
        </button>
        {expanded && (
          <div className="pl-4 border-l border-border ml-1 mt-1 space-y-1">
            {keys.map((k) => (
              <div key={k} className="flex items-start gap-1 text-xs">
                <span className="text-primary font-mono flex-shrink-0 font-semibold">{k}:</span>
                <JsonValue
                  value={(value as Record<string, unknown>)[k]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  seen={seen}
                />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }

  return <span className="font-mono text-xs text-foreground">{String(value)}</span>;
}

/**
 * Renders JSON as a readable expandable tree.
 * - Objects: key:value pairs, indented, collapsible
 * - Arrays: "[N items]" header, collapsible list
 * - Strings: quoted, truncated at 200 chars with expand
 * - Numbers: blue, booleans: purple, null: gray
 * - maxDepth prop (default 4) with "Expand all" / "Collapse all" controls
 * Handles circular references gracefully.
 */
export function JsonTree({ data, maxDepth = 4 }: { data: unknown; maxDepth?: number }) {
  const [expandAll, setExpandAll] = useState(false);
  // Single shared seen set per render to detect circular refs across the whole tree
  const seenRef = useRef(new WeakSet<object>());

  if (data === null || data === undefined) {
    return <span className="text-muted-foreground italic text-xs">No data</span>;
  }

  if (typeof data !== "object") {
    return <span className="font-mono text-xs text-foreground">{String(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const keys = isArray ? [] : Object.keys(data as object);

  return (
    <div className="text-xs font-mono">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setExpandAll(!expandAll)} className="text-xs text-primary underline">
          {expandAll ? "Collapse all" : "Expand all"}
        </button>
        <span className="text-muted-foreground">
          {isArray
            ? `Array [${(data as unknown[]).length} items]`
            : `Object {${keys.length} keys}`}
        </span>
      </div>
      <div className="space-y-1">
        {isArray
          ? (data as unknown[]).map((item, i) => (
              <div key={i} className="flex items-start gap-1">
                <span className="text-muted-foreground flex-shrink-0">[{i}]:</span>
                <JsonValue
                  value={item}
                  depth={1}
                  maxDepth={expandAll ? 99 : maxDepth}
                  seen={seenRef.current}
                />
              </div>
            ))
          : Object.entries(data as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="flex items-start gap-1">
                <span className="text-primary font-semibold flex-shrink-0">{k}:</span>
                <JsonValue
                  value={v}
                  depth={1}
                  maxDepth={expandAll ? 99 : maxDepth}
                  seen={seenRef.current}
                />
              </div>
            ))}
      </div>
    </div>
  );
}

