import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Broad patent searches — recent filings across industries, not locked to categories
const PATENT_SEARCHES = [
  { query: "patent filed this week new invention 2025 2026", label: "Recent filings" },
  { query: "new patent application consumer product 2025 2026 USPTO", label: "Consumer products" },
  { query: "patent filed technology innovation hardware software 2025 2026", label: "Technology" },
  { query: "patent application health wellness biotech 2025 2026", label: "Health & Biotech" },
  { query: "new patent sustainable energy green technology 2025 2026", label: "Sustainability" },
  { query: "patent filing ecommerce retail logistics 2025 2026", label: "Commerce & Logistics" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const allPatents: any[] = [];

    for (const { query, label } of PATENT_SEARCHES) {
      try {
        // Use Firecrawl search to find recent patent filings
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${query} site:patents.google.com OR site:USPTO.gov`,
            limit: 8,
          }),
        });

        if (!searchRes.ok) {
          console.error(`Search failed for ${label}: ${searchRes.status}`);
          continue;
        }

        const searchData = await searchRes.json();
        const results = searchData?.data || [];

        if (results.length === 0) {
          console.log(`No results for ${label}`);
          continue;
        }

        const extractPrompt = `Extract real patent filing information from these search results. Return ONLY a valid JSON array:
[{"title":"Patent Title","assignee":"Company Name","filing_date":"YYYY-MM-DD","patent_number":"US...","abstract":"One sentence summary","source_url":"https://...","category":"Short Category Name","status":"active"}]

Search results:
${results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ""}\nContent: ${(r.markdown || "").substring(0, 600)}`).join("\n---\n")}

Rules:
- Extract up to 6 patents maximum
- Assign a short category (2-3 words, e.g. "Energy Storage", "Consumer Electronics", "Digital Health", "Food Tech", "AI & ML", etc.) based on the patent content
- Set status to "expired" if the text clearly indicates it's expired/lapsed, otherwise "active"
- Only include patents with real titles and assignees you can verify from the text
- Return empty array [] if nothing is extractable`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: extractPrompt }],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData.choices?.[0]?.message?.content || "[]";
          const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            let patents = JSON.parse(cleaned);
            if (!Array.isArray(patents)) patents = patents.patents || patents.data || [];
            for (const p of patents) {
              allPatents.push({ ...p, scraped_at: new Date().toISOString() });
            }
          } catch { console.error(`JSON parse failed for ${label}`); }
        }
      } catch (err) {
        console.error(`Error processing ${label}:`, err);
      }
    }

    // Deduplicate by patent_number
    const seen = new Set<string>();
    const dedupedPatents = allPatents.filter((p) => {
      const key = p.patent_number || p.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Clear old and insert new
    if (dedupedPatents.length > 0) {
      await supabase.from("patent_filings").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = dedupedPatents.map((p) => ({
        title: p.title || "Untitled",
        assignee: p.assignee || "Unknown",
        filing_date: p.filing_date || null,
        publication_date: p.publication_date || null,
        patent_number: p.patent_number || null,
        category: p.category || "General",
        abstract: p.abstract || null,
        source_url: p.source_url || null,
        status: p.status || "active",
        scraped_at: p.scraped_at,
      }));

      const { error } = await supabase.from("patent_filings").insert(rows);
      if (error) throw new Error(`Patent insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, patents: dedupedPatents.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Patent scraping error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
