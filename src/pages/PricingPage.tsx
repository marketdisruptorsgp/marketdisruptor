import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Rocket, Crown, Check, ArrowRight, Loader2, ArrowLeft, Sparkles,
} from "lucide-react";
import { TIERS, TierKey, useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

const tierOrder: TierKey[] = ["explorer", "builder", "disruptor"];
const tierIcons = { explorer: Zap, builder: Rocket, disruptor: Crown };

export default function PricingPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tier: currentTier, usage, subscribed, startCheckout, openPortal } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleUpgrade = async (tierKey: "builder" | "disruptor") => {
    setLoadingTier(tierKey);
    await startCheckout(tierKey);
    setLoadingTier(null);
  };

  const handleManage = async () => {
    setLoadingPortal(true);
    await openPortal();
    setLoadingPortal(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Market Disruptor</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Pricing Plans
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
            Choose your <span className="text-primary">edge</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Every plan gives you access to all analysis modes, PDF export, and pitch deck generation.
            Upgrade for more analyses and advanced analysis capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {tierOrder.map((key) => {
            const t = TIERS[key];
            const Icon = tierIcons[key];
            const isCurrent = key === currentTier;
            const isUpgrade = key !== "explorer" && tierOrder.indexOf(key) > tierOrder.indexOf(currentTier);
            const isDisruptor = key === "disruptor";

            return (
              <div
                key={key}
                className={`rounded-xl border p-7 flex flex-col relative bg-card shadow-sm ${isCurrent ? "border-primary" : "border-border"}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
                    Your Plan
                  </span>
                )}
                {isDisruptor && !isCurrent && (
                  <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3 mb-6 mt-1">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-muted border border-border">
                    <Icon size={20} style={{ color: t.color }} />
                  </div>
                  <div>
                    <span className="text-foreground font-bold text-lg">{t.name}</span>
                  </div>
                </div>

                <div className="mb-7">
                  <span className="text-4xl font-bold text-foreground">
                    {t.price === 0 ? "Free" : `$${t.price}`}
                  </span>
                  {t.price > 0 && <span className="text-muted-foreground text-sm ml-1">/month</span>}
                </div>

                <div className="space-y-3.5 flex-1 mb-7">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="space-y-2.5">
                    <div className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-muted text-muted-foreground">
                      {key === "explorer"
                        ? `${usage.total} of 10 analyses used`
                        : key === "builder"
                        ? `${usage.monthly} of 75 used this month`
                        : "Unlimited — Active"}
                    </div>
                    {subscribed && (
                      <>
                        <button
                          onClick={handleManage}
                          disabled={loadingPortal}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-colors border border-border hover:bg-muted text-foreground"
                        >
                          {loadingPortal ? <Loader2 size={13} className="animate-spin" /> : "Manage Subscription"}
                        </button>
                        <p className="text-[10px] text-center leading-relaxed text-muted-foreground">
                          Billed monthly · Cancel anytime
                        </p>
                      </>
                    )}
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(key as "builder" | "disruptor")}
                    disabled={loadingTier === key}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-colors bg-primary text-primary-foreground hover:bg-primary-dark"
                  >
                    {loadingTier === key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>Upgrade to {t.name} <ArrowRight size={14} /></>
                    )}
                  </button>
                ) : (
                  <div className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-muted text-muted-foreground">
                    Included
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            All plans include secure payment via Stripe · Instant activation · Your data never expires
          </p>
          <p className="text-sm text-muted-foreground">
            Billed monthly · Cancel anytime by clicking "Manage Subscription" above · No refunds for partial billing periods
          </p>
        </div>
      </div>
    </div>
  );
}
