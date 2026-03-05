import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ideaName, description, visualNotes, productName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Generate a product concept image: a modern redesign of "${productName}" called "${ideaName}". 
Style: clean commercial product photography, studio lighting, white or soft gradient background. 
${visualNotes ? `Visual details: ${visualNotes}` : ""}
Show only the physical product, no text overlays.`;

    // Helper to call the image model and extract the base64 URL
    async function callImageModel(p: string): Promise<string | null> {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: p }],
          modalities: ["image", "text"],
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Image generation error:", resp.status, txt.slice(0, 300));
        if (resp.status === 429) throw { status: 429, msg: "Rate limit exceeded. Please try again in a moment." };
        if (resp.status === 402) throw { status: 402, msg: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." };
        throw new Error(`Image generation failed: ${resp.status}`);
      }

      const d = await resp.json();
      const message = d.choices?.[0]?.message;

      // Check images array first
      let url: string | null = message?.images?.[0]?.image_url?.url || null;

      // Check content array format
      if (!url && Array.isArray(message?.content)) {
        for (const part of message.content) {
          if (part.type === "image_url" && part.image_url?.url) {
            url = part.image_url.url;
            break;
          }
        }
      }

      return url;
    }

    // Try twice — retry with simpler prompt if first attempt returns no image
    let base64Url = await callImageModel(prompt);
    if (!base64Url) {
      console.warn("First attempt returned no image, retrying with simplified prompt...");
      base64Url = await callImageModel(
        `Generate an image of a modern product concept called "${ideaName}". Clean studio product photography, white background.`
      );
    }

    if (!base64Url) {
      console.error("No image after retry");
      throw new Error("No image returned from AI. The model may be temporarily unable to generate images — please try again.");
    }

    // Upload to Supabase storage for a permanent URL
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Extract raw base64 data
      const base64Match = base64Url.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (base64Match) {
        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const rawBase64 = base64Match[2];
        const binaryData = Uint8Array.from(atob(rawBase64), c => c.charCodeAt(0));

        const fileName = `visuals/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-visuals")
          .upload(fileName, binaryData, {
            contentType: `image/${base64Match[1]}`,
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("product-visuals")
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            return new Response(JSON.stringify({ success: true, imageUrl: urlData.publicUrl }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          console.warn("Storage upload failed, falling back to base64:", uploadError.message);
        }
      }
    } catch (storageErr) {
      console.warn("Storage upload error, falling back to base64:", storageErr);
    }

    // Fallback: return base64 directly
    return new Response(JSON.stringify({ success: true, imageUrl: base64Url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-product-visual error:", err);
    // Handle structured rate-limit / credit errors
    if (err && typeof err === "object" && err.status && err.msg) {
      return new Response(JSON.stringify({ error: err.msg }), {
        status: err.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
