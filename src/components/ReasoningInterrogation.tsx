import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
      label: `Why does "${topHypothesis.constraint_type}" rank highest?`,
      question: `Why did the "${topHypothesis.constraint_type}" constraint (${topHypothesis.id}) rank as the dominant hypothesis? Break down the dominance score components and explain what evidence supports this ranking over the alternatives.`,
    });
  }

  if (topAssumption) {
    actions.push({
      label: `What if "${topAssumption.assumption?.slice(0, 30)}…" is wrong?`,
      question: `What if this key assumption is wrong: "${topAssumption.assumption}"? Trace the causal chain disruption and identify which conclusions would collapse.`,
    });
  }

  actions.push(
    { label: "What's missing from this analysis?", question: "What blind spots, unexamined constraints, or missing causal pathways exist in this analysis? Identify the most critical gaps in the evidence base." },
    { label: "Challenge the confidence score", question: "Is the confidence score justified? What specific evidence would need to change to shift it significantly? Are there any assumptions being treated as verified that shouldn't be?" },
  );

  return actions.slice(0, 4);
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
    setMessages(prev => [...prev, userMsg]);
    await streamResponse(q, [...messages, userMsg].filter(m => m.role !== "user" || m.content !== q).concat([]));
  }, [input, isLoading, messages, streamResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--vi-surface-elevated))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--vi-glow-mechanism) / 0.12)" }}>
            <MessageSquare size={11} style={{ color: "hsl(var(--vi-glow-mechanism))" }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Challenge This Reasoning
          </span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
              {messages.filter(m => m.role === "user").length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              {/* Quick actions */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action.question)}
                      disabled={isLoading}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-accent/50 disabled:opacity-50"
                      style={{
                        background: "hsl(var(--vi-glow-mechanism) / 0.06)",
                        color: "hsl(var(--vi-glow-mechanism))",
                        border: "1px solid hsl(var(--vi-glow-mechanism) / 0.15)",
                      }}
                    >
                      <Zap size={9} className="inline mr-1" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat history */}
              {messages.length > 0 && (
                <div ref={scrollRef} className="max-h-[400px] overflow-y-auto space-y-3 pt-3 scroll-smooth">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                        style={msg.role === "assistant" ? {
                          background: "hsl(var(--muted))",
                          color: "hsl(var(--foreground))",
                        } : undefined}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none [&_p]:text-[11px] [&_p]:leading-relaxed [&_li]:text-[11px] [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_code]:text-[10px]">
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
                      <div className="rounded-xl px-3 py-2" style={{ background: "hsl(var(--muted))" }}>
                        <Loader2 size={12} className="animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick actions after conversation started */}
              {messages.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.slice(0, 2).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action.question)}
                      className="px-2 py-1 rounded-md text-[9px] font-semibold transition-colors hover:bg-accent/50"
                      style={{
                        background: "hsl(var(--vi-glow-mechanism) / 0.04)",
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
                  className="min-h-[36px] max-h-[100px] text-[11px] resize-none bg-background"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 flex-shrink-0"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
