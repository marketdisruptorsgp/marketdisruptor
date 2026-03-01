import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, X, BarChart3, Loader2, Paperclip, Image, FileText, Save, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface ChartData {
  type: "bar" | "line" | "table";
  title: string;
  labels?: string[];
  values?: number[];
  headers?: string[];
  rows?: string[][];
}

interface Attachment {
  name: string;
  type: string;
  url: string;
  uploading?: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
  attachments?: Attachment[];
}

interface SavedProject {
  id: string;
  title: string;
}

const QUICK_PROMPTS = [
  "Compare my top 3 projects",
  "What regulatory risks should I watch?",
  "Which category has the highest scores?",
  "Show my analysis trend over time",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workspace-query`;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export function WorkspaceExplorer({ onConversationSaved }: { onConversationSaved?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null);
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabase.from("saved_analyses").select("id, title").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setProjects((data as SavedProject[]) || []));
  }, [userId]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  // File upload
  const uploadFile = async (file: File): Promise<Attachment | null> => {
    if (!userId) return null;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type.split("/")[1]}`);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large (max 10MB)");
      return null;
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("explorer-uploads").upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from("explorer-uploads").getPublicUrl(path);
    return { name: file.name, type: file.type, url: urlData.publicUrl };
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).slice(0, 5 - attachments.length);
    if (fileArr.length === 0) return;

    const placeholders = fileArr.map(f => ({ name: f.name, type: f.type, url: "", uploading: true }));
    setAttachments(prev => [...prev, ...placeholders]);

    const results = await Promise.all(fileArr.map(uploadFile));
    setAttachments(prev => {
      const stable = prev.filter(a => !a.uploading);
      const uploaded = results.filter(Boolean) as Attachment[];
      return [...stable, ...uploaded];
    });
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  // Save conversation
  const saveConversation = async () => {
    if (messages.length < 2 || !userId) return;
    setSaving(true);
    try {
      const title = messages[0]?.content.slice(0, 80) || "Untitled conversation";
      const fileUrls = messages.flatMap(m => m.attachments?.map(a => a.url) || []);
      await supabase.from("explorer_conversations").insert({
        user_id: userId,
        project_id: selectedProjectId,
        title,
        messages: messages as any,
        file_urls: fileUrls,
      } as any);
      toast.success("Conversation saved!");
      onConversationSaved?.();
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
    setShowTagPicker(false);
  };

  const send = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    const currentAttachments = attachments.filter(a => !a.uploading);
    const userMsg: Message = { role: "user", content: question.trim(), attachments: currentAttachments.length > 0 ? currentAttachments : undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);
    setExpanded(true);
    scrollToBottom();

    let assistantText = "";
    const charts: ChartData[] = [];
    let toolCallArgs = "";
    let inToolCall = false;

    const updateAssistant = () => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const newMsg: Message = { role: "assistant", content: assistantText, charts: charts.length > 0 ? [...charts] : undefined };
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? newMsg : m);
        }
        return [...prev, newMsg];
      });
      scrollToBottom();
    };

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      if (!accessToken) {
        toast.error("Please sign in to use the Intelligence Explorer.");
        setLoading(false);
        return;
      }

      const imageUrls = currentAttachments.filter(a => a.type.startsWith("image/")).map(a => a.url);
      const pdfUrls = currentAttachments.filter(a => a.type === "application/pdf").map(a => a.url);

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ question, history, imageUrls, pdfUrls }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const choice = parsed.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta;
            if (delta?.content) {
              assistantText += delta.content;
              updateAssistant();
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name === "render_chart") {
                  inToolCall = true;
                  toolCallArgs = "";
                }
                if (tc.function?.arguments) {
                  toolCallArgs += tc.function.arguments;
                }
              }
            }

            if (choice.finish_reason === "tool_calls" || (choice.finish_reason === "stop" && inToolCall)) {
              if (toolCallArgs) {
                try {
                  const chartData = JSON.parse(toolCallArgs);
                  charts.push(chartData);
                  inToolCall = false;
                  toolCallArgs = "";
                  updateAssistant();
                } catch { /* partial */ }
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (toolCallArgs && inToolCall) {
        try {
          const chartData = JSON.parse(toolCallArgs);
          charts.push(chartData);
        } catch { /* ignore */ }
      }

      updateAssistant();
    } catch (e) {
      console.error("Explorer error:", e);
      toast.error("Failed to get response");
    }
    setLoading(false);
  }, [messages, loading, attachments, accessToken]);

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border bg-card overflow-hidden transition-colors ${dragging ? "border-primary border-2 bg-primary/[0.02]" : "border-border"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <p className="typo-section-title text-foreground">Intelligence Explorer</p>
            <p className="typo-card-meta text-foreground/60">Ask anything · Drop images or PDFs for context</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length >= 2 && (
            <div className="relative">
              <button
                onClick={() => setShowTagPicker(!showTagPicker)}
                disabled={saving}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/50 hover:text-primary"
                title="Save conversation"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              </button>
              {showTagPicker && (
                <div className="absolute right-0 top-full mt-1 z-20 w-64 bg-card border border-border rounded-xl shadow-lg p-3 space-y-2">
                  <p className="typo-card-meta font-semibold text-foreground">Tag to project (optional)</p>
                  <select
                    value={selectedProjectId || ""}
                    onChange={e => setSelectedProjectId(e.target.value || null)}
                    className="w-full text-sm rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
                  >
                    <option value="">No project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{(p.title || "Untitled").slice(0, 40)}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveConversation}
                    disabled={saving}
                    className="w-full px-3 py-1.5 rounded-lg bg-primary text-primary-foreground typo-card-meta font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Conversation"}
                  </button>
                </div>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setExpanded(false); setAttachments([]); setShowTagPicker(false); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/50">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      {dragging && (
        <div className="px-4 pb-3">
          <div className="border-2 border-dashed border-primary/40 rounded-xl p-6 text-center bg-primary/[0.03]">
            <Image size={24} className="mx-auto mb-2 text-primary/60" />
            <p className="typo-card-body text-primary/80">Drop images or PDFs here</p>
          </div>
        </div>
      )}

      {/* Quick prompts */}
      {messages.length === 0 && !dragging && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              className="px-3 py-1.5 rounded-lg typo-card-meta font-medium bg-background border border-border text-foreground/70 hover:border-primary/40 hover:text-primary transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {expanded && messages.length > 0 && (
        <div ref={scrollRef} className="max-h-[400px] overflow-y-auto px-4 space-y-3 pb-3">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
              {msg.role === "user" ? (
                <div className="max-w-[80%] space-y-1.5">
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {msg.attachments.map((att, ai) => (
                        <div key={ai} className="rounded-lg border border-primary/20 overflow-hidden">
                          {att.type.startsWith("image/") ? (
                            <img src={att.url} alt={att.name} className="h-16 w-auto object-cover rounded-lg" />
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5">
                              <FileText size={12} className="text-primary" />
                              <span className="typo-card-meta text-foreground/70 truncate max-w-[120px]">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="bg-primary text-primary-foreground px-3 py-2 rounded-xl rounded-br-sm typo-card-body">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="prose prose-sm max-w-none text-foreground typo-card-body [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.charts?.map((chart, ci) => (
                    <InlineChart key={ci} chart={chart} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-foreground/50 typo-card-meta">
              <Loader2 size={14} className="animate-spin" />
              Analyzing your data…
            </div>
          )}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-background text-foreground/70 typo-card-meta">
              {att.uploading ? (
                <Loader2 size={10} className="animate-spin" />
              ) : att.type.startsWith("image/") ? (
                <Image size={10} />
              ) : (
                <FileText size={10} />
              )}
              <span className="truncate max-w-[100px]">{att.name}</span>
              {!att.uploading && (
                <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept={ACCEPTED_TYPES.join(",")} multiple
            onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground/50 hover:text-primary transition-colors flex-shrink-0"
            title="Attach files"
          >
            <Paperclip size={16} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your projects, trends, risks…"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 typo-card-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && attachments.length === 0)}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

function InlineChart({ chart }: { chart: ChartData }) {
  if (chart.type === "table" && chart.headers && chart.rows) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <p className="typo-card-meta font-bold px-3 py-2 bg-muted/50 text-foreground">{chart.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full typo-card-meta">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {chart.headers.map((h, i) => (
                  <th key={i} className="px-3 py-1.5 text-left font-semibold text-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-foreground/80">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const data = (chart.labels || []).map((label, i) => ({
    name: label.length > 18 ? label.slice(0, 18) + "…" : label,
    value: chart.values?.[i] ?? 0,
  }));

  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border p-3 bg-background">
      <p className="typo-card-meta font-bold text-foreground mb-2 flex items-center gap-1.5">
        <BarChart3 size={12} className="text-primary" />
        {chart.title}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        {chart.type === "line" ? (
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
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
