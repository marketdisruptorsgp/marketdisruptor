/**
 * Strategic Profile Selector
 * Compact archetype picker that drives the dominance engine.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wrench, Building2, Rocket, Wallet, Shield, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type Archetype,
  type StrategicProfile,
  ARCHETYPE_META,
  DEFAULT_PROFILES,
} from "@/lib/strategicOS";

const ARCHETYPE_ICONS: Record<string, typeof Wrench> = {
  wrench: Wrench,
  building: Building2,
  rocket: Rocket,
  wallet: Wallet,
  shield: Shield,
};

interface StrategicProfileSelectorProps {
  profile: StrategicProfile;
  onChangeProfile: (profile: StrategicProfile) => void;
}

export default function StrategicProfileSelector({
  profile,
  onChangeProfile,
}: StrategicProfileSelectorProps) {
  const [open, setOpen] = useState(false);
  const meta = ARCHETYPE_META[profile.archetype];
  const Icon = ARCHETYPE_ICONS[meta.icon] || Wrench;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-accent transition-colors"
      >
        <Icon size={13} className="text-primary" />
        <span>{meta.label}</span>
        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
          {profile.time_horizon_months}mo · {profile.risk_tolerance} risk
        </Badge>
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-30 w-80 rounded-lg border border-border bg-popover shadow-xl p-2 space-y-1"
            >
              <p className="px-2 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Strategic Archetype
              </p>
              {(Object.keys(ARCHETYPE_META) as Archetype[]).map((key) => {
                const m = ARCHETYPE_META[key];
                const AIcon = ARCHETYPE_ICONS[m.icon] || Wrench;
                const isActive = profile.archetype === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      onChangeProfile(DEFAULT_PROFILES[key]);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-2.5 w-full px-2.5 py-2 rounded-md text-left transition-colors ${
                      isActive ? "bg-primary/10" : "hover:bg-accent"
                    }`}
                  >
                    <AIcon
                      size={14}
                      className={`mt-0.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                          {m.label}
                        </span>
                        {isActive && <Check size={10} className="text-primary" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                        {m.description}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Profile summary */}
              <div className="border-t border-border mt-1 pt-2 px-2 space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Active Profile
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span>Evidence threshold</span>
                  <span className="text-foreground font-medium">{Math.round(profile.evidence_threshold * 100)}%</span>
                  <span>Time horizon</span>
                  <span className="text-foreground font-medium">{profile.time_horizon_months} months</span>
                  <span>Capital tolerance</span>
                  <span className="text-foreground font-medium">{profile.capital_intensity_tolerance}/10</span>
                  <span>Risk tolerance</span>
                  <span className="text-foreground font-medium capitalize">{profile.risk_tolerance}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
