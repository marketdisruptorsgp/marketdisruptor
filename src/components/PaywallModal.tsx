import { useState } from "react";
import {
  X, Zap, Rocket, Crown, Check, ArrowRight, Loader2,
} from "lucide-react";
import { TIERS, TierKey, useSubscription } from "@/hooks/useSubscription";

interface PaywallModalProps {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  const { tier: currentTier, usage, startCheckout } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const tierOrder: TierKey[] = ["explorer", "builder", "disruptor"];
  const tierIcons = { explorer: Zap, builder: Rocket, disruptor: Crown };

  const handleUpgrade = async (tierKey: "builder" | "disruptor") => {
    setLoadingTier(tierKey);
    await startCheckout(tierKey);
    setLoadingTier(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "hsl(220 20% 5% / 0.8)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(220 25% 8%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
      >
        {/* Header */}
        <div className="p-6 pb-2 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--primary-light))" }}>
              Upgrade Your Plan
            </p>
            <h2 className="text-2xl font-extrabold text-white">
              You've used all {TIERS[currentTier].analysisLimit} free analyses
            </h2>
            <p className="text-sm text-white/50 mt-1">
              Upgrade to keep analyzing markets and uncovering opportunities.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} className="text-white/50" />
          </button>
        </div>

        {/* Tier cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tierOrder.map((key) => {
            const t = TIERS[key];
            const Icon = tierIcons[key];
            const isCurrent = key === currentTier;
            const isUpgrade = key !== "explorer" && !isCurrent;
            const isDisruptor = key === "disruptor";

            return (
              <div
                key={key}
                className="rounded-xl p-5 flex flex-col relative"
                style={{
                  background: isDisruptor ? "linear-gradient(165deg, hsl(38 50% 12%) 0%, hsl(220 25% 10%) 100%)" : "hsl(220 20% 11%)",
                  border: `1px solid ${isDisruptor ? "hsl(38 80% 40% / 0.3)" : isCurrent ? "hsl(var(--primary) / 0.3)" : "hsl(0 0% 100% / 0.06)"}`,
                }}
              >
                {isCurrent && (
                  <span
                    className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: "hsl(var(--primary))", color: "white" }}
                  >
                    Current
                  </span>
                )}
                {isDisruptor && !isCurrent && (
                  <span
                    className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: "hsl(38 92% 50%)", color: "hsl(220 20% 5%)" }}
                  >
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${t.color}20` }}
                  >
                    <Icon size={14} style={{ color: t.color }} />
                  </div>
                  <span className="text-white font-bold text-sm">{t.name}</span>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-white">{t.price === 0 ? "Free" : `$${t.price}`}</span>
                  {t.price > 0 && <span className="text-white/40 text-xs">/month</span>}
                </div>

                <div className="space-y-2 flex-1 mb-4">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: t.color }} />
                      <span className="text-xs text-white/70">{f}</span>
                    </div>
                  ))}
                </div>

                {isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(key as "builder" | "disruptor")}
                    disabled={loadingTier === key}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: isDisruptor ? "hsl(38 92% 50%)" : "hsl(var(--primary))",
                      color: isDisruptor ? "hsl(220 20% 5%)" : "white",
                      boxShadow: isDisruptor ? "0 4px 16px -2px hsl(38 92% 50% / 0.4)" : "0 4px 16px -2px hsl(217 91% 50% / 0.4)",
                    }}
                  >
                    {loadingTier === key ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <>Upgrade <ArrowRight size={12} /></>
                    )}
                  </button>
                ) : isCurrent ? (
                  <div
                    className="w-full text-center py-2.5 rounded-xl text-xs font-semibold"
                    style={{ background: "hsl(0 0% 100% / 0.05)", color: "white/50" }}
                  >
                    {key === "explorer" ? `${usage.total}/10 used` : "Active"}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-[10px] text-white/30">
            Cancel anytime · Secure payment via Stripe · Instant activation
          </p>
        </div>
      </div>
    </div>
  );
}
