import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Users, Copy, CheckCircle2 } from "lucide-react";

interface ReferralCTAProps {
  compact?: boolean;
}

export function ReferralCTA({ compact }: ReferralCTAProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const referralLink = `http://marketdisruptor.sgpcapital.com?ref=${user.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (compact) {
    return (
      <div
        className="rounded-lg p-3 flex items-center gap-3"
        style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
      >
        <Users size={14} style={{ color: "hsl(var(--primary))" }} />
        <p className="text-xs text-muted-foreground flex-1">Know someone who'd use this?</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold transition-colors"
          style={{ background: "hsl(var(--primary))", color: "white" }}
        >
          {copied ? <><CheckCircle2 size={10} /> Copied</> : <><Copy size={10} /> Share</>}
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))" }}
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(271 81% 55%))" }} />
      <div className="p-5 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Users size={20} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Know someone who'd use this?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm mx-auto">
            Share your referral link and earn extended access when they sign up.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--primary))", color: "white" }}
        >
          {copied ? <><CheckCircle2 size={14} /> Link Copied!</> : <><Copy size={14} /> Copy Referral Link</>}
        </button>
      </div>
    </div>
  );
}
