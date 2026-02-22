import { Upload, Briefcase, Building2, Telescope, Database } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type TabId = "custom" | "service" | "business" | "discover" | "saved";

interface MobileBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: React.ElementType; accent: string }[] = [
  { id: "custom", label: "Product", icon: Upload, accent: "hsl(217 91% 38%)" },
  { id: "service", label: "Service", icon: Briefcase, accent: "hsl(340 75% 50%)" },
  { id: "business", label: "Business", icon: Building2, accent: "hsl(271 81% 55%)" },
  { id: "discover", label: "Nostalgia", icon: Telescope, accent: "hsl(var(--primary))" },
  { id: "saved", label: "Saved", icon: Database, accent: "hsl(var(--primary))" },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t safe-area-bottom"
      style={{
        background: "hsl(220 25% 6% / 0.97)",
        backdropFilter: "blur(16px)",
        borderColor: "hsl(0 0% 100% / 0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all relative"
            style={{
              color: isActive ? "white" : "hsl(0 0% 100% / 0.4)",
            }}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: tab.accent }}
              />
            )}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: isActive ? tab.accent : "transparent",
                transform: isActive ? "scale(1.1)" : "scale(1)",
              }}
            >
              <Icon size={18} />
            </div>
            <span
              className="text-[10px] font-semibold leading-tight"
              style={{ color: isActive ? "white" : "hsl(0 0% 100% / 0.45)" }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
