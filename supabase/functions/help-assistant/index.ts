import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a concise, expert assistant for an AI-powered product & business analysis platform. Users navigate through steps: Intelligence Report, Disrupt, Redesign, Stress Test, and Pitch Deck.

Your job:
- Answer questions about the current step or section they're viewing
- Explain what metrics, scores, and insights mean
- Suggest what to do next based on their analysis results
- Keep answers to 2-4 sentences max unless they ask for detail
- Use a confident, strategic tone — like a senior analyst briefing an executive
- If asked about features you don't know about, say so honestly

Context about the platform:
- Revival Score: 0-100 rating of a product's potential for reinvention
- Stress Test: Red Team (challenges) vs Green Team (defenses) debate
- Disrupt: Flips assumptions to find innovation angles
- Intelligence Report: Market data, pricing, supply chain, user journey
- Pitch Deck: Auto-generated investor presentation
- Business Mode: Analyzes entire business models instead of individual products`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, stream: useStream = true, structured = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextNote = context
      ? `\n\nThe user is currently viewing: ${context.step || "unknown step"}${context.section ? ` → ${context.section}` : ""}${context.mode ? ` (${context.mode} mode)` : ""}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: structured ? "google/gemini-2.5-flash" : useStream ? "google/gemini-2.5-flash-lite" : "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextNote },
          ...messages,
        ],
        stream: useStream,
        ...(structured ? { max_tokens: 6000 } : {}),
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Non-streaming: extract reply and return JSON
    if (!useStream) {
      const result = await response.json();
      const reply = result.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("help-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
