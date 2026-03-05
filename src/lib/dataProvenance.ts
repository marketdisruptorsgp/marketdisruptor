/**
 * Data Provenance System
 * Every numeric value must include a traceable provenance record.
 */

export type ProvenanceDataType = "SOURCE" | "USER_INPUT" | "MODELED";

export interface DataProvenance {
  dataType: ProvenanceDataType;
  source: string;
  method: string;
  inputs: Record<string, unknown>;
  confidence: number;
  timestamp: string;
}

export interface ProvenancedValue<T = number> {
  value: T;
  provenance: DataProvenance;
}

export function createProvenance(
  dataType: ProvenanceDataType,
  source: string,
  method: string,
  inputs: Record<string, unknown>,
  confidence: number
): DataProvenance {
  return {
    dataType,
    source,
    method,
    inputs,
    confidence: Math.max(0, Math.min(1, confidence)),
    timestamp: new Date().toISOString(),
  };
}

export function provenanced<T>(value: T, provenance: DataProvenance): ProvenancedValue<T> {
  return { value, provenance };
}

export function modeledValue(
  value: number,
  method: string,
  inputs: Record<string, unknown>,
  confidence = 0.85
): ProvenancedValue<number> {
  return provenanced(value, createProvenance("MODELED", "Financial Modeling Engine", method, inputs, confidence));
}

export function userInputValue(value: number, field: string): ProvenancedValue<number> {
  return provenanced(value, createProvenance("USER_INPUT", "User Input", field, { [field]: value }, 1.0));
}

export function sourceValue(value: number, sourceName: string, method: string): ProvenancedValue<number> {
  return provenanced(value, createProvenance("SOURCE", sourceName, method, { value }, 0.9));
}

/** Validate that all values in a record have provenance */
export function validateProvenance(record: Record<string, ProvenancedValue | unknown>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  for (const [key, val] of Object.entries(record)) {
    if (typeof val === "object" && val !== null && "provenance" in val) continue;
    if (typeof val === "number") missing.push(key);
  }
  return { valid: missing.length === 0, missing };
}
