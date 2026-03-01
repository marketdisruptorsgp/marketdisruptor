import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Trash2, Tag, ChevronDown, ChevronUp, FileText, BarChart3, Pencil, Check, X, Link2, FolderOpen, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ExplorerConversation } from "./WorkspaceExplorer";

interface Conversation {
  id: string;
  title: string;
  project_id: string | null;
  messages: any[];
  file_urls: string[];
  created_at: string;
  project_title?: string;
}

interface SavedProject {
  id: string;
  title: string;
}

interface Props {
  refreshKey: number;
  onResumeConversation?: (conv: ExplorerConversation) => void;
}

export function SavedConversations({ refreshKey, onResumeConversation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);

  useEffect(() => { fetchConversations(); }, [refreshKey]);

  const fetchConversations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [convRes, projRes] = await Promise.all([
      supabase.from("explorer_conversations").select("*").eq("user_id", session.user.id).order("updated_at", { ascending: false }).limit(30) as any,
      supabase.from("saved_analyses").select("id, title").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    const data = convRes.data || [];
    setProjects((projRes.data as SavedProject[]) || []);

    if (data.length === 0) { setConversations([]); setLoading(false); return; }

    const projectIds = [...new Set(data.filter((c: any) => c.project_id).map((c: any) => c.project_id))] as string[];
    let projectMap: Record<string, string> = {};
    if (projectIds.length > 0) {
      const { data: proj } = await supabase.from("saved_analyses").select("id, title").in("id", projectIds);
      if (proj) projectMap = Object.fromEntries(proj.map((p: any) => [p.id, p.title]));
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

  const renameConversation = async (id: string) => {
    if (!editTitle.trim()) return;
    await supabase.from("explorer_conversations").update({ title: editTitle.trim() } as any).eq("id", id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
    setEditingId(null);
    toast.success("Renamed");
  };

  const linkToProject = async (convId: string, projectId: string | null) => {
    await supabase.from("explorer_conversations").update({ project_id: projectId } as any).eq("id", convId);
    const projTitle = projectId ? projects.find(p => p.id === projectId)?.title : undefined;
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, project_id: projectId, project_title: projTitle || undefined } : c));
    setLinkingId(null);
    toast.success(projectId ? `Linked to "${projTitle}"` : "Unlinked from project");
  };

  if (loading || conversations.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Explorer Sessions</h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{conversations.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Click ▶ to resume any conversation from where you left off.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {conversations.map(conv => {
          const isExpanded = expandedId === conv.id;
          const isEditing = editingId === conv.id;
          const isLinking = linkingId === conv.id;
          const msgCount = conv.messages?.length || 0;
          const fileCount = conv.file_urls?.length || 0;

          return (
            <div key={conv.id} className="rounded-xl border-2 border-border overflow-hidden group hover:border-primary/30 transition-colors bg-card">
              <div className="flex items-center gap-2.5 p-3.5">
                {/* Resume button */}
                {onResumeConversation && (
                  <button
                    onClick={() => onResumeConversation(conv as ExplorerConversation)}
                    className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:shadow-md"
                    title="Resume conversation"
                  >
                    <Play size={13} className="text-primary-foreground ml-0.5" />
                  </button>
                )}

                {/* Title / Editable */}
                <button onClick={() => setExpandedId(isExpanded ? null : conv.id)} className="flex-1 min-w-0 text-left">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && renameConversation(conv.id)}
                        autoFocus
                        className="text-sm font-medium text-foreground bg-transparent border-b border-primary/40 outline-none w-full"
                      />
                      <button onClick={() => renameConversation(conv.id)} className="p-1 rounded hover:bg-muted"><Check size={11} className="text-primary" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-muted"><X size={11} className="text-muted-foreground" /></button>
                    </div>
                  ) : (
                    <>
                      <p className="typo-card-title text-foreground truncate text-sm">{conv.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="typo-card-meta text-foreground/50">{format(parseISO(conv.created_at), "MMM d, yyyy")}</span>
                        <span className="typo-card-meta text-foreground/40">·</span>
                        <span className="typo-card-meta text-foreground/50">{msgCount} msgs</span>
                        {fileCount > 0 && <><span className="typo-card-meta text-foreground/40">·</span><span className="typo-card-meta text-foreground/50">{fileCount} files</span></>}
                      </div>
                    </>
                  )}
                </button>

                {/* Project tag */}
                {conv.project_title && !isLinking && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 typo-card-meta text-primary font-medium flex-shrink-0">
                    <Tag size={10} />
                    {conv.project_title.slice(0, 20)}
                  </span>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {/* Rename */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                    className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 hover:text-foreground transition-colors"
                    title="Rename"
                  >
                    <Pencil size={11} />
                  </button>

                  {/* Link to project */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setLinkingId(isLinking ? null : conv.id); }}
                    className={`p-1.5 rounded-lg transition-colors ${conv.project_id ? "text-primary hover:bg-primary/10" : "text-foreground/40 hover:bg-muted hover:text-foreground"}`}
                    title={conv.project_id ? "Change linked project" : "Link to project"}
                  >
                    <Link2 size={11} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-foreground/40 hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>

                  {/* Expand */}
                  <button onClick={() => setExpandedId(isExpanded ? null : conv.id)} className="p-1.5 rounded-lg hover:bg-muted text-foreground/40 transition-colors">
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {/* Project picker dropdown */}
              {isLinking && (
                <div className="border-t border-border px-3 py-2 bg-muted/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Link to project</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {conv.project_id && (
                      <button onClick={() => linkToProject(conv.id, null)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors">
                        <X size={10} /> Unlink
                      </button>
                    )}
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => linkToProject(conv.id, p.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${p.id === conv.project_id ? "bg-primary/10 text-primary border-primary/20 font-medium" : "text-foreground border-border hover:bg-muted"}`}
                      >
                        <FolderOpen size={10} className="flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{p.title || "Untitled"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded messages */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto bg-background/50">
                  {(conv.messages || []).map((msg: any, i: number) => (
                    <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                      {msg.role === "user" ? (
                        <div className="max-w-[80%] space-y-1.5">
                          {msg.attachments?.map((att: any, ai: number) => (
                            <div key={ai} className="rounded-lg border border-primary/20 overflow-hidden inline-block">
                              {att.type?.startsWith("image/") ? <img src={att.url} alt={att.name} className="h-16 w-auto object-cover rounded-lg" /> : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5"><FileText size={12} className="text-primary" /><span className="typo-card-meta text-foreground/70">{att.name}</span></div>
                              )}
                            </div>
                          ))}
                          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-xl rounded-br-sm typo-card-body">{msg.content}</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="prose prose-sm max-w-none text-foreground typo-card-body [&_p]:mb-1.5 [&_ul]:mb-1.5"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                          {msg.charts?.map((chart: any, ci: number) => <SavedChart key={ci} chart={chart} />)}
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
          <thead><tr className="border-b border-border bg-muted/30">{chart.headers.map((h: string, i: number) => <th key={i} className="px-3 py-1.5 text-left font-semibold text-foreground">{h}</th>)}</tr></thead>
          <tbody>{chart.rows.map((row: string[], ri: number) => <tr key={ri} className="border-b border-border last:border-0">{row.map((cell: string, ci: number) => <td key={ci} className="px-3 py-1.5 text-foreground/80">{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  const data = (chart.labels || []).map((label: string, i: number) => ({ name: label.length > 18 ? label.slice(0, 18) + "…" : label, value: chart.values?.[i] ?? 0 }));
  if (data.length === 0) return null;
  return (
    <div className="rounded-lg border border-border p-3 bg-background">
      <p className="typo-card-meta font-bold text-foreground mb-2 flex items-center gap-1.5"><BarChart3 size={12} className="text-primary" />{chart.title}</p>
      <ResponsiveContainer width="100%" height={120}>
        {chart.type === "line" ? (
          <LineChart data={data}><XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart>
        ) : (
          <BarChart data={data}><XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
