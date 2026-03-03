import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InfoExplainer } from "@/components/InfoExplainer";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ReasoningInterrogationProps {
  analysisData: any;
  products: any;
  title: string;
  category: string;
  analysisType: string;
  avgScore: number | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reasoning-interrogation`;

function getQuickActions(analysisData: any): { label: string; question: string }[] {
  const governed = analysisData?.governed || {};
  const hypotheses = governed.root_hypotheses || [];
  const assumptions = governed.reasoning_synopsis?.key_assumptions || [];
  const topHypothesis = hypotheses[0];
  const topAssumption = assumptions[0];

  const actions: { label: string; question: string }[] = [];

  if (topHypothesis) {
    actions.push({
      label: `Why "${topHypothesis.constraint_type}" ranks highest`,
      question: `Why did the "${topHypothesis.constraint_type}" constraint (${topHypothesis.id}) rank as the dominant hypothesis? Break down the dominance score components and explain what evidence supports this ranking over the alternatives.`,
    });
  }

  if (topAssumption) {
    actions.push({
      label: `What if "${topAssumption.assumption?.slice(0, 25)}…" is wrong?`,
      question: `What if this key assumption is wrong: "${topAssumption.assumption}"? Trace the causal chain disruption and identify which conclusions would collapse.`,
    });
  }

  actions.push(
    { label: "What's missing?", question: "What blind spots, unexamined constraints, or missing causal pathways exist in this analysis? Identify the most critical gaps in the evidence base." },
    { label: "Challenge the confidence score", question: "Is the confidence score justified? What specific evidence would need to change to shift it significantly? Are there any assumptions being treated as verified that shouldn't be?" },
  );

  return actions.slice(0, 4);
}

/* ── Chat Messages Sub-component ── */
function ChatMessages({ messages, isLoading, scrollRef }: { messages: Message[]; isLoading: boolean; scrollRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div ref={scrollRef} className="max-h-[420px] overflow-y-auto space-y-3 scroll-smooth">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : ""
            }`}
            style={msg.role === "assistant" ? {
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
            } : undefined}
          >
            {msg.role === "assistant" ? (
              <div className="prose prose-sm max-w-none [&_p]:text-[12px] [&_p]:leading-relaxed [&_li]:text-[12px] [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_code]:text-[11px]">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="rounded-xl px-3.5 py-2.5" style={{ background: "hsl(var(--muted))" }}>
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

export function ReasoningInterrogation({ analysisData, products, title, category, analysisType, avgScore }: ReasoningInterrogationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = getQuickActions(analysisData);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamResponse = useCallback(async (question: string, history: Message[]) => {
    setIsLoading(true);
    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question, history, analysisData, products, title, category, analysisType, avgScore }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `Request failed [${resp.status}]`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsertAssistant = (content: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { role: "assistant", content }];
        });
      };

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
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              upsertAssistant(assistantContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData, products, title, category, analysisType, avgScore]);

  const handleSend = useCallback(async (questionOverride?: string) => {
    const q = questionOverride || input.trim();
    if (!q || isLoading) return;
    if (!questionOverride) setInput("");

    const userMsg: Message = { role: "user", content: q };
    const currentMessages = [...messages];
    setMessages(prev => [...prev, userMsg]);
    await streamResponse(q, currentMessages);
  }, [input, isLoading, messages, streamResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not open — show prominent CTA
  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full group rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:shadow-lg"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "2px solid hsl(var(--primary) / 0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: "hsl(var(--primary) / 0.15)" }}
            >
              <MessageSquare size={16} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-foreground">
                  Challenge This Reasoning
                </span>
                <InfoExplainer explainerKey="reasoning-interrogation" accentColor="hsl(var(--primary))" />
                {messages.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                    {messages.filter(m => m.role === "user").length} questions
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ask questions, challenge assumptions, or request re-evaluation of this analysis
              </p>
            </div>
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
            style={{
              background: "hsl(var(--primary) / 0.08)",
              color: "hsl(var(--primary))",
              border: "1px solid hsl(var(--primary) / 0.15)",
            }}
          >
            Start →
          </div>
        </button>
      </motion.div>
    );
  }

  // Open — full chat panel
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--vi-surface-elevated))",
        border: "1px solid hsl(var(--primary) / 0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <MessageSquare size={13} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-widest text-foreground">
            Challenge This Reasoning
          </span>
          <InfoExplainer explainerKey="reasoning-interrogation" accentColor="hsl(var(--primary))" />
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
              {messages.filter(m => m.role === "user").length}
            </span>
          )}
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-accent/30 transition-colors">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3 pt-3">
        {/* Quick actions — always visible when no messages */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Select a question below or type your own to interrogate this analysis:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.question)}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg text-[11px] font-semibold transition-all hover:shadow-sm disabled:opacity-50"
                  style={{
                    background: "hsl(var(--primary) / 0.05)",
                    color: "hsl(var(--primary))",
                    border: "1px solid hsl(var(--primary) / 0.12)",
                  }}
                >
                  <Zap size={10} className="inline mr-1.5 -mt-0.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat history */}
        {messages.length > 0 && (
          <ChatMessages messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
        )}

        {/* Quick actions after conversation started */}
        {messages.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-1.5">
            {quickActions.slice(0, 2).map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action.question)}
                className="px-2 py-1 rounded-md text-[10px] font-semibold transition-colors hover:bg-accent/50"
                style={{
                  background: "hsl(var(--muted) / 0.5)",
                  color: "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                {action.label.length > 35 ? action.label.slice(0, 33) + "…" : action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2 pt-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the reasoning, challenge assumptions, or request re-evaluation…"
            className="min-h-[40px] max-h-[100px] text-[12px] resize-none bg-background"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 flex-shrink-0"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
