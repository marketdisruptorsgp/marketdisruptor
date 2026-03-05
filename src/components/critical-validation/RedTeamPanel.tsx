import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { InsightRating } from "@/components/InsightRating";
import { XCircle, Flame } from "lucide-react";
import { InsightCard } from "@/components/analysis/AnalysisComponents";
import type { RedTeamArg } from "./types";

interface RedTeamPanelProps {
  verdict: string;
  arguments: RedTeamArg[];
  killShot: string;
}

export function RedTeamPanel({ verdict, arguments: args, killShot }: RedTeamPanelProps) {
  return (
    <div className="relative" style={{ background: "hsl(0 72% 52% / 0.04)" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: "hsl(0 72% 48%)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
          <XCircle size={18} style={{ color: "white" }} />
        </div>
        <div>
          <p className="text-sm font-extrabold text-white tracking-tight">Red Team</p>
          <p className="text-[11px] text-white/70 font-medium">Against This Idea</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <InsightCard headline={verdict} badge="VERDICT" badgeColor="hsl(0 72% 48%)" accentColor="hsl(0 72% 48%)" />

        {(args || []).map((arg, i) => (
          <InsightCard
            key={i}
            headline={arg.title}
            subtext={arg.argument.length > 100 ? arg.argument.slice(0, 100) + "…" : arg.argument}
            badge={arg.severity.toUpperCase()}
            badgeColor={arg.severity === "critical" ? "hsl(var(--destructive))" : arg.severity === "major" ? "hsl(38 92% 35%)" : "hsl(var(--muted-foreground))"}
            accentColor="hsl(0 72% 48%)"
            detail={
              <div className="space-y-2">
                {arg.argument.length > 100 && <p className="text-sm text-foreground/80 leading-relaxed">{arg.argument}</p>}
                {arg.biasExposed && (
                  <p className="text-xs font-bold" style={{ color: "hsl(271 81% 45%)" }}>Bias exposed: {arg.biasExposed}</p>
                )}
              </div>
            }
            action={
              <div className="flex items-center gap-2">
                <InsightRating sectionId={`red-${i}`} compact />
                <PitchDeckToggle contentKey={`stress-red-${i}`} label="Pitch" />
              </div>
            }
          />
        ))}

        <InsightCard
          icon={Flame}
          headline={killShot}
          badge="KILL SHOT"
          badgeColor="hsl(0 72% 48%)"
          accentColor="hsl(0 72% 48%)"
          action={<PitchDeckToggle contentKey="stress-killshot" label="Pitch" />}
        />
      </div>
    </div>
  );
}
