/**
 * LOI / Offer Builder
 * 
 * Generates a draft Letter of Intent with suggested price range,
 * deal structure (SBA 7a, seller note), and key contingencies.
 */

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Copy, ChevronDown, ChevronUp, Check,
  DollarSign, Shield, Clock, AlertTriangle,
} from "lucide-react";
import { extractFinancialInputs } from "@/lib/etaScoringEngine";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { toast } from "sonner";

interface LOIBuilderProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
}

interface LOISection {
  label: string;
  icon: typeof DollarSign;
  lines: { key: string; value: string; note?: string }[];
}

function formatCurrency(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function buildLOI(
  inputs: ReturnType<typeof extractFinancialInputs>,
  bi: Record<string, any> | null,
): { sections: LOISection[]; contingencies: string[]; plainText: string } {
  const companyName = bi?.business_overview?.company_name || "Target Company";
  const sections: LOISection[] = [];
  const contingencies: string[] = [];

  // Purchase Price section
  if (inputs.askingPrice && inputs.sde) {
    const multiple = inputs.askingPrice / inputs.sde;
    const lowOffer = inputs.sde * Math.max(2.0, multiple - 1.0);
    const highOffer = inputs.sde * Math.max(2.5, multiple - 0.5);

    sections.push({
      label: "Purchase Price",
      icon: DollarSign,
      lines: [
        { key: "Asking Price", value: formatCurrency(inputs.askingPrice) },
        { key: "SDE Basis", value: formatCurrency(inputs.sde) },
        { key: "Asking Multiple", value: `${multiple.toFixed(1)}x SDE` },
        { key: "Suggested Offer Range", value: `${formatCurrency(lowOffer)} – ${formatCurrency(highOffer)}`, note: `${(lowOffer / inputs.sde).toFixed(1)}x – ${(highOffer / inputs.sde).toFixed(1)}x SDE` },
      ],
    });
  }

  // Deal Structure section
  if (inputs.askingPrice) {
    const offerPrice = inputs.sde ? inputs.sde * Math.max(2.5, (inputs.askingPrice / inputs.sde) - 0.5) : inputs.askingPrice * 0.85;
    const sbaDown = offerPrice * 0.10;
    const sbaLoan = offerPrice * 0.80;
    const sellerNote = offerPrice * 0.10;

    sections.push({
      label: "Deal Structure",
      icon: Shield,
      lines: [
        { key: "Buyer Down Payment (10%)", value: formatCurrency(sbaDown) },
        { key: "SBA 7(a) Loan (80%)", value: formatCurrency(sbaLoan), note: "10-year term, Prime + 2.75%" },
        { key: "Seller Note (10%)", value: formatCurrency(sellerNote), note: "24-month standby, 6% interest, 5-year amort" },
        { key: "Total Consideration", value: formatCurrency(offerPrice) },
      ],
    });
  }

  // Timeline section
  sections.push({
    label: "Timeline",
    icon: Clock,
    lines: [
      { key: "Due Diligence Period", value: "60–90 days" },
      { key: "Seller Transition", value: "6–12 months post-close", note: "Part-time consulting at agreed rate" },
      { key: "Non-Compete", value: "3 years, same geography & industry" },
      { key: "Target Close", value: "90–120 days from LOI execution" },
    ],
  });

  // Standard contingencies
  contingencies.push("Satisfactory completion of buyer's due diligence");
  contingencies.push("SBA 7(a) loan approval at acceptable terms");
  contingencies.push("Verification of financial statements by independent CPA");
  contingencies.push("No material adverse change in business operations prior to closing");
  contingencies.push("Execution of mutually acceptable Asset Purchase Agreement");
  contingencies.push("Landlord consent to lease assignment (if applicable)");

  // Data-driven contingencies
  if (inputs.customerConcentration && inputs.customerConcentration > 0.15) {
    contingencies.push(`Key customer retention: Top customer (${(inputs.customerConcentration * 100).toFixed(0)}% of revenue) must confirm continued relationship`);
  }
  if (inputs.ownerDependency === "dependent" || inputs.ownerDependency === "owner_critical") {
    contingencies.push("Extended seller transition agreement (minimum 12 months) due to owner dependency");
  }
  if (inputs.employeeCount && inputs.employeeCount <= 5) {
    contingencies.push("Key employee retention agreements executed prior to closing");
  }

  // Build plain text
  const lines: string[] = [];
  lines.push(`LETTER OF INTENT — ${companyName}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push("");
  sections.forEach(s => {
    lines.push(`${s.label.toUpperCase()}`);
    s.lines.forEach(l => {
      lines.push(`  ${l.key}: ${l.value}${l.note ? ` (${l.note})` : ""}`);
    });
    lines.push("");
  });
  lines.push("CONTINGENCIES");
  contingencies.forEach((c, i) => lines.push(`  ${i + 1}. ${c}`));
  lines.push("");
  lines.push("This LOI is non-binding and subject to execution of definitive agreements.");

  return { sections, contingencies, plainText: lines.join("\n") };
}

export const LOIBuilder = memo(function LOIBuilder({ biExtraction, governedData }: LOIBuilderProps) {
  const inputs = useMemo(() => extractFinancialInputs(governedData, biExtraction), [biExtraction, governedData]);
  const loi = useMemo(() => buildLOI(inputs, biExtraction), [inputs, biExtraction]);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const companyName = biExtraction?.business_overview?.company_name || "Target Company";

  if (!inputs.askingPrice && !inputs.sde) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(loi.plainText);
    setCopied(true);
    toast.success("LOI copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <FileText size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-foreground">Draft LOI</h3>
            <p className="text-[10px] text-muted-foreground">{companyName} — Non-binding offer framework</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProvenanceBadge source="modeled" />
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-4 space-y-4"
        >
          {/* Copy button */}
          <div className="flex justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy LOI"}
            </button>
          </div>

          {/* Sections */}
          {loi.sections.map((section, si) => (
            <div key={si} className="rounded-lg p-3 space-y-2" style={{ background: "hsl(var(--muted) / 0.25)", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-1.5">
                <section.icon size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{section.label}</span>
              </div>
              {section.lines.map((line, li) => (
                <div key={li} className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted-foreground">{line.key}</span>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-foreground">{line.value}</span>
                    {line.note && <span className="text-[9px] text-muted-foreground ml-1.5">{line.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Contingencies */}
          <div className="rounded-lg p-3 space-y-2" style={{ background: "hsl(38, 92%, 50% / 0.04)", border: "1px solid hsl(38, 92%, 50% / 0.15)" }}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} style={{ color: "hsl(38, 92%, 50%)" }} />
              <span className="text-[11px] font-black uppercase tracking-widest text-foreground">Contingencies</span>
              <ProvenanceBadge source={inputs.customerConcentration ? "cim" : "modeled"} />
            </div>
            <ol className="space-y-1.5 pl-4">
              {loi.contingencies.map((c, i) => (
                <li key={i} className="text-[11px] text-muted-foreground leading-snug list-decimal">{c}</li>
              ))}
            </ol>
          </div>

          <p className="text-[9px] text-muted-foreground/60 text-center italic">
            This is a non-binding draft framework. Consult legal counsel before submission.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
