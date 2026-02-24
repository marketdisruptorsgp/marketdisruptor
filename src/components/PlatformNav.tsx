import { useState } from "react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Zap, Database, Upload, Briefcase, Building2,
  FolderOpen, BarChart3, BookOpen, HelpCircle, Lightbulb, TrendingUp, Radar,
  Menu, PieChart, Code2,
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
  { label: "FAQs", desc: "Common questions answered", icon: HelpCircle, path: "/faqs" },
  { label: "Methodology", desc: "Our 4-step analysis pipeline", icon: Lightbulb, path: "/methodology" },
  { label: "API & Integrations", desc: "Connect your tools via REST API", icon: Code2, path: "/api" },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleModeSelect = (modeId: "custom" | "service" | "business") => {
    analysis.setMainTab(modeId);
    analysis.setActiveMode(modeId as AnalysisMode);
    // Navigate to dashboard and scroll to form
    if (location.pathname !== "/") navigate("/");
    setMobileOpen(false);
    // Scroll to form area after navigation
    setTimeout(() => {
      const formEl = document.querySelector('[data-tour="analysis-form"]');
      if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="border-b border-border bg-background shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-0 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mr-2 sm:mr-4 py-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Zap size={15} />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground hidden sm:inline">Market Disruptor</span>
            <span className="hidden md:inline text-[9px] font-semibold uppercase tracking-widest text-primary bg-muted rounded-full px-2 py-0.5">
              OS
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-3 px-3">
                    <span className="flex items-center gap-2">
                      Start Disrupting
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

                {/* Workspace tab hidden */}

                <NavigationMenuItem>
                  <a
                    href="/portfolio"
                    onClick={(e) => { e.preventDefault(); navigate("/portfolio"); }}
                    className={`text-sm font-semibold px-3 py-3 transition-colors border-b-2 flex items-center gap-1.5 ${isActive("/portfolio") ? "text-foreground border-primary" : "text-muted-foreground hover:text-foreground border-transparent"}`}
                  >
                    <PieChart size={13} />
                    Portfolio
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a
                    href="/intel"
                    onClick={(e) => { e.preventDefault(); navigate("/intel"); }}
                    className={`text-sm font-semibold px-3 py-3 transition-colors border-b-2 flex items-center gap-1.5 ${isActive("/intel") ? "text-foreground border-primary" : "text-muted-foreground hover:text-foreground border-transparent"}`}
                  >
                    <Radar size={13} />
                    Intel
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a
                    href="/about"
                    onClick={(e) => { e.preventDefault(); navigate("/about"); }}
                    className={`text-sm font-semibold px-3 py-3 transition-colors border-b-2 ${isActive("/about") ? "text-foreground border-primary" : "text-muted-foreground hover:text-foreground border-transparent"}`}
                  >
                    About
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent data-[state=open]:bg-transparent h-auto py-3 px-3">
                    Resources
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-60 p-2 bg-background shadow-lg rounded-xl border border-border">
                      {RESOURCES_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavigationMenuLink key={item.label} asChild>
                            <a
                              href={item.path}
                              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                              className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                            >
                              <Icon size={14} className="text-muted-foreground" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                              </div>
                            </a>
                          </NavigationMenuLink>
                        );
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a
                    href="/pricing"
                    onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}
                    className={`text-sm font-semibold px-3 py-3 transition-colors border-b-2 ${isActive("/pricing") ? "text-foreground border-primary" : "text-muted-foreground hover:text-foreground border-transparent"}`}
                  >
                    Pricing
                  </a>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenSaved && (
            <button
              onClick={onOpenSaved}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-colors border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
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
              className="px-3 sm:px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors bg-primary text-primary-foreground hover:bg-primary-dark hidden sm:inline-flex"
            >
              Upgrade
            </button>
          )}
          <UserHeader />

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Menu size={18} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-bold text-foreground">Menu</p>
              </div>
              <div className="p-3 space-y-1">
                <p className="section-label text-[10px] px-3 pt-2 pb-1">Start Disrupting</p>
                {ACCESS_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const active = analysis.mainTab === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeSelect(mode.id)}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                      style={{
                        background: active ? "hsl(var(--muted))" : undefined,
                      }}
                    >
                      <Icon size={14} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                      <span className="text-sm font-semibold text-foreground">{mode.label}</span>
                    </button>
                  );
                })}

                <div className="h-px bg-border my-2" />
                <p className="section-label text-[10px] px-3 pt-2 pb-1">Workspace</p>
                <button
                  onClick={() => { onOpenSaved?.(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <FolderOpen size={14} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Saved Projects</span>
                  {typeof savedCount === "number" && savedCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground leading-none">
                      {savedCount}
                    </span>
                  )}
                </button>

                <div className="h-px bg-border my-2" />
                <p className="section-label text-[10px] px-3 pt-2 pb-1">Navigate</p>
                <a
                  href="/portfolio"
                  onClick={(e) => { e.preventDefault(); navigate("/portfolio"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <PieChart size={14} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">Portfolio</span>
                </a>
                <a
                  href="/intel"
                  onClick={(e) => { e.preventDefault(); navigate("/intel"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <Radar size={14} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">Intel Dashboard</span>
                </a>
                <a
                  href="/about"
                  onClick={(e) => { e.preventDefault(); navigate("/about"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <BookOpen size={14} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">About</span>
                </a>

                <div className="h-px bg-border my-2" />
                <p className="section-label text-[10px] px-3 pt-2 pb-1">Resources</p>
                {RESOURCES_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.path}
                      onClick={(e) => { e.preventDefault(); navigate(item.path); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <Icon size={14} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    </a>
                  );
                })}

                <div className="h-px bg-border my-2" />
                <a
                  href="/pricing"
                  onClick={(e) => { e.preventDefault(); navigate("/pricing"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <BarChart3 size={14} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Pricing</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}