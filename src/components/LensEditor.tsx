import React, { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserLens } from "@/components/LensToggle";

interface LensEditorProps {
  lens: UserLens | null;
  onClose: () => void;
  onSaved: (lens: UserLens) => void;
}

const RISK_OPTIONS = ["low", "medium", "high"] as const;
const TIME_OPTIONS = ["3 months", "6 months", "1 year", "3 years", "5+ years"] as const;
const PRIORITY_KEYS = ["feasibility", "desirability", "profitability", "novelty"] as const;

export function LensEditor({ lens, onClose, onSaved }: LensEditorProps) {
  const { user } = useAuth();
  const [name, setName] = useState(lens?.name || "");
  const [primaryObjective, setPrimaryObjective] = useState(lens?.primary_objective || "");
  const [targetOutcome, setTargetOutcome] = useState(lens?.target_outcome || "");
  const [riskTolerance, setRiskTolerance] = useState(lens?.risk_tolerance || "medium");
  const [timeHorizon, setTimeHorizon] = useState(lens?.time_horizon || "1 year");
  const [availableResources, setAvailableResources] = useState(lens?.available_resources || "");
  const [constraints, setConstraints] = useState(lens?.constraints || "");
  const [priorities, setPriorities] = useState<Record<string, number>>(
    lens?.evaluation_priorities || { feasibility: 0.25, desirability: 0.25, profitability: 0.25, novelty: 0.25 }
  );
  const [saving, setSaving] = useState(false);

  const handlePriorityChange = (key: string, value: number) => {
    const newPriorities = { ...priorities, [key]: value };
    // Normalize to sum to 1
    const total = Object.values(newPriorities).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(newPriorities).forEach((k) => {
        newPriorities[k] = Math.round((newPriorities[k] / total) * 100) / 100;
      });
    }
    setPriorities(newPriorities);
  };

  const handleSave = async () => {
    if (!user?.id || !name.trim()) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      primary_objective: primaryObjective.trim() || null,
      target_outcome: targetOutcome.trim() || null,
      risk_tolerance: riskTolerance,
      time_horizon: timeHorizon,
      available_resources: availableResources.trim() || null,
      constraints: constraints.trim() || null,
      evaluation_priorities: priorities,
    };

    try {
      if (lens?.id) {
        const { data, error } = await (supabase.from("user_lenses") as any)
          .update(payload)
          .eq("id", lens.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data);
      } else {
        const { data, error } = await (supabase.from("user_lenses") as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        onSaved(data);
      }
    } catch (err) {
      console.error("Lens save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="typo-section-title">{lens ? "Edit Lens" : "Create Custom Lens"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
        </div>

        <p className="typo-section-description -mt-3">
          Tailor how results are evaluated, scored, and prioritized.
        </p>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="typo-card-meta block mb-1">Lens Name *</label>
            <input className="input-executive" placeholder="e.g. Growth Focus, Conservative Play" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Primary Objective */}
          <div>
            <label className="typo-card-meta block mb-1">Primary Objective</label>
            <input className="input-executive" placeholder="e.g. Maximize revenue growth within 12 months" value={primaryObjective} onChange={(e) => setPrimaryObjective(e.target.value)} />
          </div>

          {/* Target Outcome */}
          <div>
            <label className="typo-card-meta block mb-1">Target Outcome</label>
            <input className="input-executive" placeholder="e.g. Launch MVP with $50K budget" value={targetOutcome} onChange={(e) => setTargetOutcome(e.target.value)} />
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="typo-card-meta block mb-1.5">Risk Tolerance</label>
            <div className="flex gap-2">
              {RISK_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskTolerance(r)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                    riskTolerance === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border hover:bg-accent"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <label className="typo-card-meta block mb-1">Time Horizon</label>
            <select
              className="input-executive"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Resources */}
          <div>
            <label className="typo-card-meta block mb-1">Available Resources</label>
            <input className="input-executive" placeholder="e.g. $100K budget, 3-person team, existing customer base" value={availableResources} onChange={(e) => setAvailableResources(e.target.value)} />
          </div>

          {/* Constraints */}
          <div>
            <label className="typo-card-meta block mb-1">Constraints</label>
            <input className="input-executive" placeholder="e.g. Must use existing supply chain, no fundraising" value={constraints} onChange={(e) => setConstraints(e.target.value)} />
          </div>

          {/* Evaluation Priorities */}
          <div>
            <label className="typo-card-meta block mb-2">Evaluation Priorities</label>
            <div className="space-y-2">
              {PRIORITY_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium capitalize text-foreground">{key}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((priorities[key] || 0.25) * 100)}
                    onChange={(e) => handlePriorityChange(key, parseInt(e.target.value) / 100)}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-10 text-right text-xs text-muted-foreground font-mono">
                    {Math.round((priorities[key] || 0.25) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : lens ? "Update Lens" : "Create & Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
