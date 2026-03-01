import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, X, BarChart3, Loader2 } from "lucide-react";
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

interface Message {
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
}

const QUICK_PROMPTS = [
  "Compare my top 3 projects",
  "What regulatory risks should I watch?",
  "Which category has the highest scores?",
  "Show my analysis trend over time",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workspace-query`;

export function WorkspaceExplorer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const send = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: "user", content: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ question, history }),
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
            // Handle text content
            if (delta?.content) {
              assistantText += delta.content;
              updateAssistant();
            }

            // Handle tool calls
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

            // If finish_reason is tool_calls or stop, try to parse accumulated tool call
            if (choice.finish_reason === "tool_calls" || (choice.finish_reason === "stop" && inToolCall)) {
              if (toolCallArgs) {
                try {
                  const chartData = JSON.parse(toolCallArgs);
                  charts.push(chartData);
                  inToolCall = false;
                  toolCallArgs = "";
                  updateAssistant();
                } catch { /* partial, will complete */ }
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush for any remaining tool call data
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
  }, [messages, loading]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <p className="typo-section-title text-foreground">Intelligence Explorer</p>
            <p className="typo-card-meta text-foreground/60">Ask anything about your projects and market data</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setExpanded(false); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/50">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
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
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-xl rounded-br-sm max-w-[80%] typo-card-body">
                  {msg.content}
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

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your projects, trends, risks…"
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 typo-card-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
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
