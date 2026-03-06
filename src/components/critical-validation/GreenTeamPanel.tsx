import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { InsightRating } from "@/components/InsightRating";
import { CheckCircle2, Target } from "lucide-react";
import { InsightCard } from "@/components/analysis/AnalysisComponents";
import type { BlueTeamArg } from "./types";

interface GreenTeamPanelProps {
  verdict: string;
  arguments: BlueTeamArg[];
  moonshot: string;
}

export function GreenTeamPanel({ verdict, arguments: args, moonshot }: GreenTeamPanelProps) {
  return (
    <div className="relative" style={{ background: "hsl(142 60% 45% / 0.04)", borderLeft: "1px solid hsl(var(--border))" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: "hsl(142 60% 38%)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
          <CheckCircle2 size={18} style={{ color: "white" }} />
        </div>
        <div>
          <p className="text-sm font-extrabold text-white tracking-tight">Green Team</p>
          <p className="text-xs text-white/70 font-medium">For This Idea</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <InsightCard headline={verdict} badge="VERDICT" badgeColor="hsl(142 60% 35%)" accentColor="hsl(142 60% 35%)" />

        {(args || []).map((arg, i) => (
          <InsightCard
            key={i}
            headline={arg.title}
            subtext={arg.argument.length > 100 ? arg.argument.slice(0, 100) + "…" : arg.argument}
            badge={arg.strength.toUpperCase()}
            badgeColor={arg.strength === "strong" ? "hsl(142 70% 30%)" : arg.strength === "moderate" ? "hsl(var(--primary))" : "hsl(38 92% 35%)"}
            accentColor="hsl(142 60% 35%)"
            detail={
              <div className="space-y-2">
                {arg.argument.length > 100 && <p className="text-sm text-foreground/80 leading-relaxed">{arg.argument}</p>}
                {arg.enabler && (
                  <p className="text-xs font-bold" style={{ color: "hsl(142 60% 35%)" }}>Enabler: {arg.enabler}</p>
                )}
              </div>
            }
            action={
              <div className="flex items-center gap-2">
                <InsightRating sectionId={`blue-${i}`} compact />
                <PitchDeckToggle contentKey={`stress-green-${i}`} label="Pitch" />
              </div>
            }
          />
        ))}

        <InsightCard
          icon={Target}
          headline={moonshot}
          badge="MOONSHOT"
          badgeColor="hsl(142 60% 35%)"
          accentColor="hsl(142 60% 35%)"
          action={<PitchDeckToggle contentKey="stress-moonshot" label="Pitch" />}
        />
      </div>
    </div>
  );
}
