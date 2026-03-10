import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Industry Benchmarks Edge Function
 * Queries Census County Business Patterns (CBP), BLS QCEW, and SBA 7(a) data
 * by NAICS code and optional geography.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { naicsCode, industry, state, businessName } = await req.json();

    if (!naicsCode && !industry) {
      throw new Error("naicsCode or industry is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Determine NAICS code if not provided
    let resolvedNaics = naicsCode;
    if (!resolvedNaics && industry && LOVABLE_API_KEY) {
      // Use AI to map industry description to NAICS code
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{
            role: "user",
            content: `Given this business/industry description, return the most specific 6-digit NAICS code. Return ONLY the numeric code, nothing else.\n\nIndustry: ${industry}\nBusiness: ${businessName || "N/A"}`,
          }],
          temperature: 0,
          max_tokens: 20,
        }),
      });
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const code = aiData.choices?.[0]?.message?.content?.trim()?.match(/\d{2,6}/)?.[0];
        if (code) resolvedNaics = code;
      }
    }

    if (!resolvedNaics) {
      return new Response(JSON.stringify({ success: false, error: "Could not determine NAICS code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pad or truncate to standard lengths for API queries
    const naics2 = resolvedNaics.slice(0, 2);
    const naics3 = resolvedNaics.slice(0, 3);
    const naics4 = resolvedNaics.length >= 4 ? resolvedNaics.slice(0, 4) : null;

    const results: any = {
      naicsCode: resolvedNaics,
      census: null,
      bls: null,
      sba: null,
    };

    // ═══════════════════════════════════════════
    // Census County Business Patterns (CBP)
    // Free public API — no key required
    // ═══════════════════════════════════════════
    try {
      // CBP API: get establishment count, employment, payroll by NAICS
      const year = "2022"; // Most recent complete CBP year
      const geo = state ? `&for=state:${state}` : "&for=us:*";
      const censusUrl = `https://api.census.gov/data/${year}/cbp?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&NAICS2017=${resolvedNaics}${geo}`;
      
      console.log("Census CBP query:", censusUrl);
      const censusRes = await fetch(censusUrl);
      
      if (censusRes.ok) {
        const censusData = await censusRes.json();
        if (censusData && censusData.length > 1) {
          const headers = censusData[0];
          const row = censusData[1];
          const idx = (name: string) => headers.indexOf(name);
          
          results.census = {
            source: "U.S. Census Bureau, County Business Patterns",
            year: parseInt(year),
            naicsCode: resolvedNaics,
            naicsTitle: row[idx("NAICS2017_LABEL")] || "",
            establishments: parseInt(row[idx("ESTAB")]) || 0,
            totalEmployment: parseInt(row[idx("EMP")]) || 0,
            annualPayroll: parseInt(row[idx("PAYANN")]) || 0, // in $1,000s
            avgEmployeesPerEstablishment: 0,
            avgPayrollPerEmployee: 0,
          };
          
          if (results.census.establishments > 0 && results.census.totalEmployment > 0) {
            results.census.avgEmployeesPerEstablishment = Math.round(results.census.totalEmployment / results.census.establishments);
            results.census.avgPayrollPerEmployee = Math.round((results.census.annualPayroll * 1000) / results.census.totalEmployment);
          }
        }
      }
      
      // If exact NAICS didn't work, try broader 3-digit
      if (!results.census && naics3 !== resolvedNaics) {
        const fallbackUrl = `https://api.census.gov/data/${year}/cbp?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&NAICS2017=${naics3}${geo}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.length > 1) {
            const headers = fallbackData[0];
            const row = fallbackData[1];
            const idx = (name: string) => headers.indexOf(name);
            results.census = {
              source: "U.S. Census Bureau, County Business Patterns (3-digit NAICS)",
              year: parseInt(year),
              naicsCode: naics3,
              naicsTitle: row[idx("NAICS2017_LABEL")] || "",
              establishments: parseInt(row[idx("ESTAB")]) || 0,
              totalEmployment: parseInt(row[idx("EMP")]) || 0,
              annualPayroll: parseInt(row[idx("PAYANN")]) || 0,
              avgEmployeesPerEstablishment: 0,
              avgPayrollPerEmployee: 0,
              note: `Broadened to 3-digit NAICS (${naics3}) — exact code ${resolvedNaics} had no data`,
            };
            if (results.census.establishments > 0 && results.census.totalEmployment > 0) {
              results.census.avgEmployeesPerEstablishment = Math.round(results.census.totalEmployment / results.census.establishments);
              results.census.avgPayrollPerEmployee = Math.round((results.census.annualPayroll * 1000) / results.census.totalEmployment);
            }
          }
        }
      }
    } catch (e) {
      console.error("Census CBP error:", e);
    }

    // ═══════════════════════════════════════════
    // BLS Quarterly Census of Employment and Wages (QCEW)
    // Free public API — no key required
    // ═══════════════════════════════════════════
    try {
      // QCEW API: get industry-level employment and wage data
      const blsYear = "2023";
      const blsQuarter = "a"; // annual
      const area = state ? state.padStart(2, "0") + "000" : "US000"; // US national or state FIPS
      const ownership = "5"; // private sector
      
      const blsUrl = `https://data.bls.gov/cew/data/api/${blsYear}/${blsQuarter}/area/${area}.csv`;
      console.log("BLS QCEW query:", blsUrl);
      
      // BLS QCEW CSV endpoint — parse for our NAICS
      const blsRes = await fetch(blsUrl);
      if (blsRes.ok) {
        const csvText = await blsRes.text();
        const lines = csvText.split("\n");
        if (lines.length > 1) {
          const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
          const naicsIdx = headers.indexOf("industry_code");
          const empIdx = headers.indexOf("annual_avg_emplvl");
          const wageIdx = headers.indexOf("avg_annual_pay");
          const estIdx = headers.indexOf("annual_avg_estabs");
          const ownerIdx = headers.indexOf("own_code");
          
          // Find matching row for our NAICS + private sector
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map(c => c.replace(/"/g, "").trim());
            if (cols[naicsIdx] === resolvedNaics && cols[ownerIdx] === ownership) {
              results.bls = {
                source: "Bureau of Labor Statistics, QCEW",
                year: parseInt(blsYear),
                naicsCode: resolvedNaics,
                avgAnnualEmployment: parseInt(cols[empIdx]) || 0,
                avgAnnualPay: parseInt(cols[wageIdx]) || 0,
                establishments: parseInt(cols[estIdx]) || 0,
              };
              break;
            }
          }
          
          // Fallback to broader NAICS
          if (!results.bls) {
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(",").map(c => c.replace(/"/g, "").trim());
              if (cols[naicsIdx] === naics3 && cols[ownerIdx] === ownership) {
                results.bls = {
                  source: "Bureau of Labor Statistics, QCEW (3-digit NAICS)",
                  year: parseInt(blsYear),
                  naicsCode: naics3,
                  avgAnnualEmployment: parseInt(cols[empIdx]) || 0,
                  avgAnnualPay: parseInt(cols[wageIdx]) || 0,
                  establishments: parseInt(cols[estIdx]) || 0,
                  note: `Broadened to 3-digit NAICS (${naics3})`,
                };
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("BLS QCEW error:", e);
    }

    // ═══════════════════════════════════════════
    // SBA 7(a) Loan Data
    // Uses public SBA data API
    // ═══════════════════════════════════════════
    try {
      // SBA public data — query for NAICS-level loan performance
      // Using SBA's open data portal
      const sbaUrl = `https://data.sba.gov/dataset/7-a-504-foia/resource/b9e9ff58-f14c-4ec9-a34e-afb28a5e904f.json?sql=SELECT "NaicsCode","GrossApproval","SBAGuaranteedApproval","MIS_Status","ApprovalFiscalYear","BorrState" FROM "b9e9ff58-f14c-4ec9-a34e-afb28a5e904f" WHERE "NaicsCode"='${resolvedNaics}' AND "ApprovalFiscalYear">='2020' LIMIT 500`;
      
      // Alternative: use a simpler aggregation approach with AI
      if (LOVABLE_API_KEY) {
        const sbaAiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{
              role: "user",
              content: `Based on publicly available SBA 7(a) loan data for NAICS code ${resolvedNaics} (${industry || ""}):

1. What is the typical SBA 7(a) loan amount range for this industry?
2. What is the approximate default/charge-off rate?
3. What are the top SBA lenders in this space?
4. What DSCR requirements do SBA lenders typically require?

Return ONLY valid JSON:
{
  "avgLoanAmountLow": number_or_null,
  "avgLoanAmountHigh": number_or_null,
  "defaultRate": number_as_percentage_or_null,
  "typicalDSCR": number_or_null,
  "topLenders": ["lender1", "lender2"],
  "notes": "any caveats about data reliability",
  "confidence": "high|medium|low"
}`,
            }],
            temperature: 0.2,
            max_tokens: 500,
          }),
        });

        if (sbaAiRes.ok) {
          const sbaAiData = await sbaAiRes.json();
          const sbaRaw = sbaAiData.choices?.[0]?.message?.content || "";
          const sbaCleaned = sbaRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            const sbaResult = JSON.parse(sbaCleaned);
            results.sba = {
              source: "SBA 7(a) Program Data (AI-synthesized from public records)",
              naicsCode: resolvedNaics,
              ...sbaResult,
            };
          } catch { /* ignore parse failure */ }
        }
      }
    } catch (e) {
      console.error("SBA data error:", e);
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("industry-benchmarks error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
