import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TIERS = {
  explorer: {
    name: "Explorer",
    price: 0,
    priceLabel: "Free",
    analysisLimit: 10,
    limitType: "lifetime" as const,
    features: [
      "10 total analyses",
      "All analysis modes",
      "PDF export",
      "Pitch deck generation",
      "Standard AI models",
    ],
    color: "hsl(142 71% 45%)",
  },
  builder: {
    name: "Builder",
    price: 25,
    priceLabel: "$25/mo",
    priceId: "price_1T3P6u2OV7wXOutb0z1n1S92",
    productId: "prod_U1S0HWBMC44XEH",
    analysisLimit: 75,
    limitType: "monthly" as const,
    features: [
      "75 analyses per month",
      "All analysis modes",
      "PDF export",
      "Pitch deck generation",
      "Standard AI models",
    ],
    color: "hsl(142 71% 45%)",
  },
  disruptor: {
    name: "Disruptor",
    price: 59,
    priceLabel: "$59/mo",
    priceId: "price_1T3P732OV7wXOutbaso8MPVM",
    productId: "prod_U1S1iiYajGHIbu",
    analysisLimit: Infinity,
    limitType: "unlimited" as const,
    features: [
      "Unlimited analyses",
      "All analysis modes",
      "PDF export",
      "Pitch deck generation",
      "Advanced AI models",
      "Deeper insights",
      "High-quality illustrations",
    ],
    color: "hsl(142 71% 45%)",
  },
} as const;

export type TierKey = keyof typeof TIERS;

interface SubscriptionState {
  tier: TierKey;
  subscribed: boolean;
  subscriptionEnd: string | null;
  usage: { total: number; monthly: number; bonus: number; monthlyBonus: number };
  loading: boolean;
  checkSubscription: () => Promise<void>;
  canAnalyze: () => boolean;
  remainingAnalyses: () => number | null;
  startCheckout: (tierKey: "builder" | "disruptor") => Promise<void>;
  openPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState>({
  tier: "explorer",
  subscribed: false,
  subscriptionEnd: null,
  usage: { total: 0, monthly: 0, bonus: 0, monthlyBonus: 0 },
  loading: true,
  checkSubscription: async () => {},
  canAnalyze: () => true,
  remainingAnalyses: () => null,
  startCheckout: async () => {},
  openPortal: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<TierKey>("explorer");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [usage, setUsage] = useState({ total: 0, monthly: 0, bonus: 0, monthlyBonus: 0 });
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setTier(data.tier || "explorer");
      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
      setUsage(data.usage || { total: 0, monthly: 0, bonus: 0, monthlyBonus: 0 });
    } catch (err) {
      console.error("Failed to check subscription:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    // Re-check every 60s
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  // Check on checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Delay to let Stripe process
      setTimeout(checkSubscription, 2000);
    }
  }, [checkSubscription]);

  const canAnalyze = useCallback(() => {
    const tierConfig = TIERS[tier];
    if (tierConfig.limitType === "unlimited") return true;
    if (tierConfig.limitType === "lifetime") return usage.total < (tierConfig.analysisLimit + (usage.bonus || 0));
    return usage.monthly < (tierConfig.analysisLimit + (usage.monthlyBonus || 0));
  }, [tier, usage]);

  const remainingAnalyses = useCallback((): number | null => {
    const tierConfig = TIERS[tier];
    if (tierConfig.limitType === "unlimited") return null;
    if (tierConfig.limitType === "lifetime") return Math.max(0, (tierConfig.analysisLimit + (usage.bonus || 0)) - usage.total);
    return Math.max(0, (tierConfig.analysisLimit + (usage.monthlyBonus || 0)) - usage.monthly);
  }, [tier, usage]);

  const startCheckout = useCallback(async (tierKey: "builder" | "disruptor") => {
    const priceId = TIERS[tierKey].priceId;
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        tier, subscribed, subscriptionEnd, usage, loading,
        checkSubscription, canAnalyze, remainingAnalyses, startCheckout, openPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
