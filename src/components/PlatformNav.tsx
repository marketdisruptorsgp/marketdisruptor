import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserHeader } from "@/components/UserHeader";
import { type AnalysisMode } from "@/components/AnalysisForm";
import { TIERS, TierKey } from "@/hooks/useSubscription";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Zap, PieChart, Radar, Camera, BookOpen, HelpCircle, Lightbulb, Code2,
  Menu, ChevronDown, ArrowRight,
} from "lucide-react";

interface PlatformNavProps {
  tier: TierKey;
  onOpenSaved?: () => void;
  savedCount?: number;
}

const RESOURCES_ITEMS = [
  { label: "FAQs", desc: "Common questions answered", icon: HelpCircle, path: "/faqs" },
  { label: "Methodology", desc: "Our 4-step analysis pipeline", icon: Lightbulb, path: "/methodology" },
  { label: "API & Integrations", desc: "Connect your tools via REST API", icon: Code2, path: "/api" },
];

export function PlatformNav({ tier, onOpenSaved, savedCount }: PlatformNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `typo-nav-primary px-3 py-3 transition-colors border-b-2 flex items-center gap-1.5 ${
      isActive(path) || (path !== "/" && location.pathname.startsWith(path))
        ? "text-foreground border-primary"
        : "text-muted-foreground hover:text-foreground border-transparent"
    }`;

  return (
    <div className="border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-0 flex items-center justify-between">
        {/* Left: Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 py-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
            <Zap size={15} />
          </div>
          <span className="typo-nav-primary tracking-tight hidden sm:inline">Market Disruptor</span>
          <span className="hidden md:inline typo-status-label text-primary bg-muted rounded-full px-2 py-0.5">OS</span>
        </button>

        {/* Center: Core navigation */}
        <nav className="hidden md:flex items-center gap-0">
          <a href="/portfolio" onClick={(e) => { e.preventDefault(); navigate("/portfolio"); }} className={navLinkClass("/portfolio")}>
            <PieChart size={13} /> Portfolio
          </a>
          <a href="/intel" onClick={(e) => { e.preventDefault(); navigate("/intel"); }} className={navLinkClass("/intel")}>
            <Radar size={13} /> Intel
          </a>
          <a href="/instant-analysis" onClick={(e) => { e.preventDefault(); navigate("/instant-analysis"); }} className={navLinkClass("/instant-analysis")}>
            <Camera size={13} /> Photo Analysis
          </a>

          <Popover>
            <PopoverTrigger asChild>
              <button className="typo-nav-primary text-muted-foreground hover:text-foreground bg-transparent h-auto py-3 px-3 inline-flex items-center gap-1 border-b-2 border-transparent transition-colors">
                Resources <ChevronDown size={12} className="ml-0.5" />
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
        </nav>

        {/* Right: Start Analysis + Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/start")}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full typo-button-primary bg-primary text-primary-foreground hover:bg-primary-dark transition-colors"
          >
            Start Analysis <ArrowRight size={13} />
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
                <a
                  href="/start"
                  onClick={(e) => { e.preventDefault(); navigate("/start"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors bg-primary/10 hover:bg-primary/15"
                >
                  <Zap size={14} className="text-primary" />
                  <span className="typo-nav-primary text-primary font-bold">Start Analysis</span>
                </a>

                <div className="h-px bg-border my-2" />

                <a href="/portfolio" onClick={(e) => { e.preventDefault(); navigate("/portfolio"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted">
                  <PieChart size={14} className="text-primary" />
                  <span className="typo-nav-primary">Portfolio</span>
                </a>
                <a href="/intel" onClick={(e) => { e.preventDefault(); navigate("/intel"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted">
                  <Radar size={14} className="text-primary" />
                  <span className="typo-nav-primary">Intel</span>
                </a>
                <a href="/instant-analysis" onClick={(e) => { e.preventDefault(); navigate("/instant-analysis"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted">
                  <Camera size={14} className="text-primary" />
                  <span className="typo-nav-primary">Photo Analysis</span>
                </a>

                <div className="h-px bg-border my-2" />
                <p className="typo-card-eyebrow px-3 pt-2 pb-1">Resources</p>
                {RESOURCES_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.label} href={item.path}
                      onClick={(e) => { e.preventDefault(); navigate(item.path); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted">
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
