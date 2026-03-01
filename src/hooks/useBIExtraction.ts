import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BIExtraction {
  business_overview: {
    company_name: string | null;
    industry: string | null;
    primary_offering: string;
    target_customers: string[];
    value_proposition: string;
    confidence: "high" | "medium" | "low";
  };
  value_creation_system: {
    inputs: string[];
    core_activities: string[];
    outputs: string[];
    delivery_channels: string[];
    evidence: string[];
  };
  revenue_engine: {
    revenue_sources: string[];
    pricing_model: string[];
    cost_drivers: string[];
    margin_levers: string[];
    evidence: string[];
  };
  operating_model: {
    workflow_stages: {
      stage: string;
      purpose: string;
      dependencies: string[];
      risks: string[];
    }[];
    key_resources: string[];
    partners: string[];
    evidence: string[];
  };
  constraints: {
    constraint: string;
    type: "operational" | "market" | "financial" | "technical";
    causes: string[];
    effects: string[];
    evidence: string[];
    confidence: "high" | "medium" | "low";
  }[];
  signals_for_visualization: {
    primary_system_nodes: string[];
    causal_relationships: {
      from: string;
      to: string;
      relationship: "drives" | "limits" | "enables" | "depends_on";
    }[];
    candidate_leverage_points: string[];
  };
  missing_critical_information: string[];
}

interface ExtractParams {
  documentTexts?: { name: string; content: string }[];
  imageUrls?: string[];
  context?: string;
}

export function useBIExtraction() {
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState<BIExtraction | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const extract = useCallback(async (params: ExtractParams): Promise<BIExtraction | null> => {
    if ((!params.documentTexts || params.documentTexts.length === 0) && (!params.imageUrls || params.imageUrls.length === 0)) {
      return null;
    }

    setExtracting(true);
    setExtractionError(null);

    try {
      const { data, error } = await supabase.functions.invoke("extract-business-intelligence", {
        body: params,
      });

      if (error || !data?.success) {
        const msg = data?.error || error?.message || "Extraction failed";
        setExtractionError(msg);
        toast.error("Document extraction failed: " + msg);
        return null;
      }

      setExtraction(data.extraction);
      return data.extraction;
    } catch (err) {
      const msg = String(err);
      setExtractionError(msg);
      toast.error("Extraction error: " + msg);
      return null;
    } finally {
      setExtracting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExtraction(null);
    setExtractionError(null);
  }, []);

  return { extract, extracting, extraction, extractionError, reset };
}

/**
 * Convert a File to base64 text content for sending to the extraction engine.
 * For text-based files (CSV, etc.) reads as text. For binary (PDF, XLSX, etc.) reads as dataURL.
 */
export async function fileToDocumentText(file: File): Promise<{ name: string; content: string }> {
  const textTypes = ["text/csv", "text/plain", "text/tab-separated-values"];
  
  if (textTypes.includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
    const text = await file.text();
    return { name: file.name, content: text };
  }

  // For binary documents, read as base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ name: file.name, content: reader.result as string });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Flatten BIExtraction into a context string for downstream analysis prompts.
 */
export function extractionToContext(ext: BIExtraction): string {
  const parts: string[] = [];

  if (ext.business_overview) {
    const bo = ext.business_overview;
    parts.push(`EXTRACTED INTELLIGENCE (confidence: ${bo.confidence}):`);
    if (bo.company_name) parts.push(`Company: ${bo.company_name}`);
    if (bo.industry) parts.push(`Industry: ${bo.industry}`);
    parts.push(`Offering: ${bo.primary_offering}`);
    parts.push(`Customers: ${bo.target_customers.join(", ")}`);
    parts.push(`Value prop: ${bo.value_proposition}`);
  }

  if (ext.value_creation_system) {
    const vc = ext.value_creation_system;
    parts.push(`\nVALUE CREATION:`);
    parts.push(`Inputs: ${vc.inputs.join(", ")}`);
    parts.push(`Core activities: ${vc.core_activities.join(", ")}`);
    parts.push(`Outputs: ${vc.outputs.join(", ")}`);
    parts.push(`Channels: ${vc.delivery_channels.join(", ")}`);
  }

  if (ext.revenue_engine) {
    const re = ext.revenue_engine;
    parts.push(`\nREVENUE ENGINE:`);
    parts.push(`Sources: ${re.revenue_sources.join(", ")}`);
    parts.push(`Pricing: ${re.pricing_model.join(", ")}`);
    parts.push(`Cost drivers: ${re.cost_drivers.join(", ")}`);
    parts.push(`Margin levers: ${re.margin_levers.join(", ")}`);
  }

  if (ext.operating_model?.workflow_stages?.length) {
    parts.push(`\nOPERATING MODEL:`);
    for (const stage of ext.operating_model.workflow_stages) {
      parts.push(`  ${stage.stage}: ${stage.purpose} (deps: ${stage.dependencies.join(", ")}; risks: ${stage.risks.join(", ")})`);
    }
    if (ext.operating_model.key_resources.length) parts.push(`Resources: ${ext.operating_model.key_resources.join(", ")}`);
    if (ext.operating_model.partners.length) parts.push(`Partners: ${ext.operating_model.partners.join(", ")}`);
  }

  if (ext.constraints?.length) {
    parts.push(`\nCONSTRAINTS:`);
    for (const c of ext.constraints) {
      parts.push(`  [${c.type}/${c.confidence}] ${c.constraint}`);
      if (c.causes.length) parts.push(`    Causes: ${c.causes.join("; ")}`);
      if (c.effects.length) parts.push(`    Effects: ${c.effects.join("; ")}`);
    }
  }

  if (ext.signals_for_visualization?.candidate_leverage_points?.length) {
    parts.push(`\nLEVERAGE POINTS: ${ext.signals_for_visualization.candidate_leverage_points.join(", ")}`);
  }

  if (ext.missing_critical_information?.length) {
    parts.push(`\nMISSING INFO: ${ext.missing_critical_information.join("; ")}`);
  }

  return parts.join("\n");
}
