/**
 * POSE ANOTHER HYPOTHESIS — Interactive Panel
 * Similar to Challenge This Reasoning but focused on proposing new structural hypotheses.
 * Supports streaming responses and revision application.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Send, Loader2, X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Revision {
  type: "new_hypothesis";
  payload: Record<string, unknown>;
}

interface HypothesisInterrogationProps {
  analysisData: any;
  title: string;
  category: string;
  onApplyRevision?: (revision: Revision) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hypothesis-interrogation`;

function getQuickActions(analysisData: any): { label: string; question: string }[] {
  const governed = analysisData?.governed || {};
  const hypotheses = governed.root_hypotheses || [];
  const actions: { label: string; question: string }[] = [];

  if (hypotheses.length > 0) {
    actions.push({
      label: "What's being overlooked?",
      question: "Are there structural constraints in this analysis that the current hypotheses don't capture? What root cause might be hiding beneath the surface?",
    });
  }

  actions.push(
    { label: "What if the real bottleneck is trust?", question: "Could the real binding constraint be trust or credibility rather than the identified constraints? What evidence supports or contradicts a trust-based root hypothesis?" },
    { label: "Is there a timing constraint?", question: "Could time-to-market or timing be the dominant structural constraint here? Evaluate whether the current hypotheses underweight temporal factors." },
    { label: "Challenge the top hypothesis", question: `The top-ranked hypothesis may be a symptom, not a root cause. What deeper structural issue could be generating the pattern we see?` },
  );

  return actions.slice(0, 4);
}

function extractRevisions(content: string): Revision[] {
  const revisions: Revision[] = [];
  // Match ```:::revision ... ``` OR :::revision ... (without backticks)
  const patterns = [
    /```:::revision\s*\n([\s\S]*?)```/g,
    /:::revision\s*\n([\s\S]*?)(?=\n\n|\n[A-Z]|\n\*\*|$)/g,
  ];
  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed.type && parsed.payload) revisions.push(parsed as Revision);
      } catch { /* ignore */ }
    }
    if (revisions.length > 0) break;
  }
  return revisions;
}

function stripRevisionBlocks(content: string): string {
  return content
    .replace(/```:::revision\s*\n[\s\S]*?```/g, "")
    .replace(/:::revision\s*\n\{[\s\S]*?\n\}/g, "")
    .replace(/:::revision[\s\S]*$/g, "")
    .trim();
}

