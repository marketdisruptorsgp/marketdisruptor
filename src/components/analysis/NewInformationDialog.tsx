import React, { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FilePlus, Upload, Loader2, FileText, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useBIExtraction, fileToDocumentText, extractionToContext, type BIExtraction } from "@/hooks/useBIExtraction";
import { validateFileUpload } from "@/utils/fileValidation";
import { useAnalysis, type AdaptiveContextData } from "@/contexts/AnalysisContext";

interface NewInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accentColor?: string;
}

export function NewInformationDialog({ open, onOpenChange, accentColor }: NewInformationDialogProps) {
  const analysis = useAnalysis();
  const { extract, extracting } = useBIExtraction();
  const [files, setFiles] = useState<File[]>([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f => validateFileUpload(f).allowed);
    setFiles(prev => [...prev, ...valid]);
  }, []);

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) return;

    // Convert files to document texts
    const docTexts = await Promise.all(files.map(f => fileToDocumentText(f)));

    // Run BI extraction on new documents
    const result = await extract({
      documentTexts: docTexts,
      context: analysis.businessModelInput?.description || "",
      lensType: (analysis as any).activeLens?.lensType || undefined,
    });

    if (!result) return;

    // Merge new extraction into existing adaptive context without resetting state
    const existingCtx = analysis.adaptiveContext;
    const newExtractedContext = extractionToContext(result);
    const mergedExtractedContext = existingCtx?.extractedContext
      ? `${existingCtx.extractedContext}\n\n--- NEW INFORMATION ---\n${newExtractedContext}`
      : newExtractedContext;

    // Merge biExtraction: new fields override old, arrays concatenate
    const existingBI = (existingCtx?.biExtraction || {}) as Record<string, any>;
    const mergedBI = mergeExtractions(existingBI, result as unknown as Record<string, any>);

    const updatedCtx: AdaptiveContextData = {
      ...existingCtx,
      extractedContext: mergedExtractedContext,
      biExtraction: mergedBI,
    };

    analysis.setAdaptiveContext(updatedCtx);

    // Persist merged extraction to analysis_data
    if (analysis.analysisId) {
      analysis.saveStepData("adaptiveContext", updatedCtx);
      analysis.saveStepData("biExtraction", mergedBI);
    }

    setDone(true);
    toast.success("New information integrated — downstream steps will use updated intelligence.");
  }, [files, extract, analysis]);

  const handleClose = () => {
    setFiles([]);
    setDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FilePlus size={18} style={{ color: accentColor }} />
            Add New Information
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Upload additional documents (CIMs, financials, reports) to enrich the existing analysis without resetting it.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-sm text-foreground font-medium">Intelligence merged successfully</p>
            <p className="text-xs text-muted-foreground text-center">
              {files.length} document{files.length > 1 ? "s" : ""} processed. Navigate between steps to see updated insights.
            </p>
            <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
            >
              <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop files here or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">PDF, CSV, XLSX, images — up to 20MB each</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.csv,.xlsx,.xls,.txt,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
                    <FileText size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground flex-1">{f.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)}KB</span>
                    <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={extracting}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={files.length === 0 || extracting}
                style={accentColor ? { backgroundColor: accentColor } : undefined}
              >
                {extracting ? (
                  <><Loader2 size={14} className="animate-spin" /> Extracting…</>
                ) : (
                  <><FilePlus size={14} /> Process & Merge</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Deep-merge two BI extraction objects — arrays are concatenated, objects are merged,
 * new scalar values override old ones.
 */
function mergeExtractions(existing: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = { ...existing };
  for (const key of Object.keys(incoming)) {
    const oldVal = existing[key];
    const newVal = incoming[key];
    if (newVal == null) continue;
    if (Array.isArray(newVal) && Array.isArray(oldVal)) {
      // Deduplicate string arrays, concatenate object arrays
      if (typeof newVal[0] === "string") {
        merged[key] = [...new Set([...oldVal, ...newVal])];
      } else {
        merged[key] = [...oldVal, ...newVal];
      }
    } else if (typeof newVal === "object" && typeof oldVal === "object" && !Array.isArray(newVal)) {
      merged[key] = mergeExtractions(oldVal || {}, newVal);
    } else {
      merged[key] = newVal;
    }
  }
  return merged;
}
