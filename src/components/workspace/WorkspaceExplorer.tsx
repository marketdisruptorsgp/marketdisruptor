import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, X, BarChart3, Loader2, Paperclip, Image, FileText, Tag, Brain, Zap, TrendingUp, Shield, Search, Lightbulb, ArrowRight, Bot, User, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

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
  { icon: TrendingUp, label: "Compare my top 3 projects", color: "hsl(var(--primary))" },
  { icon: Shield, label: "What regulatory risks should I watch?", color: "hsl(var(--destructive))" },
  { icon: BarChart3, label: "Which category has the highest scores?", color: "hsl(142 76% 36%)" },
  { icon: Lightbulb, label: "Show my analysis trend over time", color: "hsl(38 92% 50%)" },
];

const LOADING_INSIGHTS = [
  { icon: Brain, text: "Scanning your project portfolio…", detail: "Cross-referencing scores, categories, and trends" },
  { icon: Search, text: "Querying intelligence databases…", detail: "Patent filings, market signals, and trend data" },
  { icon: Zap, text: "Running comparative analysis…", detail: "Identifying patterns across your saved analyses" },
  { icon: TrendingUp, text: "Synthesizing market context…", detail: "Connecting your data to real-world signals" },
  { icon: Shield, text: "Evaluating risk factors…", detail: "Checking regulatory landscape and competitive threats" },
  { icon: Lightbulb, text: "Generating strategic insights…", detail: "Formulating actionable recommendations" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workspace-query`;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

// Parse :::insight blocks from markdown
interface InsightCard {
  level: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  body: string;
}

function parseInsightCards(text: string): { cards: InsightCard[]; cleanText: string } {
  const cards: InsightCard[] = [];
  const cleanText = text.replace(/:::insight\s+(HIGH|MEDIUM|LOW)\s*\n([\s\S]*?):::/gi, (_, level, content) => {
    const lines = content.trim().split("\n");
    const titleLine = lines[0]?.replace(/^\*\*|\*\*$/g, "").trim() || "Insight";
    const body = lines.slice(1).join("\n").trim();
    cards.push({ level: level.toUpperCase() as InsightCard["level"], title: titleLine, body });
    return "";
  });
  return { cards, cleanText: cleanText.trim() };
}

const INSIGHT_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  HIGH: { icon: AlertTriangle, color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.06)", border: "hsl(var(--destructive) / 0.2)" },
  MEDIUM: { icon: Info, color: "hsl(38 92% 50%)", bg: "hsl(38 92% 50% / 0.06)", border: "hsl(38 92% 50% / 0.2)" },
  LOW: { icon: CheckCircle2, color: "hsl(142 76% 36%)", bg: "hsl(142 76% 36% / 0.06)", border: "hsl(142 76% 36% / 0.2)" },
};

function InsightCardComponent({ card }: { card: InsightCard }) {
  const config = INSIGHT_CONFIG[card.level] || INSIGHT_CONFIG.MEDIUM;
  const Icon = config.icon;

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:shadow-sm"
          style={{ background: config.bg, border: `1px solid ${config.border}` }}
        >
          <Icon size={14} style={{ color: config.color }} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{card.title}</p>
            <p className="text-[11px] mt-0.5" style={{ color: config.color }}>
              {card.level} priority · Hover for details
            </p>
          </div>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon size={14} style={{ color: config.color }} />
            <span className="text-sm font-bold text-foreground">{card.title}</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{card.body}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function LoadingIndicator() {
  const [insightIndex, setInsightIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex(prev => (prev + 1) % LOADING_INSIGHTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const insight = LOADING_INSIGHTS[insightIndex];
  const Icon = insight.icon;
  const progress = Math.min((elapsed / 20) * 100, 95);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-primary/[0.01] p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{elapsed}s</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={insightIndex}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{insight.text}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{insight.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-1 pl-11">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/40"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Render assistant message with insight cards parsed out
function AssistantMessage({ msg }: { msg: Message }) {
  const { cards, cleanText } = parseInsightCards(msg.content);

  // Simple markdown renderer — strip heavy prose, keep structure
  const renderCleanMarkdown = (text: string) => {
    if (!text) return null;
    // Split into lines and render with basic formatting
    const lines = text.split("\n").filter(l => l.trim());
    return (
      <div className="space-y-1">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          // Bold verdict line
          if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
            return <p key={i} className="text-sm font-bold text-foreground">{trimmed.replace(/\*\*/g, "")}</p>;
          }
          // Bullet points
          if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            const content = trimmed.replace(/^[-•]\s*/, "");
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-primary mt-1.5 text-[6px]">●</span>
                <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
              </div>
            );
          }
          // Headers
          if (trimmed.startsWith("### ")) {
            return <p key={i} className="text-sm font-bold text-foreground mt-2">{trimmed.replace(/^###\s*/, "")}</p>;
          }
          if (trimmed.startsWith("## ")) {
            return <p key={i} className="text-base font-bold text-foreground mt-2">{trimmed.replace(/^##\s*/, "")}</p>;
          }
          // Regular text
          return (
            <p key={i} className="text-sm text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/10">
        <Bot size={13} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Charts first — visual lead */}
        {msg.charts?.map((chart, ci) => (
          <InlineChart key={ci} chart={chart} />
        ))}

        {/* Clean text verdict */}
        {cleanText && renderCleanMarkdown(cleanText)}

        {/* Insight cards — compact, hoverable */}
        {cards.length > 0 && (
          <div className="space-y-1.5">
            {cards.map((card, ci) => (
              <InsightCardComponent key={ci} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const autoSaveIdRef = useRef<string | null>(null);

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

  // Auto-save: upsert conversation after each assistant response
  const autoSave = useCallback(async (msgs: Message[]) => {
    if (!userId || msgs.length < 2) return;
    const title = msgs[0]?.content.slice(0, 80) || "Untitled conversation";
    const fileUrls = msgs.flatMap(m => m.attachments?.map(a => a.url) || []);

    try {
      if (autoSaveIdRef.current) {
        // Update existing
        await supabase.from("explorer_conversations").update({
          title,
          messages: msgs as any,
          file_urls: fileUrls,
          updated_at: new Date().toISOString(),
        } as any).eq("id", autoSaveIdRef.current);
      } else {
        // Create new
        const { data } = await supabase.from("explorer_conversations").insert({
          user_id: userId,
          title,
          messages: msgs as any,
          file_urls: fileUrls,
        } as any).select("id").single() as any;
        if (data?.id) {
          autoSaveIdRef.current = data.id;
        }
      }
      onConversationSaved?.();
    } catch {
      // Silent fail for auto-save
    }
  }, [userId, onConversationSaved]);

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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
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

      // Auto-save after response completes
      const finalMessages = [...messages, userMsg, { role: "assistant" as const, content: assistantText, charts: charts.length > 0 ? charts : undefined }];
      autoSave(finalMessages);

    } catch (e) {
      console.error("Explorer error:", e);
      toast.error("Failed to get response");
    }
    setLoading(false);
  }, [messages, loading, attachments, accessToken, autoSave]);

  const hasMessages = messages.length > 0;

  return (
    <motion.div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm ${
        dragging
          ? "border-primary border-2 bg-primary/[0.02] shadow-lg shadow-primary/5"
          : hasMessages
            ? "border-border bg-card shadow-md"
            : "border-border bg-gradient-to-br from-card via-card to-primary/[0.02]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground tracking-tight">Intelligence Explorer</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasMessages ? `${messages.length} messages · auto-saved` : "Ask anything · Drop images or PDFs for context"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasMessages && (
            <button onClick={() => { setMessages([]); setExpanded(false); setAttachments([]); autoSaveIdRef.current = null; }} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            className="px-4 pb-3"
          >
            <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center bg-primary/[0.03]">
              <Image size={28} className="mx-auto mb-2 text-primary/60" />
              <p className="text-sm font-medium text-primary/80">Drop images or PDFs here</p>
              <p className="text-xs text-muted-foreground mt-1">Files will be analyzed alongside your query</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state with prompt cards */}
      {!hasMessages && !dragging && (
        <div className="px-4 sm:px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((prompt, i) => {
              const Icon = prompt.icon;
              return (
                <motion.button
                  key={prompt.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  onClick={() => send(prompt.label)}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${prompt.color}12` }}
                  >
                    <Icon size={14} style={{ color: prompt.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                      {prompt.label}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-muted-foreground/0 group-hover:text-primary/60 transition-all mt-1 flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      {expanded && hasMessages && (
        <div ref={scrollRef} className="max-h-[500px] overflow-y-auto px-4 sm:px-5 space-y-4 pb-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={msg.role === "user" ? "flex justify-end" : ""}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] space-y-1.5">
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {msg.attachments.map((att, ai) => (
                        <div key={ai} className="rounded-lg border border-primary/20 overflow-hidden">
                          {att.type.startsWith("image/") ? (
                            <img src={att.url} alt={att.name} className="h-16 w-auto object-cover rounded-lg" />
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/5">
                              <FileText size={12} className="text-primary" />
                              <span className="text-xs text-foreground/70 truncate max-w-[120px]">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2 justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-primary" />
                    </div>
                  </div>
                </div>
              ) : (
                <AssistantMessage msg={msg} />
              )}
            </motion.div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="pl-9">
              <LoadingIndicator />
            </div>
          )}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 sm:px-5 pb-2 flex flex-wrap gap-1.5">
          {attachments.map((att, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background text-muted-foreground text-xs"
            >
              {att.uploading ? (
                <Loader2 size={10} className="animate-spin" />
              ) : att.type.startsWith("image/") ? (
                <Image size={10} />
              ) : (
                <FileText size={10} />
              )}
              <span className="truncate max-w-[100px]">{att.name}</span>
              {!att.uploading && (
                <button onClick={() => removeAttachment(i)} className="hover:text-destructive transition-colors">
                  <X size={10} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-background/50">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept={ACCEPTED_TYPES.join(",")} multiple
            onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-all flex-shrink-0"
            title="Attach files"
          >
            <Paperclip size={16} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your projects, trends, risks…"
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && attachments.length === 0)}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 shadow-sm hover:shadow-md"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function InlineChart({ chart }: { chart: ChartData }) {
  if (chart.type === "table" && chart.headers && chart.rows) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden shadow-sm"
      >
        <p className="text-xs font-bold px-3 py-2.5 bg-muted/50 text-foreground border-b border-border">{chart.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {chart.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-foreground/80">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }

  const data = (chart.labels || []).map((label, i) => ({
    name: label.length > 18 ? label.slice(0, 18) + "…" : label,
    value: chart.values?.[i] ?? 0,
  }));

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border p-4 bg-background shadow-sm"
    >
      <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
        <BarChart3 size={12} className="text-primary" />
        {chart.title}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        {chart.type === "line" ? (
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
}
