import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, Sparkles, CreditCard, Crown, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, TIERS } from "@/hooks/useSubscription";

export function UserHeader() {
  const { profile, signOut } = useAuth();
  const { tier, subscribed, openPortal, remainingAnalyses } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (!profile) return null;

  const initials = profile.first_name.slice(0, 2).toUpperCase();
  const tierConfig = TIERS[tier];

  const handleManage = async () => {
    setLoadingPortal(true);
    await openPortal();
    setLoadingPortal(false);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
        style={{
          background: open ? "hsl(var(--primary-muted))" : "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          {initials}
        </div>
        <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
          {profile.first_name}
        </span>
        <ChevronDown size={13} style={{ color: "hsl(var(--muted-foreground))", transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "14rem",
            borderRadius: "0.75rem",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.35)",
            overflow: "hidden",
            zIndex: 99999,
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} style={{ color: "hsl(var(--primary))" }} />
              <p className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Your Workspace</p>
            </div>
            <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{profile.first_name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Crown size={10} style={{ color: tierConfig.color }} />
              <p className="text-[10px] font-semibold" style={{ color: tierConfig.color }}>
                {tierConfig.name} Plan
                {remainingAnalyses() !== null && ` · ${remainingAnalyses()} left`}
              </p>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => { setOpen(false); navigate("/pricing"); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
              style={{ color: "hsl(var(--foreground))" }}
            >
              <CreditCard size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
              {subscribed ? "View Plans" : "View Upgrade Options"}
            </button>

            {subscribed && (
              <button
                onClick={handleManage}
                disabled={loadingPortal}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
                style={{ color: "hsl(var(--foreground))" }}
              >
                <ArrowRight size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
                Manage Subscription
              </button>
            )}

            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted text-left"
              style={{ color: "hsl(var(--foreground))" }}
            >
              <LogOut size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