function RevisionCard({ revision, onApply, applied }: { revision: Revision; onApply: () => void; applied: boolean }) {
  return (
    <div
      className="rounded-xl p-3 mt-2"
      style={{
        background: applied ? "hsl(152 60% 40% / 0.06)" : "hsl(var(--primary) / 0.06)",
        border: `1.5px solid ${applied ? "hsl(152 60% 40% / 0.25)" : "hsl(var(--primary) / 0.2)"}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RotateCcw size={11} style={{ color: applied ? "hsl(152 60% 35%)" : "hsl(var(--primary))" }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: applied ? "hsl(152 60% 35%)" : "hsl(var(--primary))" }}>
            Add New Hypothesis
          </span>
        </div>
        {applied ? (
          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "hsl(152 60% 35%)" }}>
            <Check size={10} /> Applied
          </span>
        ) : (
          <Button size="sm" onClick={onApply} className="h-7 px-3 text-[10px] font-bold">
            Apply This
          </Button>
        )}
      </div>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  const sections = useMemo(() => {
    const lines = content.split("\n").filter(l => l.trim());
    const result: { type: "heading" | "labeled" | "text" | "bullet"; label?: string; text: string }[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      const boldLabelMatch = trimmed.match(/^\*\*(.+?)[:]\*\*\s*(.*)/);
      const headingMatch = trimmed.match(/^#{1,3}\s+(.*)/);
      const bulletMatch = trimmed.match(/^[-•*]\s+(.*)/);
      if (headingMatch) result.push({ type: "heading", text: headingMatch[1] });
      else if (boldLabelMatch) result.push({ type: "labeled", label: boldLabelMatch[1], text: boldLabelMatch[2] || "" });
      else if (bulletMatch) result.push({ type: "bullet", text: bulletMatch[1] });
      else result.push({ type: "text", text: trimmed });
    }
    return result;
  }, [content]);

  if (sections.length <= 2 && !sections.some(s => s.type === "labeled")) {
    return (
      <div className="prose prose-sm max-w-none [&_p]:text-[12px] [&_p]:leading-relaxed [&_li]:text-[12px] [&_strong]:text-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((s, i) => {
        if (s.type === "heading") return <p key={i} className="text-[12px] font-bold text-foreground">{s.text}</p>;
        if (s.type === "labeled") return (
          <div key={i} className="rounded-lg px-3 py-2" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.5)" }}>
            <span className="text-[9px] font-extrabold uppercase tracking-widest mr-2" style={{ color: "hsl(var(--primary))" }}>{s.label}</span>
            <span className="text-[11px] text-foreground leading-relaxed">{s.text}</span>
          </div>
        );
        if (s.type === "bullet") return (
          <div key={i} className="flex items-start gap-2 pl-1">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.5)" }} />
            <span className="text-[11px] text-foreground leading-relaxed">{s.text}</span>
          </div>
        );
        return <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">{s.text}</p>;
      })}
    </div>
  );
}

export function HypothesisInterrogation({ analysisData, title, category, onApplyRevision }: HypothesisInterrogationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedRevisions, setAppliedRevisions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = getQuickActions(analysisData);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
        body: JSON.stringify({ question, history, analysisData, title, category }),
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
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
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
            if (delta) { assistantContent += delta; upsertAssistant(assistantContent); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData, title, category]);

  const handleSend = useCallback(async (questionOverride?: string) => {
    const q = questionOverride || input.trim();
    if (!q || isLoading) return;
    if (!questionOverride) setInput("");
    const userMsg: Message = { role: "user", content: q };
    const currentMessages = [...messages];
    setMessages(prev => [...prev, userMsg]);
    await streamResponse(q, currentMessages);
  }, [input, isLoading, messages, streamResponse]);

  const handleApplyRevision = useCallback((revision: Revision, msgIndex: number) => {
    const revKey = `${msgIndex}-0`;
    setAppliedRevisions(prev => { const next = new Set(prev); next.add(revKey); return next; });
    if (onApplyRevision) {
      onApplyRevision(revision);
      toast.success("New hypothesis added — downstream steps will update");
    }
  }, [onApplyRevision]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isOpen) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full group rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:shadow-lg"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "2px solid hsl(var(--primary) / 0.25)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: "hsl(var(--primary) / 0.15)" }}>
              <Lightbulb size={16} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="text-left">
              <span className="text-[13px] font-bold text-foreground">Pose Another Hypothesis</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Suggest a new structural angle the system may have missed
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-lg transition-colors group-hover:bg-primary/10" style={{ color: "hsl(var(--primary))" }}>
            Open
          </span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--primary) / 0.04)",
        border: "2px solid hsl(var(--primary) / 0.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.12)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
            <Lightbulb size={15} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <span className="text-[13px] font-bold text-foreground">Pose Another Hypothesis</span>
            <p className="text-[10px] text-muted-foreground">What structural constraint might be missing?</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Quick actions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => handleSend(a.question)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  background: "hsl(var(--card))",
                  border: "1.5px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto space-y-3 scroll-smooth">
            {messages.map((msg, i) => {
              const revisions = msg.role === "assistant" ? extractRevisions(msg.content) : [];
              const displayContent = msg.role === "assistant" ? stripRevisionBlocks(msg.content) : msg.content;
              return (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}
                      style={msg.role === "assistant" ? { background: "hsl(var(--muted))", color: "hsl(var(--foreground))" } : undefined}
                    >
                      {msg.role === "assistant" ? <AssistantMessage content={displayContent} /> : displayContent}
                    </div>
                    {revisions.map((rev, ri) => {
                      const revKey = `${i}-${ri}`;
                      return <RevisionCard key={revKey} revision={rev} applied={appliedRevisions.has(revKey)} onApply={() => handleApplyRevision(rev, i)} />;
                    })}
                  </div>
                </div>
              );
            })}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-xl px-3.5 py-2.5" style={{ background: "hsl(var(--muted))" }}>
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a hypothesis you think is missing..."
            className="min-h-[40px] max-h-[120px] resize-none text-[12px] rounded-lg flex-1"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 rounded-lg shrink-0"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
