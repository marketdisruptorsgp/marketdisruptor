/**
 * COMMAND NAVIGATION — Strategic OS Left Navigation
 *
 * Only renders inside workspace/analysis routes (controlled by AppLayout).
 * Uses semantic sidebar design tokens for automatic light/dark compliance.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  LayoutDashboard, GitBranch, Search, Compass,
  Radio, HelpCircle, Lightbulb, Route, Layers,
  Building2, Shield, BarChart3, Radar,
  Brain, FolderOpen, PlusCircle, Zap,
  FileText, FlaskConical, Target, Presentation,
  DollarSign, Cpu,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

/* ── Analysis ID extraction ── */
function useAnalysisId(): string | null {
  const location = useLocation();
  const match = location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
  return match?.[1] || null;
}

/* ── Mode detection from URL ── */
function useAnalysisMode(): string | null {
  const { pathname } = useLocation();
  if (pathname.includes("/product")) return "product";
  if (pathname.includes("/service")) return "service";
  if (pathname.includes("/business")) return "business_model";
  return null;
}

/* ── Nav config ── */
interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string | ((id: string | null) => string);
  requiresAnalysis?: boolean;
  /** Only show when ETA lens is active */
  etaOnly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Command Deck", icon: LayoutDashboard, path: (id) => id ? `/analysis/${id}/command-deck` : "/workspace" },
      { label: "Insight Graph", icon: GitBranch, path: (id) => id ? `/analysis/${id}/insight-graph` : "/workspace", requiresAnalysis: true },
    ],
  },
  {
    label: "Analysis Journey",
    items: [
      { label: "1 · Understand", icon: Search, path: (id) => id ? `/analysis/${id}/report` : "/analysis/new", requiresAnalysis: true },
      { label: "2 · Deconstruct", icon: Brain, path: (id) => id ? `/analysis/${id}/disrupt` : "/analysis/new", requiresAnalysis: true },
      { label: "3 · Reimagine", icon: Lightbulb, path: (id) => id ? `/analysis/${id}/redesign` : "/analysis/new", requiresAnalysis: true },
      { label: "4 · Stress Test", icon: Shield, path: (id) => id ? `/analysis/${id}/stress-test` : "/analysis/new", requiresAnalysis: true },
      { label: "5 · Pitch", icon: Layers, path: (id) => id ? `/analysis/${id}/pitch` : "/analysis/new", requiresAnalysis: true },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "ETA Toolkit", icon: DollarSign, path: (id) => id ? `/analysis/${id}/command-deck#eta` : "/workspace", requiresAnalysis: true, etaOnly: true },
    ],
  },
  {
    label: "System",
    items: [
      { label: "My Workspace", icon: FolderOpen, path: "/workspace" },
      { label: "New Analysis", icon: PlusCircle, path: "/analysis/new" },
    ],
  },
];

const MODE_LABELS: Record<string, string> = {
  product: "Product Analysis",
  service: "Service Analysis",
  business_model: "Business Model",
};

export function CommandNavigation() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const analysisId = useAnalysisId();
  const mode = useAnalysisMode();
  const currentPath = location.pathname;

  // Detect ETA lens from URL hash or query
  const isEtaLens = location.search.includes("lens=eta") || location.hash.includes("eta");

  const resolvePath = (item: NavItem): string => {
    if (typeof item.path === "string") return item.path;
    return item.path(analysisId);
  };

  const isActive = (item: NavItem): boolean => {
    const resolved = resolvePath(item);
    return currentPath === resolved || currentPath.startsWith(resolved + "/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="pt-2 bg-sidebar">
        {/* Logo */}
        <div className="px-3 py-2 mb-1">
          <button
            onClick={() => navigate("/workspace")}
            className="flex items-center gap-2 w-full"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">
              <Zap size={15} />
            </div>
            {!collapsed && (
              <span className="text-sm font-extrabold tracking-tight text-sidebar-foreground">
                Market Disruptor
              </span>
            )}
          </button>
        </div>

        {/* Mode badge */}
        {!collapsed && mode && (
          <div className="px-3 pb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sidebar-accent text-sidebar-accent-foreground">
              {MODE_LABELS[mode] ?? mode}
            </span>
          </div>
        )}

        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => (!item.requiresAnalysis || analysisId) && (!item.etaOnly || isEtaLens)
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {(visibleItems.length > 0 ? visibleItems : section.items).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    const path = resolvePath(item);
                    const disabled = item.requiresAnalysis && !analysisId;

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={disabled ? "#" : path}
                            end
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
                              disabled
                                ? "opacity-40 cursor-not-allowed"
                                : active
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }`}
                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            onClick={(e) => {
                              if (disabled) e.preventDefault();
                            }}
                          >
                            <Icon size={16} className={active ? "text-sidebar-primary" : "text-sidebar-foreground/60"} />
                            {!collapsed && <span>{item.label}</span>}
                            {active && !collapsed && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary flex-shrink-0" />
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border bg-sidebar">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest">
            <Zap size={10} />
            Strategic Discovery OS
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
