import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

function systemPrompt(locale: string, context?: string) {
  const lang = locale === "sv" ? "Swedish" : "English";
  return [
    "You are Empire Marine AI, an expert marine assistant for recreational boaters in Scandinavia.",
    "You help with weather assessment, route planning, fuel estimation, engine maintenance, seamanship, safety and fishing.",
    "Be concise, practical and safety-first. Use metric units, knots and nautical miles.",
    "If conditions sound dangerous, clearly advise caution.",
    `Always answer in ${lang}.`,
    context ? `Current context:\n${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { messages, locale = "sv", context } = (await req.json()) as {
      messages: Msg[];
      locale?: string;
      context?: string;
    };

    const system = systemPrompt(locale, context);
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Use correct Gemini model
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        key,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error("Gemini API error:", error);
      return NextResponse.json(
        { error: `Gemini API error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    
    // Extract text from Gemini response
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    // Return as plain text
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("AI Chat Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process request: ${message}` },
      { status: 500 }
    );
  }
}
