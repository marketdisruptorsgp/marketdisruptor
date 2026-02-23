import { useNavigate, useLocation } from "react-router-dom";
import { UserHeader } from "@/components/UserHeader";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { type AnalysisMode } from "@/components/AnalysisForm";
import { TIERS, TierKey } from "@/hooks/useSubscription";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Zap, Database, Upload, Briefcase, Building2,
  FolderOpen, BarChart3, BookOpen, HelpCircle, Lightbulb, TrendingUp,
} from "lucide-react";

interface PlatformNavProps {
  tier: TierKey;
  onOpenSaved?: () => void;
  savedCount?: number;
}

const ACCESS_MODES = [
  { id: "custom" as const, label: "Disrupt This Product", desc: "Upload & analyze any physical product", icon: Upload, cssVar: "--mode-product" },
  { id: "service" as const, label: "Disrupt This Service", desc: "Deconstruct any service business", icon: Briefcase, cssVar: "--mode-service" },
  { id: "business" as const, label: "Disrupt This Business Model", desc: "Full business model teardown", icon: Building2, cssVar: "--mode-business" },
];

const RESOURCES_ITEMS = [
  { label: "FAQs", desc: "Common questions answered", icon: HelpCircle, hash: "#faqs" },
  { label: "Methodology", desc: "Our 4-step analysis pipeline", icon: Lightbulb, hash: "#methodology" },
  { label: "Market Intel", desc: "Upcoming market reports", icon: TrendingUp, hash: "#market-intel" },
];

const MODE_LABELS: Record<string, string> = {
  custom: "Product",
  service: "Service",
  business: "Business",
};

export function PlatformNav({ tier, onOpenSaved, savedCount }: PlatformNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const analysis = useAnalysis();

  const handleModeSelect = (modeId: "custom" | "service" | "business") => {
    analysis.setMainTab(modeId);
    analysis.setActiveMode(modeId as AnalysisMode);
    if (location.pathname !== "/") navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const activeMode = ACCESS_MODES.find((m) => m.id === analysis.mainTab);

  return (
    <div className="border-b border-border bg-background shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-0 flex items-center justify-between">
        {/* Left: Logo + Nav items */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 mr-4 py-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Zap size={15} />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground hidden sm:inline">Market Disruptor</span>
            <span className="hidden md:inline text-[9px] font-semibold uppercase tracking-widest text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
              OS
            </span>
          </button>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-3 px-3">
                  <span className="flex items-center gap-2">
                    Access Modes
                    {activeMode && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: `hsl(var(${activeMode.cssVar}))` }}
                      >
                        {MODE_LABELS[activeMode.id]}
                      </span>
                    )}
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-72 p-2 bg-background shadow-lg rounded-xl border border-border">
                    {ACCESS_MODES.map((mode) => {
                      const Icon = mode.icon;
                      const active = analysis.mainTab === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => handleModeSelect(mode.id)}
                          className={`w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted ${active ? "bg-muted" : ""}`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border bg-card"
                            style={{
                              borderColor: active ? `hsl(var(${mode.cssVar}))` : "hsl(var(--border))",
                              borderLeftWidth: active ? "3px" : "1px",
                            }}
                          >
                            <Icon size={14} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">{mode.label}</p>
                            <p className="text-xs text-muted-foreground leading-snug mt-0.5">{mode.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-3 px-3">
                  Workspace
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-56 p-2 bg-background shadow-lg rounded-xl border border-border">
                    <button
                      onClick={() => { onOpenSaved?.(); }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <FolderOpen size={14} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Saved Projects</p>
                        <p className="text-xs text-muted-foreground">View & reload past analyses</p>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate("/pricing")}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <BarChart3 size={14} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Plan & Usage</p>
                        <p className="text-xs text-muted-foreground">{TIERS[tier].name} tier</p>
                      </div>
                    </button>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-3 px-3">
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-60 p-2 bg-background shadow-lg rounded-xl border border-border">
                    {RESOURCES_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavigationMenuLink key={item.label} asChild>
                          <button
                            onClick={() => navigate(`/resources${item.hash}`)}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                          >
                            <Icon size={14} className="text-muted-foreground" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </button>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <button
                  onClick={() => navigate("/about")}
                  className={`text-sm font-medium px-3 py-3 transition-colors ${isActive("/about") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  About
                </button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <button
                  onClick={() => navigate("/pricing")}
                  className={`text-sm font-medium px-3 py-3 transition-colors ${isActive("/pricing") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Pricing
                </button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {onOpenSaved && (
            <button
              onClick={onOpenSaved}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Database size={13} />
              <span className="hidden sm:inline">Projects</span>
              {typeof savedCount === "number" && savedCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground leading-none">
                  {savedCount}
                </span>
              )}
            </button>
          )}
          {tier !== "disruptor" && (
            <button
              onClick={() => navigate("/pricing")}
              className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors bg-primary text-primary-foreground hover:bg-primary-dark hidden sm:inline-flex"
            >
              Upgrade
            </button>
          )}
          <UserHeader />
        </div>
      </div>
    </div>
  );
}
