import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircleQuestion, X, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HelpAssistantPanelProps {
  context?: {
    step?: string;
    section?: string;
    mode?: string;
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-assistant`;

export function HelpAssistantPanel({ context }: HelpAssistantPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: updatedMessages, context }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "Failed to get response");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let done = false;
      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Assistant error:", e);
      toast.error("Failed to connect to assistant");
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What should I focus on in this step?",
    "Explain the key metrics here",
    "What do I do next?",
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        style={{
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        }}
        aria-label="Help assistant"
      >
        {open ? <X size={20} /> : <MessageCircleQuestion size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-[360px] max-h-[520px] rounded-xl overflow-hidden flex flex-col"
          style={{
            background: "hsl(var(--background))",
            border: "1.5px solid hsl(var(--border))",
            boxShadow: "0 20px 60px -15px hsl(var(--foreground) / 0.2)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center gap-2.5 flex-shrink-0"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <Bot size={18} />
            <div>
              <p className="text-sm font-bold leading-tight">Assistant</p>
              <p className="text-[10px] opacity-80">
                {context?.step ? `Viewing: ${context.step}` : "Ask anything about the platform"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
            {messages.length === 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Ask me anything about this step or the platform
                </p>
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--foreground))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
                  >
                    <Bot size={12} />
                  </div>
                )}
                <div
                  className="max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                        }
                      : {
                          background: "hsl(var(--muted))",
                          color: "hsl(var(--foreground))",
                        }
                  }
                >
                  {msg.content}
                  {msg.role === "assistant" && isStreaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-60 animate-pulse" />
                  )}
                </div>
                {msg.role === "user" && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                  >
                    <User size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div
            className="p-3 flex-shrink-0 flex items-end gap-2"
            style={{ borderTop: "1px solid hsl(var(--border))" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              className="flex-1 text-xs resize-none rounded-lg px-3 py-2 focus:outline-none focus:ring-1"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                maxHeight: "80px",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
