/**
 * COMMAND NAVIGATION — Unified Sidebar
 *
 * Renders inside all authenticated routes (controlled by AppLayout).
 * Top: Logo + project list. Middle: Analysis journey (contextual).
 * Bottom: Resources/settings.
 */

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, GitBranch, Search,
  Lightbulb,
  Shield, Brain,
  FolderOpen, PlusCircle, Zap,
  Info, HelpCircle, Sparkles, BarChart3, Map,
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

/* ── Nav config ── */
interface NavItem {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  path: string | ((id: string | null) => string);
  requiresAnalysis?: boolean;
  step?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const JOURNEY_SECTION: NavSection = {
  label: "Analysis Journey",
  items: [
    { label: "Command Deck", shortLabel: "Deck", icon: LayoutDashboard, path: (id) => id ? `/analysis/${id}/command-deck` : "/workspace", requiresAnalysis: true },
    { label: "Insight Graph", shortLabel: "Graph", icon: GitBranch, path: (id) => id ? `/analysis/${id}/insight-graph` : "/workspace", requiresAnalysis: true },
    { label: "1 · Understand", shortLabel: "1", icon: Search, path: (id) => id ? `/analysis/${id}/report` : "/analysis/new", requiresAnalysis: true, step: 1 },
    { label: "2 · Disrupt", shortLabel: "2", icon: Brain, path: (id) => id ? `/analysis/${id}/disrupt` : "/analysis/new", requiresAnalysis: true, step: 2 },
    { label: "3 · Reimagine", shortLabel: "3", icon: Lightbulb, path: (id) => id ? `/analysis/${id}/redesign` : "/analysis/new", requiresAnalysis: true, step: 3 },
    { label: "4 · Stress Test", shortLabel: "4", icon: Shield, path: (id) => id ? `/analysis/${id}/stress-test` : "/analysis/new", requiresAnalysis: true, step: 4 },
    { label: "5 · Pitch", shortLabel: "5", icon: Sparkles, path: (id) => id ? `/analysis/${id}/pitch` : "/analysis/new", requiresAnalysis: true, step: 5 },
  ],
};

const SYSTEM_ITEMS: NavItem[] = [
  { label: "My Workspace", icon: FolderOpen, path: "/workspace" },
  { label: "New Analysis", icon: PlusCircle, path: "/analysis/new" },
];

const RESOURCE_ITEMS: NavItem[] = [
  { label: "About", icon: Info, path: "/about" },
  { label: "Methodology", icon: BarChart3, path: "/methodology" },
  { label: "FAQs", icon: HelpCircle, path: "/faqs" },
];

export function CommandNavigation({ onOpenTour }: { onOpenTour?: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const analysisId = useAnalysisId();
  const currentPath = location.pathname;

  const resolvePath = (item: NavItem): string => {
    if (typeof item.path === "string") return item.path;
    return item.path(analysisId);
  };

  const isActive = (item: NavItem): boolean => {
    const resolved = resolvePath(item);
    return currentPath === resolved || currentPath.startsWith(resolved + "/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-sidebar-border">
      <SidebarContent className="pt-2">
        {/* Logo */}
        <div className="px-3 py-2 mb-1">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 w-full"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
              <Zap size={16} />
            </div>
            {!collapsed && (
              <span className="text-sm font-extrabold tracking-tight text-sidebar-foreground">
                Market Disruptor
              </span>
            )}
          </button>
        </div>

        {/* ── Projects ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SYSTEM_ITEMS.map((item) => (
                <NavMenuItem
                  key={item.label}
                  item={item}
                  active={isActive(item)}
                  path={resolvePath(item)}
                  collapsed={collapsed}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Analysis Journey (only when inside an analysis) ── */}
        {analysisId && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
              {JOURNEY_SECTION.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {JOURNEY_SECTION.items.map((item) => {
                  const disabled = item.requiresAnalysis && !analysisId;
                  return (
                    <NavMenuItem
                      key={item.label}
                      item={item}
                      active={isActive(item)}
                      path={disabled ? "#" : resolvePath(item)}
                      collapsed={collapsed}
                      disabled={disabled}
                      onClick={disabled ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                    />
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── Resources ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3">
            Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {RESOURCE_ITEMS.map((item) => (
                <NavMenuItem
                  key={item.label}
                  item={item}
                  active={isActive(item)}
                  path={resolvePath(item)}
                  collapsed={collapsed}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Map size={13} />
            {!collapsed && <span>Guided Tour</span>}
          </button>
        )}
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

/* ── Reusable Nav Item ── */
function NavMenuItem({
  item,
  active,
  path,
  collapsed,
  disabled,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  path: string;
  collapsed: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={path}
          end
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors min-h-[36px] ${
            disabled
              ? "opacity-40 cursor-not-allowed"
              : active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          onClick={onClick}
        >
          <Icon
            size={16}
            className={`flex-shrink-0 ${
              active ? "text-primary" : "text-sidebar-foreground/70"
            }`}
          />
          {!collapsed && <span>{item.label}</span>}
          {active && !collapsed && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
