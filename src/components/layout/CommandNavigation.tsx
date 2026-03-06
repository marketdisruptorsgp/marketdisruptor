/**
 * COMMAND NAVIGATION — Strategic OS Left Navigation
 *
 * Only renders on workspace/analysis routes.
 * Uses semantic design tokens for full light/dark theme compliance.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  LayoutDashboard, GitBranch, Search, Compass,
  Radio, HelpCircle, Lightbulb, Route, Layers,
  Building2, Shield, BarChart3, Radar,
  User, Brain, FolderOpen,
  PlusCircle, Zap,
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

function useAnalysisId(): string | null {
  const location = useLocation();
  const match = location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
  return match?.[1] || null;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string | ((id: string | null) => string);
  requiresAnalysis?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Discovery",
    items: [
      { label: "Command Deck", icon: LayoutDashboard, path: (id) => id ? `/analysis/${id}/command-deck` : "/workspace" },
      { label: "Insight Graph", icon: GitBranch, path: (id) => id ? `/analysis/${id}/insight-graph` : "/workspace", requiresAnalysis: true },
      { label: "Evidence Explorer", icon: Search, path: (id) => id ? `/analysis/${id}/command-deck` : "/workspace", requiresAnalysis: true },
      { label: "Opportunity Landscape", icon: Compass, path: (id) => id ? `/analysis/${id}/insight-graph` : "/workspace", requiresAnalysis: true },
    ],
  },
  {
    label: "Analysis Pipeline",
    items: [
      { label: "Signals", icon: Radio, path: (id) => id ? `/analysis/${id}/report` : "/analysis/new", requiresAnalysis: true },
      { label: "Assumptions", icon: HelpCircle, path: (id) => id ? `/analysis/${id}/disrupt` : "/analysis/new", requiresAnalysis: true },
      { label: "Flipped Ideas", icon: Lightbulb, path: (id) => id ? `/analysis/${id}/redesign` : "/analysis/new", requiresAnalysis: true },
      { label: "Strategic Pathways", icon: Route, path: (id) => id ? `/analysis/${id}/stress-test` : "/analysis/new", requiresAnalysis: true },
      { label: "Concept Builder", icon: Layers, path: (id) => id ? `/analysis/${id}/pitch` : "/analysis/new", requiresAnalysis: true },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Market Signals", icon: Radar, path: "/intelligence" },
      { label: "Competitor Scout", icon: Building2, path: (id) => id ? `/analysis/${id}/report` : "/intelligence" },
      { label: "Patent Intelligence", icon: Shield, path: "/intelligence" },
      { label: "Signal Detection", icon: BarChart3, path: "/intelligence" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "My Workspace", icon: FolderOpen, path: "/workspace" },
      { label: "New Analysis", icon: PlusCircle, path: "/analysis/new" },
      { label: "Archetype Lens", icon: User, path: (id) => id ? `/analysis/${id}/command-deck` : "/workspace" },
      { label: "Model Governance", icon: Brain, path: "/admin/governance" },
    ],
  },
];

export function CommandNavigation() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const analysisId = useAnalysisId();
  const currentPath = location.pathname;

  const expandedSection = useMemo(() => {
    if (currentPath.includes("/command-deck") || currentPath.includes("/insight-graph")) return "Discovery";
    if (currentPath.includes("/report") || currentPath.includes("/disrupt") || currentPath.includes("/redesign") || currentPath.includes("/stress-test") || currentPath.includes("/pitch")) return "Analysis Pipeline";
    if (currentPath.includes("/intelligence") || currentPath.includes("/intel")) return "Intelligence";
    return "System";
  }, [currentPath]);

  const resolvePath = (item: NavItem): string => {
    if (typeof item.path === "string") return item.path;
    return item.path(analysisId);
  };

  const isActive = (item: NavItem): boolean => {
    const resolved = resolvePath(item);
    return currentPath === resolved || currentPath.startsWith(resolved + "/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent className="pt-2 bg-sidebar">
        {/* Logo */}
        <div className="px-3 py-2 mb-1">
          <button
            onClick={() => navigate("/workspace")}
            className="flex items-center gap-2 w-full"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
              <Zap size={15} />
            </div>
            {!collapsed && (
              <span className="text-sm font-extrabold tracking-tight text-sidebar-foreground">
                Market Disruptor
              </span>
            )}
          </button>
        </div>

        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            item => !item.requiresAnalysis || analysisId
          );
          if (visibleItems.length === 0 && section.label !== "System") return null;

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
                            <Icon size={16} className={active ? "text-primary" : "text-sidebar-foreground/60"} />
                            {!collapsed && <span>{item.label}</span>}
                            {active && !collapsed && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
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
