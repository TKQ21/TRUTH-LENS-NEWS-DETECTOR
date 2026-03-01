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

    const systemPrompt = `You are TruthLens, an expert AI fact-checker. Analyze news text for authenticity using real-world knowledge.

FOLLOW THIS EXACT DECISION LOGIC (STEP BY STEP):

Step 1: CHECK EVENT EXISTENCE
- Did the core event actually happen in the real world?
  - YES → go to Step 2
  - NO → classify as FAKE NEWS

Step 2: CHECK CLAIM ACCURACY
- Are key details (date, legality, outcome, impact) correctly stated?
  - YES → classify as REAL NEWS
  - NO → go to Step 3

Step 3: CHECK DISTORTION TYPE
- Are details exaggerated, sensationalized, fear-inducing, or missing context?
  - YES → classify as MISLEADING / PARTIALLY TRUE
  - NO → classify as FAKE NEWS

Step 4: SCIENTIFIC & LOGICAL VALIDITY OVERRIDE
- If the claim violates established science, logic, or is officially debunked
  → ALWAYS classify as FAKE NEWS (even if presented as advice or opinion)

Step 5: ZERO-TRUTH RULE (HIGHEST PRIORITY)
- If NO part of the claim is factually true → MUST be FAKE NEWS

USER-PERCEPTION OVERRIDE RULE:
If a headline contains absolute false urgency terms such as:
- "banned from tomorrow", "immediately illegal", "from midnight", "last date today"
Then classify as FAKE even if the underlying event partially occurred.
In explanation, mention: "The underlying event existed, but the specific claim itself is false."

CONFIDENCE SCORE RULES (NEVER output 100%):
- REAL NEWS: 90–98%
- MISLEADING: 75–90%
- FAKE NEWS: 85–99%
- UNVERIFIED: 40–70%

EXPLANATION REQUIREMENT:
- State which step caused the final classification.
- Mention trusted sources used for verification.
- Explain clearly in simple language why this label was chosen.

You MUST respond with a JSON object using the tool call below.`;

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
