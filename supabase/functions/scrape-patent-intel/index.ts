import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATENT_CATEGORIES = [
  { keyword: "solid state battery", category: "Energy Storage" },
  { keyword: "AI tutoring education", category: "EdTech" },
  { keyword: "portable espresso machine", category: "Consumer Electronics" },
  { keyword: "modular housing construction", category: "Real Estate Tech" },
  { keyword: "pet health supplement", category: "Pet Care" },
  { keyword: "micro SaaS platform", category: "Micro-SaaS" },
  { keyword: "sustainable textile manufacturing", category: "Sustainable Fashion" },
  { keyword: "fitness wearable sensor", category: "Fitness Tech" },
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

    // Scrape Google Patents for each category
    for (const { keyword, category } of PATENT_CATEGORIES) {
      try {
        const searchUrl = `https://patents.google.com/?q=${encodeURIComponent(keyword)}&oq=${encodeURIComponent(keyword)}&sort=new`;
        
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeRes.ok) {
          console.error(`Scrape failed for ${category}: ${scrapeRes.status}`);
          continue;
        }

        const scrapeData = await scrapeRes.json();
        const markdown = scrapeData?.data?.markdown || "";

        if (!markdown || markdown.length < 100) {
          console.log(`No meaningful content for ${category}, using search fallback`);
          // Fallback: use Firecrawl search for patent info
          const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `${keyword} patent filing 2024 2025 USPTO`,
              limit: 5,
            }),
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const results = searchData?.data || [];
            
            // Use AI to extract structured patent data from search results
            const extractPrompt = `Extract patent filing information from these search results about "${keyword}" patents. Return ONLY a valid JSON array of patents:
[{"title":"Patent Title","assignee":"Company Name","filing_date":"YYYY-MM-DD","patent_number":"US...","abstract":"One sentence summary","source_url":"https://..."}]

Search results:
${results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ""}\nContent: ${(r.markdown || "").substring(0, 500)}`).join("\n---\n")}

Return 3-5 patents maximum. Only include patents with real titles and assignees you can verify from the text. If you cannot find real patent data, return an empty array [].`;

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
                max_tokens: 3000,
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
                  allPatents.push({ ...p, category, scraped_at: new Date().toISOString() });
                }
              } catch { console.error(`JSON parse failed for ${category}`); }
            }
          }
          continue;
        }

        // Parse the scraped Google Patents markdown with AI
        const parsePrompt = `Extract real patent filing data from this Google Patents search results page for "${keyword}". Return ONLY a valid JSON array:
[{"title":"Patent Title","assignee":"Company Name","filing_date":"YYYY-MM-DD","patent_number":"US...","abstract":"One sentence summary","source_url":"https://patents.google.com/patent/..."}]

Content:
${markdown.substring(0, 4000)}

Extract up to 8 real patents. Only include entries where you can identify a real title and patent number from the text. If data is unclear, skip that entry. Return empty array [] if nothing is extractable.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: parsePrompt }],
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
              allPatents.push({ ...p, category, scraped_at: new Date().toISOString() });
            }
          } catch { console.error(`JSON parse failed for ${category}`); }
        }
      } catch (err) {
        console.error(`Error processing ${category}:`, err);
      }
    }

    // Clear old patent data and insert new
    if (allPatents.length > 0) {
      await supabase.from("patent_filings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const rows = allPatents.map((p) => ({
        title: p.title || "Untitled",
        assignee: p.assignee || "Unknown",
        filing_date: p.filing_date || null,
        publication_date: p.publication_date || null,
        patent_number: p.patent_number || null,
        category: p.category,
        abstract: p.abstract || null,
        source_url: p.source_url || null,
        scraped_at: p.scraped_at,
      }));

      const { error } = await supabase.from("patent_filings").insert(rows);
      if (error) throw new Error(`Patent insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, patents: allPatents.length }), {
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
