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

    const prompt = `Product concept mockup image: "${ideaName}" — inspired by the classic product "${productName}". 
Visual style: ${visualNotes || description}. 
Create a clean, professional product concept render. Show the physical product in a lifestyle or studio context. 
Modern redesign aesthetic, high quality render, white or gradient background, commercial product photography style.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("Image generation error:", response.status, txt.slice(0, 300));

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Image generation failed: ${response.status} ${txt.slice(0, 200)}`);
    }

    const data = await response.json();

    // Extract base64 image from response
    const message = data.choices?.[0]?.message;
    let base64Url: string | null = message?.images?.[0]?.image_url?.url || null;

    // Also check content array format
    if (!base64Url && Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          base64Url = part.image_url.url;
          break;
        }
      }
    }

    if (!base64Url) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image returned from AI.");
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
  } catch (err) {
    console.error("generate-product-visual error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
