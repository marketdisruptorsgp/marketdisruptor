import { useState, useEffect, useCallback } from "react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription, TierKey } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Key, Webhook, BookOpen, Code2, Copy, Trash2, Plus, Send,
  CheckCircle2, XCircle, Zap, ArrowRight, Shield, Plug, ExternalLink,
  BarChart3, Bell, Database, FileSpreadsheet, Users, Briefcase,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ─── Types ───
interface ApiKeyRow {
  id: string;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

// ─── Helpers ───
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateRawKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "md_live_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Tier limits ───
function keyLimit(tier: TierKey) { return tier === "disruptor" ? Infinity : tier === "builder" ? 1 : 0; }
function webhookLimit(tier: TierKey) { return tier === "disruptor" ? Infinity : tier === "builder" ? 1 : 0; }

// ─── Main page ───
export default function ApiPage() {
  const { tier } = useSubscription();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");

  // API keys state
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("My API Key");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const canGenerate = tier !== "explorer";

  // ─── Fetch keys & webhooks ───
  const fetchKeys = useCallback(async () => {
    if (!user) return;
    setKeysLoading(true);
    const { data } = await (supabase.from("api_keys") as any)
      .select("id, key_prefix, name, created_at, last_used_at, revoked_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    setKeys(data || []);
    setKeysLoading(false);
  }, [user]);

  const fetchWebhooks = useCallback(async () => {
    if (!user) return;
    setWebhooksLoading(true);
    const { data } = await (supabase.from("webhooks") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setWebhooks(data || []);
    setWebhooksLoading(false);
  }, [user]);

  useEffect(() => { fetchKeys(); fetchWebhooks(); }, [fetchKeys, fetchWebhooks]);

  // ─── Generate key ───
  const handleGenerateKey = async () => {
    if (!user) return;
    if (keys.length >= keyLimit(tier)) {
      toast.error(tier === "explorer" ? "Upgrade to Builder to generate API keys." : "Key limit reached for your plan.");
      return;
    }
    const raw = generateRawKey();
    const hash = await sha256(raw);
    const prefix = raw.slice(0, 16);

    await (supabase.from("api_keys") as any).insert({
      user_id: user.id,
      key_hash: hash,
      key_prefix: prefix,
      name: newKeyName || "My API Key",
    });

    setRevealedKey(raw);
    setShowKeyModal(true);
    setNewKeyName("My API Key");
    fetchKeys();
  };

  // ─── Revoke key ───
  const handleRevokeKey = async (id: string) => {
    await (supabase.from("api_keys") as any).update({ revoked_at: new Date().toISOString() }).eq("id", id);
    toast.success("API key revoked");
    fetchKeys();
  };

  // ─── Add webhook ───
  const handleAddWebhook = async () => {
    if (!user || !newWebhookUrl.trim()) return;
    if (webhooks.length >= webhookLimit(tier)) {
      toast.error(tier === "explorer" ? "Upgrade to Builder to add webhooks." : "Webhook limit reached for your plan.");
      return;
    }
    await (supabase.from("webhooks") as any).insert({
      user_id: user.id,
      url: newWebhookUrl.trim(),
      events: ["analysis.completed"],
    });
    setNewWebhookUrl("");
    toast.success("Webhook added");
    fetchWebhooks();
  };

  // ─── Delete webhook ───
  const handleDeleteWebhook = async (id: string) => {
    await (supabase.from("webhooks") as any).delete().eq("id", id);
    toast.success("Webhook removed");
    fetchWebhooks();
  };

  // ─── Test webhook ───
  const handleTestWebhook = async (wh: WebhookRow) => {
    setTestingWebhook(wh.id);
    try {
      await supabase.functions.invoke("fire-webhook", {
        body: { test: true, webhookId: wh.id },
      });
      toast.success("Test payload sent!");
    } catch {
      toast.error("Test failed");
    } finally {
      setTestingWebhook(null);
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/api-proxy`;

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
            <Code2 size={16} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">API & Integrations</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 ml-12">
          Connect Market Disruptor to your tools — pull data via REST API or push events via webhooks.
        </p>

        <Tabs value={tab} onValueChange={setTab}>
           <TabsList className="mb-6">
             <TabsTrigger value="overview" className="gap-1.5"><BookOpen size={13} /> Overview</TabsTrigger>
             <TabsTrigger value="integrations" className="gap-1.5"><Plug size={13} /> Integrations</TabsTrigger>
             <TabsTrigger value="keys" className="gap-1.5"><Key size={13} /> API Keys</TabsTrigger>
             <TabsTrigger value="endpoints" className="gap-1.5"><Code2 size={13} /> Endpoints</TabsTrigger>
             <TabsTrigger value="webhooks" className="gap-1.5"><Webhook size={13} /> Webhooks</TabsTrigger>
           </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview">
            <div className="section-panel space-y-6">
              <h2 className="text-lg font-bold text-foreground">What you can do</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: ArrowRight, title: "Pull data to your tools", desc: "Query your analyses, patent filings, and market news via REST API. Pipe into Notion, Google Sheets, or custom dashboards." },
                  { icon: Zap, title: "Push events via webhooks", desc: "Get a JSON payload posted to your URL every time an analysis completes. Works with Zapier, Make, n8n, Slack." },
                  { icon: Shield, title: "Secure by design", desc: "API keys are hashed (SHA-256) and never stored in plaintext. Keys are scoped to your account only." },
                  { icon: Code2, title: "Simple REST interface", desc: "Standard Bearer token auth. JSON responses. No SDK needed." },
                ].map((c) => (
                  <div key={c.title} className="card-intelligence p-5">
                    <c.icon size={18} className="text-primary mb-2" />
                    <p className="text-sm font-semibold text-foreground mb-1">{c.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
              {tier === "explorer" && (
                <div className="insight-callout">
                  <p className="text-sm text-foreground font-semibold">🔒 Upgrade to unlock API access</p>
                  <p className="text-xs text-muted-foreground mt-1">API keys and webhooks are available on Builder ($25/mo) and Disruptor ($59/mo) plans.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Integrations ─── */}
          <TabsContent value="integrations">
            <div className="section-panel space-y-8">
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Tools & Integrations</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect Market Disruptor to the tools you already use. Push analysis results, deal economics, and market intelligence directly into your workflow — no manual copy-paste.
                </p>
              </div>

              {/* Automation Platforms */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Automation Platforms</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Trigger workflows automatically when analyses complete — route data wherever you need it.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: "Zapier",
                      logo: "/integrations/zapier.svg",
                      url: "https://zapier.com",
                      color: "#FF4A00",
                      method: "Webhook",
                      desc: "Connect to 6,000+ apps. Auto-send completed analyses to CRMs, email sequences, project boards, or spreadsheets.",
                      useCases: ["Auto-log new analyses to a deal tracker", "Send Slack alerts when Revival Score > 8", "Push pitch deck data to Google Slides"],
                    },
                    {
                      name: "Make",
                      logo: null,
                      url: "https://make.com",
                      color: "#6D00CC",
                      method: "Webhook",
                      desc: "Visual automation builder with branching logic. Build multi-step workflows that react to analysis events.",
                      useCases: ["Route high-score analyses to acquisition pipeline", "Auto-generate deal memos from stress test results", "Sync disruption signals to team dashboards"],
                    },
                    {
                      name: "n8n",
                      logo: null,
                      url: "https://n8n.io",
                      color: "#EA4B71",
                      method: "Webhook",
                      desc: "Open-source, self-hostable automation. Full control over your data pipeline with 400+ integrations.",
                      useCases: ["Self-hosted deal flow automation", "Custom scoring pipelines with your own models", "Aggregate analyses across multiple accounts"],
                    },
                  ].map((tool) => (
                    <div key={tool.name} className="border border-border rounded-lg p-4 bg-card shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: tool.color }}>
                            {tool.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-foreground">{tool.name}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tool.method}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tool.desc}</p>
                      <div className="space-y-1 mb-3">
                        {tool.useCases.map((uc, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <ArrowRight size={10} className="text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-[11px] text-muted-foreground">{uc}</span>
                          </div>
                        ))}
                      </div>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        Visit {tool.name} <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* Data & Knowledge Management */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <Database size={14} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Data & Knowledge Management</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Organize analyses, track deal flow, and build your acquisition knowledge base.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: "Notion",
                      logo: "/integrations/notion.svg",
                      url: "https://notion.so",
                      color: "#000000",
                      method: "API + Webhook",
                      desc: "Build a living deal room. Auto-populate acquisition databases with market intel, scores, competitive maps, and due diligence notes.",
                      useCases: ["Auto-create deal pages per analysis", "Track addback scrutiny findings", "Build a searchable market intel wiki"],
                    },
                    {
                      name: "Google Sheets",
                      logo: "/integrations/google-sheets.svg",
                      url: "https://sheets.google.com",
                      color: "#34A853",
                      method: "API + Webhook",
                      desc: "Export analysis data to spreadsheets for financial modeling, custom scoring, and investor reporting. Perfect for SDE calculations and deal comparisons.",
                      useCases: ["Build SDE comparison models across targets", "Create custom weighted scoring sheets", "Generate investor-ready deal summaries"],
                    },
                    {
                      name: "Airtable",
                      logo: "/integrations/airtable.svg",
                      url: "https://airtable.com",
                      color: "#18BFFF",
                      method: "API + Webhook",
                      desc: "Flexible database for deal pipeline management. Track targets, scores, status, and team assignments in one view.",
                      useCases: ["Build a full acquisition CRM", "Track deal pipeline from sourcing to close", "Kanban board for due diligence stages"],
                    },
                  ].map((tool) => (
                    <div key={tool.name} className="border border-border rounded-lg p-4 bg-card shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: tool.color }}>
                            {tool.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-foreground">{tool.name}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tool.method}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tool.desc}</p>
                      <div className="space-y-1 mb-3">
                        {tool.useCases.map((uc, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <ArrowRight size={10} className="text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-[11px] text-muted-foreground">{uc}</span>
                          </div>
                        ))}
                      </div>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        Visit {tool.name} <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* Communication & CRM */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Communication & CRM</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Keep your team and advisors in the loop with real-time alerts and deal updates.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      name: "Slack",
                      logo: "/integrations/slack.svg",
                      url: "https://slack.com",
                      color: "#4A154B",
                      method: "Webhook",
                      desc: "Get instant notifications in your deal team's Slack channel. Alert on high-scoring opportunities, stress test failures, or new market signals.",
                      useCases: ["Alert #acquisitions channel on Revival Score > 8", "Post stress test summaries for team review", "Share disruption signals as they surface"],
                    },
                    {
                      name: "HubSpot",
                      logo: "/integrations/hubspot.svg",
                      url: "https://hubspot.com",
                      color: "#FF7A59",
                      method: "API + Webhook",
                      desc: "Sync deal intelligence into your CRM. Attach analysis reports to contacts, track acquisition targets, and auto-log market intel to deal records.",
                      useCases: ["Attach analysis PDFs to deal records", "Auto-create contacts for broker-listed targets", "Track deal stage progression with intel data"],
                    },
                  ].map((tool) => (
                    <div key={tool.name} className="border border-border rounded-lg p-4 bg-card shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        {tool.logo ? (
                          <img src={tool.logo} alt={tool.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: tool.color }}>
                            {tool.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-foreground">{tool.name}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tool.method}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tool.desc}</p>
                      <div className="space-y-1 mb-3">
                        {tool.useCases.map((uc, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <ArrowRight size={10} className="text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-[11px] text-muted-foreground">{uc}</span>
                          </div>
                        ))}
                      </div>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        Visit {tool.name} <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* How It Works */}
              <section className="border border-border rounded-lg p-5 bg-card shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={14} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">How Integration Works</h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { step: "1", title: "Generate API Key or Add Webhook", desc: "Create an API key in the Keys tab or register a webhook URL. Both are available on Builder and Disruptor plans." },
                    { step: "2", title: "Connect Your Tool", desc: "Paste your webhook URL into Zapier/Make/n8n, or use the REST API endpoints to pull data into Notion, Sheets, or Airtable." },
                    { step: "3", title: "Automate Your Workflow", desc: "Every completed analysis fires a webhook event with full data — scores, claims, deal economics, disruption ideas — ready to route." },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="step-badge flex-shrink-0 mt-0.5">{s.step}</div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">{s.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ETA-specific value prop */}
              <section className="insight-callout">
                <p className="text-sm font-semibold text-foreground mb-2">🎯 For ETA / Acquisition Operators</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  If you're sourcing, evaluating, and closing small business acquisitions, these integrations turn Market Disruptor into your deal intelligence command center:
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    "Auto-populate a Notion deal room with SDE analysis, addback scrutiny, and stagnation diagnostics for every target you evaluate",
                    "Build a Google Sheets model that pulls live Revival Scores and adjusted multiples via API — compare 20+ targets side-by-side",
                    "Set up Slack alerts when new market intel surfaces in your target vertical — know about supply chain shifts before brokers do",
                    "Create an Airtable pipeline that tracks every target from initial analysis through LOI to close, with auto-attached intelligence reports",
                    "Use Zapier to auto-send pitch deck PDFs to your investor group when a target scores above your threshold",
                    "Route stress test results to your advisory board's Slack channel for rapid deal committee reviews",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 size={11} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-muted-foreground leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          {/* ─── API Keys ─── */}
          <TabsContent value="keys">
            <div className="section-panel space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Your API Keys</h2>
                {canGenerate && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Key name"
                      className="w-40 h-9 text-sm"
                    />
                    <Button size="sm" onClick={handleGenerateKey} className="gap-1.5">
                      <Plus size={13} /> Generate
                    </Button>
                  </div>
                )}
              </div>

              {!canGenerate && (
                <div className="insight-callout">
                  <p className="text-sm text-muted-foreground">API key generation requires a Builder or Disruptor plan.</p>
                </div>
              )}

              {keysLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : keys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{k.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{k.key_prefix}••••••••</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">
                          {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleRevokeKey(k.id)} className="text-destructive hover:text-destructive">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Endpoints ─── */}
          <TabsContent value="endpoints">
            <div className="section-panel space-y-6">
              <h2 className="text-lg font-bold text-foreground">REST Endpoints</h2>
              <p className="text-sm text-muted-foreground">All endpoints require a Bearer token in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">Authorization</code> header.</p>

              {[
                { resource: "analyses", desc: "List all your saved analyses with scores, categories, and products.", example: { id: "uuid", title: "Wireless Earbuds v2", category: "Electronics", avg_revival_score: 8.2, product_count: 3 } },
                { resource: "patents", desc: "Recent patent filings from the last 30 days.", example: { id: "uuid", title: "Noise-cancelling method", category: "Audio", assignee: "Acme Corp", filing_date: "2026-02-01" } },
                { resource: "news", desc: "Recent market news from the last 30 days.", example: { id: "uuid", title: "New tariff impacts electronics", category: "Trade", source_name: "Reuters" } },
                { resource: "portfolio", desc: "Aggregated portfolio statistics.", example: { total_analyses: 12, avg_score: 7.4, top_category: "Electronics", analyses_this_month: 3 } },
              ].map((ep) => (
                <div key={ep.resource} className="card-intelligence p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="tag-pill text-[10px] font-bold uppercase">GET</span>
                    <code className="text-sm font-mono text-foreground">/api-proxy?resource={ep.resource}</code>
                  </div>
                  <p className="text-xs text-muted-foreground">{ep.desc}</p>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">curl</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(`curl -H "Authorization: Bearer YOUR_API_KEY" "${baseUrl}?resource=${ep.resource}"`); toast.success("Copied!"); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap break-all">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "${baseUrl}?resource=${ep.resource}"`}
                    </pre>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">Response example</span>
                    <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap">
{JSON.stringify({ data: [ep.example], count: 1 }, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ─── Webhooks ─── */}
          <TabsContent value="webhooks">
            <div className="section-panel space-y-5">
              <h2 className="text-lg font-bold text-foreground">Webhooks</h2>
              <p className="text-sm text-muted-foreground">Receive a POST request with analysis data every time an analysis completes.</p>

              {canGenerate && (
                <div className="flex items-center gap-2">
                  <Input
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                    className="flex-1 h-9 text-sm font-mono"
                  />
                  <Button size="sm" onClick={handleAddWebhook} className="gap-1.5">
                    <Plus size={13} /> Add
                  </Button>
                </div>
              )}

              {!canGenerate && (
                <div className="insight-callout">
                  <p className="text-sm text-muted-foreground">Webhooks require a Builder or Disruptor plan.</p>
                </div>
              )}

              {webhooksLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : webhooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No webhooks configured.</p>
              ) : (
                <div className="space-y-2">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono text-foreground truncate">{wh.url}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {wh.active ? (
                            <span className="flex items-center gap-1 text-[10px] text-success font-semibold"><CheckCircle2 size={10} /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold"><XCircle size={10} /> Inactive</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">Events: {wh.events.join(", ")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Button variant="outline" size="sm" onClick={() => handleTestWebhook(wh)} disabled={testingWebhook === wh.id} className="gap-1 text-xs">
                          <Send size={11} /> Test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteWebhook(wh.id)} className="text-destructive hover:text-destructive">
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card-intelligence p-5 space-y-2">
                <p className="text-sm font-semibold text-foreground">Payload example</p>
                <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap bg-muted rounded-lg p-3">
{JSON.stringify({
  event: "analysis.completed",
  timestamp: "2026-02-24T10:00:00Z",
  data: {
    id: "uuid",
    title: "Wireless Earbuds v2",
    category: "Electronics",
    avg_revival_score: 8.2,
    product_count: 3,
    top_idea: "Modular earbud system with swappable drivers",
  },
}, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Key reveal modal */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your API Key</DialogTitle>
            <DialogDescription>Copy this key now — you won't be able to see it again.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm break-all text-foreground">
            {revealedKey}
          </div>
          <Button
            className="w-full gap-2"
            onClick={() => {
              if (revealedKey) navigator.clipboard.writeText(revealedKey);
              toast.success("Copied to clipboard");
              setShowKeyModal(false);
              setRevealedKey(null);
            }}
          >
            <Copy size={14} /> Copy & Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
