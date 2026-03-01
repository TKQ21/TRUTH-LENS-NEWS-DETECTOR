import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Please provide news text to verify." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are TruthLens, an expert AI fact-checker and news verification assistant. Your job is to analyze news text and determine its authenticity based on your knowledge of real-world events, known misinformation patterns, and journalistic standards.

CRITICAL CLASSIFICATION RULES (YOU MUST FOLLOW STRICTLY):

1. FAKE NEWS (status: "fake"):
   - The CORE claim is factually false OR scientifically disproven
   - OR no credible authority supports the claim
   - OR the claim has been officially debunked by fact-checkers
   - Examples: "Hot water cures COVID-19", "Secret AI village without internet"
   - Confidence range: 85-99% (NEVER 100%)

2. MISLEADING / PARTIALLY TRUE (status: "misleading"):
   - The core event DID actually happen in the real world
   - BUT details are exaggerated, distorted, missing context, or use fear-inducing language
   - Uses clickbait, panic language, or half-truth framing
   - Example: "₹2000 notes banned from tomorrow" (notes were phased out but not overnight)
   - Confidence range: 75-90%

3. REAL NEWS (status: "real"):
   - Verified by multiple trusted sources
   - Facts are accurate and correctly framed
   - Confidence range: 90-98% (NEVER 100%)

4. UNVERIFIED (status: "unverified"):
   - You genuinely cannot determine the truth from your knowledge
   - Not enough information to classify

PRIORITY RULE (VERY IMPORTANT - YOU MUST FOLLOW):
- If ANY part of the claim is TRUE or based on a real event → it CANNOT be marked as "fake". Use "misleading" instead.
- If ZERO part of the claim is TRUE and the entire claim is fabricated → it MUST be marked as "fake".
- NEVER confuse fake with misleading. A misleading claim has some truth; a fake claim has NO truth.
- NEVER mark a real news as fake or a fake news as real. Be accurate.

ADDITIONAL RULES:
- You MUST check against your knowledge of real-world events, people, dates, and facts.
- Be honest and thorough. Explain your reasoning clearly in simple language.
- In your explanation, clearly state WHY you chose the specific label.
- NEVER output 100% confidence for any classification.

You MUST respond with a JSON object using this exact tool call.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze the following news and determine if it is real, misleading, fake, or unverified based on real-world facts:\n\n"${text.slice(0, 3000)}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_verification",
              description: "Report the news verification result with structured data.",
              parameters: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["real", "misleading", "fake", "unverified"],
                    description: "The authenticity status of the news.",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0 to 100.",
                  },
                  explanation: {
                    type: "string",
                    description: "A clear, simple explanation of why this news is classified this way. Reference real-world facts.",
                  },
                  suspiciousElements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of suspicious elements found in the text (clickbait language, emotional manipulation, etc). Empty array if none.",
                  },
                  matchedSources: {
                    type: "array",
                    items: { type: "string" },
                    description: "Names of trusted sources that confirm or relate to this news (e.g. 'Reuters', 'BBC', 'WHO'). Empty array if none.",
                  },
                  missingFacts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key facts that are missing, manipulated or incorrect in the text. Empty array if none.",
                  },
                },
                required: ["status", "confidence", "explanation", "suspiciousElements", "matchedSources", "missingFacts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_verification" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI returned unexpected format");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-news error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
