import { useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Download, FileText, Link2, ChevronDown, Check, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { generateInvestorPitchPDF } from "@/services/export/pdfGenerator";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import { generateOpportunityBriefPDF } from "@/services/export/opportunityBrief";
import { generateInvestorPitchPPTX } from "@/services/export/pptxGenerator";
import { buildPublicUrl } from "@/lib/publicUrl";

interface ExportPanelProps {
  product: Product;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pitchDeckData: any;
  analysisData?: Record<string, unknown> | null;
  analysisId?: string;
  userId?: string;
  accentColor?: string;
}

export function ExportPanel({
  product,
  pitchDeckData,
  analysisData,
  analysisId,
  userId,
  accentColor = "hsl(var(--primary))",
}: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const analysisCtx = useAnalysis();

  const handlePPTX = () => {
    if (!pitchDeckData) return;
    setGenerating("pptx");
    try {
      generateInvestorPitchPPTX(product, pitchDeckData, accentColor, analysisCtx.pitchDeckImages.length > 0 ? analysisCtx.pitchDeckImages : undefined);
      toast.success("PowerPoint deck exported!");
    } catch {
      toast.error("Failed to export PowerPoint");
    } finally {
      setGenerating(null);
    }
  };

  const handleInvestorPDF = () => {
    if (!pitchDeckData) return;
    setGenerating("pitch");
    try {
      generateInvestorPitchPDF(product, pitchDeckData);
      toast.success("Investor pitch PDF exported!");
    } catch {
      toast.error("Failed to export pitch PDF");
    } finally {
      setGenerating(null);
    }
  };

  const handleBriefPDF = () => {
    setGenerating("brief");
    try {
      generateOpportunityBriefPDF(product, analysisData || null);
      toast.success("Opportunity brief exported!");
    } catch {
      toast.error("Failed to export brief");
    } finally {
      setGenerating(null);
    }
  };

  const handleFullReportPDF = () => {
    setGenerating("full");
    try {
      downloadFullAnalysisPDF(product, analysisData || null);
      toast.success("Full report PDF exported!");
    } catch {
      toast.error("Failed to export full report");
    } finally {
      setGenerating(null);
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = buildPublicUrl(`/analysis/share/${analysisId || ""}`);
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        style={{ background: accentColor, color: "white" }}
      >
        <Download size={11} /> Export <ChevronDown size={10} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg z-50 p-2 space-y-1"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          {/* Full Report PDF — PRIMARY */}
          <button
            onClick={handleFullReportPDF}
            disabled={!!generating}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}14` }}>
              {generating === "full" ? <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} /> : <FileText size={14} style={{ color: accentColor }} />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Full Report PDF</p>
              <p className="text-[10px] text-muted-foreground">Every section, all text, complete detail</p>
            </div>
          </button>

          {/* PowerPoint */}
          <button
            onClick={handlePPTX}
            disabled={!!generating}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}14` }}>
              {generating === "pptx" ? <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} /> : <Presentation size={14} style={{ color: accentColor }} />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">PowerPoint Deck</p>
              <p className="text-[10px] text-muted-foreground">16:9 presentation-ready .pptx</p>
            </div>
          </button>

          {/* Investor Pitch PDF */}
          <button
            onClick={handleInvestorPDF}
            disabled={!!generating}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}14` }}>
              {generating === "pitch" ? <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} /> : <Download size={14} style={{ color: accentColor }} />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Investor Pitch PDF</p>
              <p className="text-[10px] text-muted-foreground">Executive slide deck format</p>
            </div>
          </button>

          {/* Opportunity Brief */}
          <button
            onClick={handleBriefPDF}
            disabled={!!generating}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(142 70% 40% / 0.1)" }}>
              {generating === "brief" ? <Loader2 size={14} className="animate-spin" style={{ color: "hsl(142 70% 40%)" }} /> : <FileText size={14} style={{ color: "hsl(142 70% 40%)" }} />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Opportunity Brief</p>
              <p className="text-[10px] text-muted-foreground">Summary + risks + next steps</p>
            </div>
          </button>

          {/* Share Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-muted"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(38 92% 50% / 0.1)" }}>
              {copied ? <Check size={14} style={{ color: "hsl(142 70% 40%)" }} /> : <Link2 size={14} style={{ color: "hsl(38 92% 50%)" }} />}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{copied ? "Link Copied!" : "Copy Shareable Link"}</p>
              <p className="text-[10px] text-muted-foreground">Share read-only analysis view</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
