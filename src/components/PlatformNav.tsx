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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Zap, Database, Upload, Briefcase, Building2,
  FolderOpen, BarChart3, BookOpen, HelpCircle, Lightbulb, TrendingUp, Radar,
  Menu, PieChart, Code2, Camera, ChevronDown, ArrowRight,
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
  { label: "Pricing", desc: "Plans and billing", icon: BarChart3, path: "/pricing" },
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

  const MODE_PATHS: Record<string, string> = {
    custom: "/start/product",
    service: "/start/service",
    business: "/start/business",
  };

  const handleModeSelect = (modeId: "custom" | "service" | "business") => {
    navigate(MODE_PATHS[modeId]);
    setMobileOpen(false);
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
            <span className="typo-nav-primary tracking-tight hidden sm:inline">Market Disruptor</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                

                <NavigationMenuItem>
                  <a
                    href="/portfolio"
                    onClick={(e) => { e.preventDefault(); navigate("/portfolio"); }}
                    className={`typo-nav-primary px-3 py-3 transition-colors border-b-2 flex items-center gap-1.5 ${isActive("/portfolio") ? "text-foreground border-primary" : "text-foreground hover:text-foreground border-transparent"}`}
                  >
                    <PieChart size={13} />
                    Portfolio
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <a
                    href="/intel"
                    onClick={(e) => { e.preventDefault(); navigate("/intel"); }}
                    className={`typo-nav-primary px-3 py-3 transition-colors border-b-2 flex items-center gap-1.5 ${isActive("/intel") ? "text-foreground border-primary" : "text-foreground hover:text-foreground border-transparent"}`}
                  >
                    <Radar size={13} />
                    Intel
                  </a>
                </NavigationMenuItem>


                <NavigationMenuItem>
                  <a
                    href="/about"
                    onClick={(e) => { e.preventDefault(); navigate("/about"); }}
                    className={`typo-nav-primary px-3 py-3 transition-colors border-b-2 ${isActive("/about") ? "text-foreground border-primary" : "text-foreground hover:text-foreground border-transparent"}`}
                  >
                    About
                  </a>
                </NavigationMenuItem>

                <NavigationMenuItem className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="typo-nav-primary text-foreground hover:text-foreground bg-transparent h-auto py-3 px-3 inline-flex items-center gap-1 border-b-2 border-transparent transition-colors">
                        Resources
                        <ChevronDown size={12} className="ml-0.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={8} className="w-60 p-2 bg-background shadow-lg rounded-xl border border-border">
                      {RESOURCES_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <a
                            key={item.label}
                            href={item.path}
                            onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                          >
                            <Icon size={14} className="text-muted-foreground" />
                            <div>
                              <p className="typo-nav-primary">{item.label}</p>
                              <p className="typo-card-meta">{item.desc}</p>
                            </div>
                          </a>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </NavigationMenuItem>

                
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/start")}
            className="px-3 sm:px-4 py-2 rounded-full typo-card-eyebrow transition-colors bg-primary text-primary-foreground hover:bg-primary-dark hidden sm:inline-flex items-center gap-1.5"
          >
            Start Analysis
            <ArrowRight size={14} />
          </button>
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
                <p className="typo-nav-primary">Menu</p>
              </div>
              <div className="p-3 space-y-1">
                <p className="typo-card-eyebrow px-3 pt-2 pb-1">Start Disrupting</p>
                <a
                  href="/start"
                  onClick={(e) => { e.preventDefault(); navigate("/start"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <Zap size={14} className="text-primary" />
                  <span className="typo-nav-primary">Choose Analysis Mode</span>
                </a>

                <div className="h-px bg-border my-2" />
                <p className="typo-card-eyebrow px-3 pt-2 pb-1">Navigate</p>
                <a
                  href="/portfolio"
                  onClick={(e) => { e.preventDefault(); navigate("/portfolio"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <PieChart size={14} className="text-primary" />
                  <span className="typo-nav-primary">Portfolio</span>
                </a>
                <a
                  href="/intel"
                  onClick={(e) => { e.preventDefault(); navigate("/intel"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <Radar size={14} className="text-primary" />
                  <span className="typo-nav-primary">Intel Dashboard</span>
                </a>
                <a
                  href="/about"
                  onClick={(e) => { e.preventDefault(); navigate("/about"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                >
                  <BookOpen size={14} className="text-muted-foreground" />
                  <span className="typo-nav-primary">About</span>
                </a>

                <div className="h-px bg-border my-2" />
                <p className="typo-card-eyebrow px-3 pt-2 pb-1">Resources</p>
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
                      <span className="typo-nav-primary">{item.label}</span>
                    </a>
                  );
                })}

                
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
