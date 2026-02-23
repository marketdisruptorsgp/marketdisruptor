import { useState } from "react";
import { ChevronDown, ChevronRight, Target, DollarSign, Rocket, AlertTriangle, Zap, Users, Package, RefreshCw, Handshake, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeepDiveData {
  title: string;
  targetMarket: string;
  valueProposition: string;
  implementationSteps: string[];
  revenueEstimate: string;
  pricingStrategy: string;
  partnerships: string;
  risks: string[];
  quickWin: string;
  competitiveMoat: string;
}

interface BundleDeepDiveProps {
  opportunity: string;
  businessContext: { type: string; description: string };
  index: number;
}

export const BundleDeepDive = ({ opportunity, businessContext, index }: BundleDeepDiveProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<DeepDiveData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExpand = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);

    if (data) return; // Already loaded

    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("bundle-deep-dive", {
        body: { bundleOpportunity: opportunity, businessContext },
      });

      if (error || !result?.success) {
        toast.error("Could not generate deep dive");
        console.error(error || result?.error);
        return;
      }

      setData(result.data);
    } catch (err) {
      toast.error("Deep dive failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setData(null);
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("bundle-deep-dive", {
        body: { bundleOpportunity: opportunity, businessContext },
      });
      if (error || !result?.success) {
        toast.error("Regeneration failed");
        return;
      }
      setData(result.data);
      toast.success("Deep dive refreshed!");
    } catch {
      toast.error("Regeneration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: isOpen ? "hsl(var(--primary-muted))" : "hsl(var(--muted))",
        border: `1px solid ${isOpen ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
      }}
    >
      {/* Trigger */}
      <button
        onClick={handleExpand}
        className="w-full flex items-start gap-2 p-3 text-left transition-colors hover:bg-primary/5"
      >
        <div className="mt-0.5 flex-shrink-0 transition-transform" style={{ color: "hsl(var(--primary))" }}>
          {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
        <div className="flex-1">
          <span className="text-xs text-foreground/80 leading-relaxed">{opportunity}</span>
          {!isOpen && !data && (
            <p className="text-[10px] mt-1 font-medium" style={{ color: "hsl(var(--primary))" }}>
              Tap to explore deeper →
            </p>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-3 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 justify-center py-6">
              <RefreshCw size={14} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                Generating deep dive…
              </span>
            </div>
          ) : data ? (
            <>
              {/* Regenerate button */}
              <div className="flex justify-end">
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-105"
                  style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
                >
                  <RefreshCw size={9} /> Regenerate
                </button>
              </div>

              {/* Value Proposition */}
              <div className="p-3 rounded-lg text-xs leading-relaxed"
                style={{ background: "hsl(var(--primary) / 0.08)", borderLeft: "3px solid hsl(var(--primary))" }}>
                <span className="font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>Why this works: </span>
                <span className="text-foreground/80">{data.valueProposition}</span>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InfoCard icon={<Target size={11} />} label="Target Market" text={data.targetMarket} />
                <InfoCard icon={<DollarSign size={11} />} label="Revenue Estimate" text={data.revenueEstimate} />
                <InfoCard icon={<Package size={11} />} label="Pricing Strategy" text={data.pricingStrategy} />
                <InfoCard icon={<Handshake size={11} />} label="Key Partnerships" text={data.partnerships} />
              </div>

              {/* Implementation Steps */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Rocket size={10} /> Implementation Steps
                </p>
                {data.implementationSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg"
                    style={{ background: "hsl(var(--muted))" }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                      {i + 1}
                    </span>
                    <span className="text-foreground/80 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              {/* Quick Win */}
              <div className="p-3 rounded-lg text-xs leading-relaxed"
                style={{ background: "hsl(142 70% 45% / 0.08)", borderLeft: "3px solid hsl(142 70% 45%)" }}>
                <span className="font-semibold" style={{ color: "hsl(142 70% 30%)" }}>Quick Win: </span>
                <span className="text-foreground/80">{data.quickWin}</span>
              </div>

              {/* Competitive Moat */}
              <div className="p-3 rounded-lg text-xs leading-relaxed"
                style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                <span className="font-semibold flex items-center gap-1 mb-1" style={{ color: "hsl(var(--primary-dark))" }}>
                  <Shield size={10} /> Competitive Moat
                </span>
                <span className="text-foreground/80">{data.competitiveMoat}</span>
              </div>

              {/* Risks */}
              {data.risks?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <AlertTriangle size={10} /> Risks
                  </p>
                  {data.risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-xs"
                      style={{ background: "hsl(var(--destructive) / 0.06)" }}>
                      <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{risk}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) => (
  <div className="p-2.5 rounded-lg text-xs" style={{ background: "hsl(var(--muted))" }}>
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
      {icon} {label}
    </p>
    <p className="text-foreground/80 leading-relaxed">{text}</p>
  </div>
);
