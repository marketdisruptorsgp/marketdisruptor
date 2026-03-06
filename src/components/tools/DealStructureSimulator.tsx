/**
 * DEAL STRUCTURE SIMULATOR — Interactive equity/debt combo tool
 */

import { useState, useMemo, useCallback } from "react";
import { Save, ArrowUpDown } from "lucide-react";
import { fmtCurrency } from "@/lib/financialModelingEngine";
import { saveScenario, generateScenarioId, type ToolScenario } from "@/lib/scenarioEngine";
import { toast } from "sonner";

interface Props {
  analysisId: string;
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

export function DealStructureSimulator({ analysisId, onScenarioSaved }: Props) {
  const [purchasePrice, setPurchasePrice] = useState(2000000);
  const [buyerEquityPct, setBuyerEquityPct] = useState(10);
  const [sellerNotePct, setSellerNotePct] = useState(10);
  const [sellerNoteRate, setSellerNoteRate] = useState(5);
  const [sellerNoteTerm, setSellerNoteTerm] = useState(5);
  const [sbaRate, setSbaRate] = useState(6.5);
  const [sbaTerm, setSbaTerm] = useState(10);
  const [scenarioName, setScenarioName] = useState("Deal Structure 1");

  const results = useMemo(() => {
    const equity = purchasePrice * (buyerEquityPct / 100);
    const sellerNote = purchasePrice * (sellerNotePct / 100);
    const sbaLoan = purchasePrice - equity - sellerNote;

    const sbaMonthly = sbaLoan > 0
      ? sbaLoan * ((sbaRate / 100 / 12) * Math.pow(1 + sbaRate / 100 / 12, sbaTerm * 12)) /
        (Math.pow(1 + sbaRate / 100 / 12, sbaTerm * 12) - 1)
      : 0;

    const sellerMonthly = sellerNote > 0
      ? sellerNote * ((sellerNoteRate / 100 / 12) * Math.pow(1 + sellerNoteRate / 100 / 12, sellerNoteTerm * 12)) /
        (Math.pow(1 + sellerNoteRate / 100 / 12, sellerNoteTerm * 12) - 1)
      : 0;

    const totalMonthly = sbaMonthly + sellerMonthly;
    const totalAnnualDebt = totalMonthly * 12;
    const ownershipPct = 100; // Buyer gets 100% ownership

    return {
      equity, sellerNote, sbaLoan, sbaMonthly, sellerMonthly,
      totalMonthly, totalAnnualDebt, ownershipPct,
    };
  }, [purchasePrice, buyerEquityPct, sellerNotePct, sellerNoteRate, sellerNoteTerm, sbaRate, sbaTerm]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(),
      analysisId,
      toolId: "deal-structure-simulator",
      scenarioName,
      inputVariables: { purchasePrice, buyerEquityPct, sellerNotePct, sellerNoteRate, sellerNoteTerm, sbaRate, sbaTerm },
      outputResults: {
        equity: results.equity,
        sellerNote: results.sellerNote,
        sbaLoan: results.sbaLoan,
        totalMonthlyPayment: Math.round(results.totalMonthly),
        totalAnnualDebt: Math.round(results.totalAnnualDebt),
      },
      strategicImpact: buyerEquityPct <= 15 ? "high" : "medium",
      timestamp: Date.now(),
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Deal structure saved");
  }, [analysisId, scenarioName, purchasePrice, buyerEquityPct, sellerNotePct, sellerNoteRate, sellerNoteTerm, sbaRate, sbaTerm, results, onScenarioSaved]);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <SliderField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} min={250000} max={10000000} step={50000} format={fmtCurrency} />
      <SliderField label="Buyer Equity %" value={buyerEquityPct} onChange={setBuyerEquityPct} min={5} max={50} step={1} format={v => `${v}%`} />
      <SliderField label="Seller Note %" value={sellerNotePct} onChange={setSellerNotePct} min={0} max={40} step={1} format={v => `${v}%`} />

      {sellerNotePct > 0 && (
        <>
          <SliderField label="Seller Note Rate" value={sellerNoteRate} onChange={setSellerNoteRate} min={2} max={10} step={0.25} format={v => `${v}%`} />
          <SliderField label="Seller Note Term" value={sellerNoteTerm} onChange={setSellerNoteTerm} min={2} max={10} step={1} format={v => `${v} yrs`} />
        </>
      )}
      <SliderField label="SBA Rate" value={sbaRate} onChange={setSbaRate} min={3} max={12} step={0.25} format={v => `${v}%`} />
      <SliderField label="SBA Term" value={sbaTerm} onChange={setSbaTerm} min={5} max={25} step={1} format={v => `${v} yrs`} />

      {/* Structure Visualization */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Capital Structure</p>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div className="flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${buyerEquityPct}%`, background: "hsl(229 89% 63%)" }}>
            {buyerEquityPct}%
          </div>
          {sellerNotePct > 0 && (
            <div className="flex items-center justify-center text-[9px] font-bold text-white" style={{ width: `${sellerNotePct}%`, background: "hsl(38 92% 50%)" }}>
              {sellerNotePct}%
            </div>
          )}
          <div className="flex items-center justify-center text-[9px] font-bold text-white flex-1" style={{ background: "hsl(152 60% 44%)" }}>
            {100 - buyerEquityPct - sellerNotePct}%
          </div>
        </div>
        <div className="flex gap-4 text-[9px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(229 89% 63%)" }} />Equity</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(38 92% 50%)" }} />Seller Note</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(152 60% 44%)" }} />SBA Loan</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Cell label="Buyer Equity" value={fmtCurrency(results.equity)} />
          <Cell label="Seller Note" value={fmtCurrency(results.sellerNote)} />
          <Cell label="SBA Loan" value={fmtCurrency(results.sbaLoan)} />
          <Cell label="Total Monthly" value={fmtCurrency(results.totalMonthly)} />
          <Cell label="Annual Debt Service" value={fmtCurrency(results.totalAnnualDebt)} />
          <Cell label="Ownership" value={`${results.ownershipPct}%`} />
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary text-primary-foreground">
        <Save size={15} />
        Save Scenario → Feed Intelligence
      </button>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-sm font-extrabold text-foreground tabular-nums">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary" />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-background">
      <p className="text-xs font-extrabold tabular-nums text-foreground">{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
