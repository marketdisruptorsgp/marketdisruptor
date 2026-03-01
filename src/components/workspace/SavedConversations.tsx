import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Trash2, Tag, ChevronDown, ChevronUp, Image, FileText, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Conversation {
  id: string;
  title: string;
  project_id: string | null;
  messages: any[];
  file_urls: string[];
  created_at: string;
  project_title?: string;
}

export function SavedConversations({ refreshKey }: { refreshKey: number }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [refreshKey]);

  const fetchConversations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("explorer_conversations")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20) as any;

    if (!data || data.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Enrich with project titles
    const projectIds = [...new Set(data.filter((c: any) => c.project_id).map((c: any) => c.project_id))] as string[];
    let projectMap: Record<string, string> = {};
    if (projectIds.length > 0) {
      const { data: projects } = await supabase
        .from("saved_analyses")
        .select("id, title")
        .in("id", projectIds);
      if (projects) {
        projectMap = Object.fromEntries(projects.map((p: any) => [p.id, p.title]));
      }
    }

    setConversations(data.map((c: any) => ({
      ...c,
      project_title: c.project_id ? projectMap[c.project_id] || "Untitled" : undefined,
    })));
    setLoading(false);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("explorer_conversations").delete().eq("id", id) as any;
    setConversations(prev => prev.filter(c => c.id !== id));
    toast.success("Conversation deleted");
  };

  if (loading || conversations.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={16} className="text-primary" />
        <p className="typo-section-title text-foreground">Saved Explorer Sessions</p>
      </div>
      <p className="typo-card-body text-foreground/70 mb-4">
        Past Intelligence Explorer conversations you've bookmarked.
      </p>

      <div className="space-y-2">
        {conversations.map(conv => {
          const isExpanded = expandedId === conv.id;
          const msgCount = conv.messages?.length || 0;
          const fileCount = conv.file_urls?.length || 0;

          return (
            <div key={conv.id} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : conv.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="typo-card-title text-foreground truncate text-sm">{conv.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="typo-card-meta text-foreground/50">
                      {format(parseISO(conv.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="typo-card-meta text-foreground/40">·</span>
                    <span className="typo-card-meta text-foreground/50">{msgCount} messages</span>
                    {fileCount > 0 && (
                      <>
                        <span className="typo-card-meta text-foreground/40">·</span>
                        <span className="typo-card-meta text-foreground/50">{fileCount} files</span>
                      </>
                    )}
                  </div>
                </div>
                {conv.project_title && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 typo-card-meta text-primary font-medium flex-shrink-0">
                    <Tag size={10} />
                    {conv.project_title.slice(0, 20)}
                  </span>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                  {isExpanded ? <ChevronUp size={14} className="text-foreground/40" /> : <ChevronDown size={14} className="text-foreground/40" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto bg-background/50">
                  {(conv.messages || []).map((msg: any, i: number) => (
                    <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                      {msg.role === "user" ? (
                        <div className="max-w-[80%] space-y-1.5">
                          {msg.attachments?.map((att: any, ai: number) => (
                            <div key={ai} className="rounded-lg border border-primary/20 overflow-hidden inline-block">
                              {att.type?.startsWith("image/") ? (
                                <img src={att.url} alt={att.name} className="h-16 w-auto object-cover rounded-lg" />
                              ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5">
                                  <FileText size={12} className="text-primary" />
                                  <span className="typo-card-meta text-foreground/70">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-xl rounded-br-sm typo-card-body">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="prose prose-sm max-w-none text-foreground typo-card-body [&_p]:mb-1.5 [&_ul]:mb-1.5">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.charts?.map((chart: any, ci: number) => (
                            <SavedChart key={ci} chart={chart} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavedChart({ chart }: { chart: any }) {
  if (chart.type === "table" && chart.headers && chart.rows) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <p className="typo-card-meta font-bold px-3 py-2 bg-muted/50 text-foreground">{chart.title}</p>
        <table className="w-full typo-card-meta">
          <thead><tr className="border-b border-border bg-muted/30">
            {chart.headers.map((h: string, i: number) => <th key={i} className="px-3 py-1.5 text-left font-semibold text-foreground">{h}</th>)}
          </tr></thead>
          <tbody>{chart.rows.map((row: string[], ri: number) => (
            <tr key={ri} className="border-b border-border last:border-0">
              {row.map((cell: string, ci: number) => <td key={ci} className="px-3 py-1.5 text-foreground/80">{cell}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  const data = (chart.labels || []).map((label: string, i: number) => ({
    name: label.length > 18 ? label.slice(0, 18) + "…" : label,
    value: chart.values?.[i] ?? 0,
  }));
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border p-3 bg-background">
      <p className="typo-card-meta font-bold text-foreground mb-2 flex items-center gap-1.5">
        <BarChart3 size={12} className="text-primary" />{chart.title}
      </p>
      <ResponsiveContainer width="100%" height={120}>
        {chart.type === "line" ? (
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
