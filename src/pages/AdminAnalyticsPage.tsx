import React, { useState, useEffect } from "react";
import { useAnalyticsAdmin } from "@/hooks/useAnalyticsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, Users, MousePointerClick, TrendingUp, AlertTriangle,
  Eye, Clock, Smartphone, Monitor, Tablet, ArrowRight, RefreshCw,
  LogOut, Zap, Target, Activity, Route, Flame, UserCircle, FileText,
  Star, ArrowLeft, Layers, MessageSquare
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(262 80% 50%)", "hsl(173 80% 40%)", "hsl(340 75% 55%)"];

function LoginGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Analytics Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="Enter admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && token && onLogin(token)}
          />
          {err && <p className="text-destructive text-xs">{err}</p>}
          <Button className="w-full" onClick={() => token && onLogin(token)} disabled={!token}>
            Access Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: React.ElementType; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function OverviewPanel({ data }: { data: any }) {
  if (!data) return <p className="text-muted-foreground text-sm">Loading...</p>;

  const chartConfig = { count: { label: "Sessions", color: "hsl(var(--primary))" } };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sessions" value={data.totalSessions} icon={Users} />
        <StatCard label="Conversions" value={data.totalConversions} icon={Target} sub={`${data.conversionRate}% rate`} />
        <StatCard label="Avg Duration" value={formatMs(data.avgDuration)} icon={Clock} />
        <StatCard label="Returning" value={`${data.returningPct}%`} icon={TrendingUp} sub={`${data.avgPages} avg pages`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessions by Day</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sessionsByDay?.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={data.sessionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-xs py-8 text-center">No session data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.eventBreakdown || {}).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: any) => (
                <div key={type} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground capitalize">{type.replace("_", " ")}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(data.eventBreakdown || {}).length === 0 && (
                <p className="text-muted-foreground text-xs py-4 text-center">No events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(data.deviceBreakdown || {}).map(([device, count]: any) => {
              const Icon = device === "mobile" ? Smartphone : device === "tablet" ? Tablet : Monitor;
              return (
                <div key={device} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="capitalize">{device}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionsPanel({ data }: { data: any[] | null }) {
  if (!data) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (data.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">No section data yet</p>;

  return (
    <div className="space-y-2">
      {data.map((s: any, i: number) => (
        <Card key={s.section_id}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">#{i + 1} {s.section_id}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{s.views} views</span>
                  <span>{s.clicks} clicks</span>
                  <span>{s.avgScroll}% scroll</span>
                  <span>{formatMs(s.avgTimeMs)} avg</span>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={s.engagementScore > 20 ? "default" : "secondary"}>
                  {s.engagementScore}% engagement
                </Badge>
                {s.frictionScore > 5 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {s.frictionScore}% friction
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FunnelPanel({ data }: { data: any }) {
  if (!data?.steps) return <p className="text-muted-foreground text-sm">Loading...</p>;

  const maxCount = Math.max(...data.steps.map((s: any) => s.count), 1);

  return (
    <div className="space-y-3">
      {data.steps.map((step: any, i: number) => (
        <div key={step.name} className="flex items-center gap-3">
          <div className="w-28 text-sm font-medium">{step.name}</div>
          <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center px-2 text-xs font-medium text-primary-foreground"
              style={{
                width: `${Math.max(5, (step.count / maxCount) * 100)}%`,
                background: `hsl(var(--primary) / ${1 - i * 0.15})`,
              }}
            >
              {step.count}
            </div>
          </div>
          {i < data.steps.length - 1 && data.steps[i].count > 0 && (
            <span className="text-xs text-muted-foreground w-12 text-right">
              {((data.steps[i + 1].count / data.steps[i].count) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function PathsPanel({ data }: { data: any }) {
  if (!data?.topPaths) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (data.topPaths.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">No path data yet</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{data.totalSessions} sessions with navigation events</p>
      {data.topPaths.map((p: any, i: number) => (
        <Card key={i}>
          <CardContent className="p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-mono">
              <Route className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{p.path}</span>
            </div>
            <Badge variant="secondary">{p.count}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HeatmapPanel({ data }: { data: any[] | null }) {
  if (!data) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (data.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">No click data yet</p>;

  return (
    <div className="space-y-2">
      {data.slice(0, 30).map((item: any, i: number) => (
        <Card key={i}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-mono truncate max-w-[300px]">{item.element}</p>
                <p className="text-xs text-muted-foreground">{item.page || "—"}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{item.clicks} clicks</Badge>
                {item.deadClicks > 0 && <Badge variant="outline">{item.deadClicks} dead</Badge>}
                {item.rageClicks > 0 && <Badge variant="destructive">{item.rageClicks} rage</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FrictionPanel({ data }: { data: any[] | null }) {
  if (!data) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (data.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">No friction detected — great UX!</p>;

  return (
    <div className="space-y-2">
      {data.map((z: any, i: number) => (
        <Card key={i} className={z.frictionScore > 20 ? "border-destructive/50" : ""}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-destructive" />
                  <p className="font-medium text-sm">{z.zone}</p>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{z.rageClicks} rage clicks</span>
                  <span>{z.deadClicks} dead clicks</span>
                  <span>{z.hesitations} hesitations</span>
                  <span>{z.abandons} abandons</span>
                </div>
              </div>
              <Badge variant="destructive">Score: {z.frictionScore}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SessionReplayPanel({ fetchData }: { fetchData: (action: string, extra?: string) => Promise<any> }) {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [replayEvents, setReplayEvents] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = async () => {
    setLoadingSessions(true);
    const data = await fetchData("sessions");
    setSessions(data || []);
    setLoadingSessions(false);
  };

  const loadReplay = async (sid: string) => {
    setSessionId(sid);
    const data = await fetchData("session_replay", `&session_id=${sid}`);
    setReplayEvents(data || []);
  };

  useEffect(() => { loadSessions(); }, []);

  if (sessionId && replayEvents.length > 0) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => { setSessionId(""); setReplayEvents([]); }}>
          ← Back to sessions
        </Button>
        <p className="text-xs text-muted-foreground">Session: {sessionId} • {replayEvents.length} events</p>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {replayEvents.map((e: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border/50">
              <span className="text-muted-foreground w-20 shrink-0">
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">{e.event_type}</Badge>
              <span className="truncate text-muted-foreground">
                {e.page_path} {e.element_id ? `→ ${e.element_id}` : ""} {e.section_id ? `[${e.section_id}]` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loadingSessions ? (
        <p className="text-muted-foreground text-sm">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No sessions recorded yet</p>
      ) : (
        sessions.slice(0, 30).map((s: any) => (
          <Card key={s.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadReplay(s.session_id)}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{new Date(s.started_at).toLocaleString()}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{s.device_type}</span>
                    <span>{s.page_count} pages</span>
                    <span>{formatMs(s.total_duration_ms)}</span>
                    {s.is_returning && <Badge variant="outline" className="text-[10px]">Returning</Badge>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function InsightsPanel({ data, onCompute }: { data: any[] | null; onCompute: () => void }) {
  if (!data) return <p className="text-muted-foreground text-sm">Loading...</p>;

  const recommendations = data.filter(i => i.insight_type === "ux_recommendation");
  const latestRecs = recommendations[0]?.payload?.recommendations || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{data.length} cached insights</p>
        <Button variant="outline" size="sm" onClick={onCompute}>
          <Zap className="w-3 h-3 mr-1" /> Recompute
        </Button>
      </div>

      {latestRecs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> UX Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {latestRecs.map((r: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.filter(i => i.insight_type !== "ux_recommendation").slice(0, 10).map((insight: any) => (
        <Card key={insight.id}>
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-1">
              <Badge variant="secondary">{insight.insight_type.replace("_", " ")}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(insight.computed_at).toLocaleString()}</span>
            </div>
            <pre className="text-xs text-muted-foreground overflow-auto max-h-32 mt-1">
              {JSON.stringify(insight.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserDetailView({ user, detail, onBack }: { user: any; detail: any; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-3 h-3 mr-1" /> Back to users
      </Button>

      <div className="flex items-center gap-3">
        <UserCircle className="w-8 h-8 text-primary" />
        <div>
          <h3 className="font-semibold text-lg">{user.first_name}</h3>
          <p className="text-xs text-muted-foreground">
            Joined {new Date(user.created_at).toLocaleDateString()} • Last seen {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : "never"}
          </p>
        </div>
        {user.is_active && <Badge className="text-xs">Active</Badge>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Analyses" value={user.total_analyses} icon={FileText} />
        <StatCard label="This Month" value={user.current_month_analyses} icon={BarChart3} />
        <StatCard label="Saved Analyses" value={user.saved_analyses?.length || 0} icon={Star} />
        <StatCard label="Lenses" value={user.lenses_count} icon={Layers} />
      </div>

      {detail && (
        <>
          {/* Page visits */}
          {Object.keys(detail.page_visits || {}).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Page Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Object.entries(detail.page_visits)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([page, count]: any) => (
                      <div key={page} className="flex justify-between items-center text-sm">
                        <span className="font-mono text-xs text-muted-foreground truncate max-w-[250px]">{page}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event types */}
          {Object.keys(detail.event_types || {}).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Event Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(detail.event_types)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([type, count]: any) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type.replace("_", " ")}: {count}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyses */}
          {detail.analyses?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Saved Analyses ({detail.analyses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {detail.analyses.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-start border-b border-border/50 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{a.analysis_type}</span>
                          <span>{a.category}</span>
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {a.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        {a.avg_revival_score != null && (
                          <Badge variant="secondary" className="text-[10px]">{a.avg_revival_score}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lenses */}
          {detail.lenses?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Custom Lenses ({detail.lenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {detail.lenses.map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{l.name}</span>
                        {l.is_default && <Badge variant="outline" className="ml-2 text-[10px]">Default</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{l.risk_tolerance || "—"} risk • {l.time_horizon || "—"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interrogation conversations */}
          {detail.conversations?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Reasoning Conversations ({detail.conversations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {detail.conversations.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="font-mono truncate max-w-[200px]">{c.analysis_id}</span>
                      <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function UsersPanel({ fetchData }: { fetchData: (action: string, extra?: string) => Promise<any> }) {
  const [usersData, setUsersData] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData("users").then(setUsersData);
  }, []);

  const openUser = async (user: any) => {
    setSelectedUser(user);
    setLoadingDetail(true);
    const detail = await fetchData("user_detail", `&user_id=${user.user_id}`);
    setUserDetail(detail);
    setLoadingDetail(false);
  };

  if (selectedUser) {
    if (loadingDetail) return <p className="text-muted-foreground text-sm">Loading user details...</p>;
    return <UserDetailView user={selectedUser} detail={userDetail} onBack={() => { setSelectedUser(null); setUserDetail(null); }} />;
  }

  if (!usersData) return <p className="text-muted-foreground text-sm">Loading users...</p>;

  const filtered = search
    ? usersData.users.filter((u: any) => u.first_name?.toLowerCase().includes(search.toLowerCase()))
    : usersData.users;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Users" value={usersData.totalUsers} icon={Users} />
        <StatCard label="Active (7d)" value={usersData.activeUsers} icon={Activity} />
        <StatCard
          label="Activation Rate"
          value={usersData.totalUsers ? `${Math.round((usersData.activeUsers / usersData.totalUsers) * 100)}%` : "0%"}
          icon={TrendingUp}
        />
      </div>

      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs h-8 text-sm"
      />

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No users found</p>
        )}
        {filtered.map((u: any) => (
          <Card key={u.user_id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => openUser(u)}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{u.first_name}</p>
                    <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Last seen {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : "never"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.is_active && <Badge className="text-[10px]">Active</Badge>}
                  <Badge variant="secondary" className="text-xs">{u.total_analyses} analyses</Badge>
                  {u.lenses_count > 0 && (
                    <Badge variant="outline" className="text-[10px]">{u.lenses_count} lenses</Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { authenticated, login, logout, fetchData, computeInsights, loading, error, days, setDays } = useAnalyticsAdmin();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<any>(null);
  const [sections, setSections] = useState<any[] | null>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [paths, setPaths] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[] | null>(null);
  const [friction, setFriction] = useState<any[] | null>(null);
  const [insights, setInsights] = useState<any[] | null>(null);

  const loadTab = async (t: string) => {
    const actions: Record<string, [string, (d: any) => void]> = {
      overview: ["overview", setOverview],
      sections: ["sections", setSections],
      funnel: ["funnel", setFunnel],
      paths: ["paths", setPaths],
      heatmap: ["heatmap", setHeatmap],
      friction: ["friction", setFriction],
      insights: ["insights", setInsights],
    };

    const entry = actions[t];
    if (entry) {
      const data = await fetchData(entry[0]);
      entry[1](data);
    }
  };

  useEffect(() => {
    if (authenticated) loadTab(tab);
  }, [authenticated, tab, days]);

  if (!authenticated) return <LoginGate onLogin={login} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">Analytics Intelligence</h1>
            <p className="text-xs text-muted-foreground">Private owner dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24h</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => loadTab(tab)}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1 mb-4">
            <TabsTrigger value="overview" className="text-xs"><BarChart3 className="w-3 h-3 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs"><Users className="w-3 h-3 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="sections" className="text-xs"><Eye className="w-3 h-3 mr-1" />Sections</TabsTrigger>
            <TabsTrigger value="funnel" className="text-xs"><Target className="w-3 h-3 mr-1" />Funnel</TabsTrigger>
            <TabsTrigger value="paths" className="text-xs"><Route className="w-3 h-3 mr-1" />Paths</TabsTrigger>
            <TabsTrigger value="heatmap" className="text-xs"><MousePointerClick className="w-3 h-3 mr-1" />Heatmap</TabsTrigger>
            <TabsTrigger value="friction" className="text-xs"><Flame className="w-3 h-3 mr-1" />Friction</TabsTrigger>
            <TabsTrigger value="replay" className="text-xs"><Activity className="w-3 h-3 mr-1" />Sessions</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs"><Zap className="w-3 h-3 mr-1" />Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewPanel data={overview} /></TabsContent>
          <TabsContent value="users"><UsersPanel fetchData={fetchData} /></TabsContent>
          <TabsContent value="sections"><SectionsPanel data={sections} /></TabsContent>
          <TabsContent value="funnel"><FunnelPanel data={funnel} /></TabsContent>
          <TabsContent value="paths"><PathsPanel data={paths} /></TabsContent>
          <TabsContent value="heatmap"><HeatmapPanel data={heatmap} /></TabsContent>
          <TabsContent value="friction"><FrictionPanel data={friction} /></TabsContent>
          <TabsContent value="replay"><SessionReplayPanel fetchData={fetchData} /></TabsContent>
          <TabsContent value="insights">
            <InsightsPanel
              data={insights}
              onCompute={async () => {
                await computeInsights();
                loadTab("insights");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
