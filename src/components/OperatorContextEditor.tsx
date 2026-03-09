/**
 * OperatorContextEditor — Modal for configuring operator-specific ETA context.
 * Fields: available capital, time horizon, core skills, strategy preference, financing capacity.
 */

import { useState } from "react";
import { X, User, DollarSign, Clock, Brain, Handshake } from "lucide-react";
import { type OperatorContext, getOperatorContext, saveOperatorContext } from "@/lib/etaLens";
import { toast } from "sonner";

interface OperatorContextEditorProps {
  onClose: () => void;
  onSaved: () => void;
}

const TIME_OPTIONS = ["6 months", "1 year", "2 years", "3 years", "5 years", "7+ years"] as const;

export function OperatorContextEditor({ onClose, onSaved }: OperatorContextEditorProps) {
  const [ctx, setCtx] = useState<OperatorContext>(getOperatorContext);

  const handleSave = () => {
    saveOperatorContext(ctx);
    toast.success("Operator context saved — next analysis will use your profile");
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="typo-section-title">Operator Profile</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
        </div>

        <p className="typo-section-description -mt-3">
          Tell us about yourself so the AI can tailor strategic theses to your specific situation, skills, and resources.
        </p>

        <div className="space-y-4">
          {/* Available Capital */}
          <div>
            <label className="typo-card-meta flex items-center gap-1.5 mb-1">
              <DollarSign size={12} className="text-muted-foreground" />
              Available Capital
            </label>
            <input
              className="input-executive"
              placeholder="e.g. $250,000 cash"
              value={ctx.availableCapital}
              onChange={(e) => setCtx({ ...ctx, availableCapital: e.target.value })}
            />
          </div>

          {/* Financing Capacity */}
          <div>
            <label className="typo-card-meta flex items-center gap-1.5 mb-1">
              <DollarSign size={12} className="text-muted-foreground" />
              Additional Financing Capacity
            </label>
            <input
              className="input-executive"
              placeholder="e.g. SBA loan up to $500K, line of credit available"
              value={ctx.financingCapacity}
              onChange={(e) => setCtx({ ...ctx, financingCapacity: e.target.value })}
            />
          </div>

          {/* Time Horizon */}
          <div>
            <label className="typo-card-meta flex items-center gap-1.5 mb-1.5">
              <Clock size={12} className="text-muted-foreground" />
              Time Horizon
            </label>
            <div className="flex gap-2 flex-wrap">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setCtx({ ...ctx, timeHorizon: t })}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    ctx.timeHorizon === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Core Skills */}
          <div>
            <label className="typo-card-meta flex items-center gap-1.5 mb-1">
              <Brain size={12} className="text-muted-foreground" />
              Your Skills & Strengths
            </label>
            <input
              className="input-executive"
              placeholder="e.g. Tech-savvy, sales/marketing, analytical, operations"
              value={ctx.coreSkills}
              onChange={(e) => setCtx({ ...ctx, coreSkills: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              What are you personally good at? The AI will prioritize moves that leverage your strengths.
            </p>
          </div>

          {/* Strategy Preference */}
          <div>
            <label className="typo-card-meta flex items-center gap-1.5 mb-1">
              <Handshake size={12} className="text-muted-foreground" />
              Strategic Preference
            </label>
            <input
              className="input-executive"
              placeholder="e.g. Partnerships/ecosystem for leverage, organic growth, acquisition roll-up"
              value={ctx.strategyPreference}
              onChange={(e) => setCtx({ ...ctx, strategyPreference: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              How do you prefer to grow? The AI will weight strategies that match your style.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
