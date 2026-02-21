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
    <div className="min-h-screen" style={{ background: "linear-gradient(165deg, hsl(220 25% 6%) 0%, hsl(220 30% 10%) 50%, hsl(220 25% 8%) 100%)" }}>
      {/* Top nav */}
      <div className="border-b" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "hsl(var(--primary-light))" }} />
            <span className="text-xs font-bold tracking-widest uppercase text-white/70">Market Disruptor</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: "hsl(var(--primary-light))" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary-light))" }}>
              Pricing Plans
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Choose your <span style={{ color: "hsl(var(--primary-light))" }}>edge</span>
          </h1>
          <p className="text-base text-white/50 max-w-xl mx-auto">
            Every plan gives you access to all analysis modes, PDF export, and pitch deck generation.
            Upgrade for more analyses and advanced AI capabilities.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {tierOrder.map((key) => {
            const t = TIERS[key];
            const Icon = tierIcons[key];
            const isCurrent = key === currentTier;
            const isUpgrade = key !== "explorer" && tierOrder.indexOf(key) > tierOrder.indexOf(currentTier);
            const isDisruptor = key === "disruptor";

            return (
              <div
                key={key}
                className="rounded-2xl p-6 flex flex-col relative"
                style={{
                  background: isDisruptor
                    ? "linear-gradient(165deg, hsl(38 40% 10%) 0%, hsl(220 25% 10%) 100%)"
                    : "hsl(220 20% 11%)",
                  border: `1.5px solid ${
                    isDisruptor ? "hsl(38 80% 40% / 0.35)" :
                    isCurrent ? "hsl(var(--primary) / 0.4)" :
                    "hsl(0 0% 100% / 0.06)"
                  }`,
                }}
              >
                {isCurrent && (
                  <span
                    className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: "hsl(var(--primary))", color: "white" }}
                  >
                    Your Plan
                  </span>
                )}
                {isDisruptor && !isCurrent && (
                  <span
                    className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: "hsl(38 92% 50%)", color: "hsl(220 20% 5%)" }}
                  >
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3 mb-5 mt-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${t.color}18`, border: `1px solid ${t.color}30` }}
                  >
                    <Icon size={18} style={{ color: t.color }} />
                  </div>
                  <div>
                    <span className="text-white font-bold text-lg">{t.name}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">
                    {t.price === 0 ? "Free" : `$${t.price}`}
                  </span>
                  {t.price > 0 && <span className="text-white/40 text-sm ml-1">/month</span>}
                </div>

                <div className="space-y-3 flex-1 mb-6">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: t.color }} />
                      <span className="text-sm text-white/70">{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="space-y-2">
                    <div
                      className="w-full text-center py-3 rounded-xl text-sm font-semibold"
                      style={{ background: "hsl(0 0% 100% / 0.05)", color: "hsl(0 0% 100% / 0.5)" }}
                    >
                      {key === "explorer"
                        ? `${usage.total} of 10 analyses used`
                        : key === "builder"
                        ? `${usage.monthly} of 75 used this month`
                        : "Unlimited — Active"}
                    </div>
                    {subscribed && (
                      <button
                        onClick={handleManage}
                        disabled={loadingPortal}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-white/10"
                        style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.6)" }}
                      >
                        {loadingPortal ? <Loader2 size={13} className="animate-spin" /> : "Manage Subscription"}
                      </button>
                    )}
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(key as "builder" | "disruptor")}
                    disabled={loadingTier === key}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                    style={{
                      background: isDisruptor ? "hsl(38 92% 50%)" : "hsl(var(--primary))",
                      color: isDisruptor ? "hsl(220 20% 5%)" : "white",
                      boxShadow: isDisruptor
                        ? "0 4px 20px -4px hsl(38 92% 50% / 0.4)"
                        : "0 4px 20px -4px hsl(217 91% 50% / 0.4)",
                    }}
                  >
                    {loadingTier === key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>Upgrade to {t.name} <ArrowRight size={14} /></>
                    )}
                  </button>
                ) : (
                  <div
                    className="w-full text-center py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "hsl(0 0% 100% / 0.03)", color: "hsl(0 0% 100% / 0.3)" }}
                  >
                    Included
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom FAQ-like section */}
        <div className="text-center">
          <p className="text-xs text-white/30">
            All plans include secure payment via Stripe · Cancel anytime · Instant activation · Your data never expires
          </p>
        </div>
      </div>
    </div>
  );
}
