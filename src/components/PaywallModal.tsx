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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-3xl rounded border border-border shadow-lg bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-2 flex items-start justify-between">
          <div>
            <p className="typo-card-eyebrow mb-1 text-primary">
              Upgrade Your Plan
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              You've used all {TIERS[currentTier].analysisLimit} free analyses
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade to keep analyzing markets and uncovering opportunities.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X size={16} />
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
                className="rounded p-5 flex flex-col relative border bg-muted/10"
                style={{
                  borderColor: isDisruptor ? "hsl(var(--accent))" : isCurrent ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
              >
                {isCurrent && (
                  <span
                    className="absolute -top-2.5 left-4 px-2 py-0.5 rounded typo-status-label bg-primary text-primary-foreground"
                  >
                    Current
                  </span>
                )}
                {isDisruptor && !isCurrent && (
                  <span
                    className="absolute -top-2.5 left-4 px-2 py-0.5 rounded typo-status-label bg-accent text-accent-foreground"
                  >
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center bg-muted"
                  >
                    <Icon size={14} style={{ color: t.color }} />
                  </div>
                  <span className="text-foreground font-bold text-sm">{t.name}</span>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-foreground">{t.price === 0 ? "Free" : `$${t.price}`}</span>
                  {t.price > 0 && <span className="text-muted-foreground text-xs">/month</span>}
                </div>

                <div className="space-y-2 flex-1 mb-4">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>

                {isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(key as "builder" | "disruptor")}
                    disabled={loadingTier === key}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-bold transition-colors text-white hover:opacity-90"
                    style={{
                      background: isDisruptor ? "hsl(var(--accent))" : "hsl(var(--primary))",
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
                    className="w-full text-center py-2.5 rounded text-xs font-semibold bg-muted text-muted-foreground"
                  >
                    {key === "explorer" ? `${usage.total}/10 used` : "Active"}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="typo-card-meta text-muted-foreground">
            Cancel anytime · Secure payment via Stripe · Instant activation
          </p>
        </div>
      </div>
    </div>
  );
}