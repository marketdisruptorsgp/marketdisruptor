import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserHeader } from "@/components/UserHeader";
import { type TierKey } from "@/hooks/useSubscription";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Zap, FolderOpen, PlusCircle, Radar,
  BookOpen, HelpCircle, Lightbulb, BarChart3, Code2,
  Menu, ChevronDown,
} from "lucide-react";

interface PlatformNavProps {
  tier: TierKey;
  onOpenSaved?: () => void;
  savedCount?: number;
}

const PRIMARY_NAV = [
  { label: "My Workspace", path: "/workspace", icon: FolderOpen },
  { label: "New Analysis", path: "/analysis/new", icon: PlusCircle },
  { label: "How It Works", path: "/methodology", icon: Lightbulb },
];

const RESOURCES_ITEMS = [
  { label: "Intelligence", desc: "Market signals & platform insights", icon: Radar, path: "/intelligence" },
  { label: "FAQs", desc: "Common questions answered", icon: HelpCircle, path: "/faqs" },
  { label: "API & Integrations", desc: "Connect your tools via REST API", icon: Code2, path: "/api" },
  { label: "Pricing", desc: "Plans and billing", icon: BarChart3, path: "/pricing" },
];

export function PlatformNav({ tier, onOpenSaved, savedCount }: PlatformNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="border-b border-border bg-background shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-0 flex items-center justify-between">
        {/* Left: Logo + Primary Nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mr-2 sm:mr-4 py-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Zap size={15} />
            </div>
            <span className="typo-nav-primary tracking-tight hidden sm:inline">Market Disruptor</span>
          </button>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                  className={`typo-nav-primary px-3 py-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                    isActive(item.path)
                      ? "text-foreground border-primary"
                      : "text-foreground hover:text-foreground border-transparent"
                  }`}
                >
                  <Icon size={13} />
                  {item.label}
                </a>
              );
            })}

            <div className="w-px h-5 bg-border mx-2" />

            {/* Resources dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="typo-nav-primary text-muted-foreground hover:text-foreground bg-transparent h-auto py-3 px-3 inline-flex items-center gap-1 border-b-2 border-transparent transition-colors text-sm">
                  Resources
                  <ChevronDown size={12} className="ml-0.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={8} className="w-56 p-2 bg-background shadow-lg rounded-xl border border-border">
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
        </div>

        {/* Right: User menu + mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                <p className="typo-card-eyebrow px-3 pt-2 pb-1">Navigate</p>
                {PRIMARY_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.path}
                      href={item.path}
                      onClick={(e) => { e.preventDefault(); navigate(item.path); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <Icon size={14} className="text-primary" />
                      <span className="typo-nav-primary">{item.label}</span>
                    </a>
                  );
                })}

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
