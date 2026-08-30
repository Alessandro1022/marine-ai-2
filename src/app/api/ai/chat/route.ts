import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // ASSUMPTION: server-side Supabase client using next/headers cookies — confirm this path exists
import { AI_TOOL_DECLARATIONS, SERVER_TOOL_NAMES, CLIENT_TOOL_NAMES } from "@/lib/ai/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

function systemPrompt(locale: string, context?: string) {
  const lang = locale === "sv" ? "Swedish" : "English";
  return [
    "You are Empire Marine AI, an expert marine assistant for recreational boaters in Scandinavia.",
    "You help with weather assessment, route planning, fuel estimation, engine maintenance, seamanship, safety and fishing.",
    "You can also call tools to look up the user's trip history, search marinas, or perform actions like starting a trip or changing the map.",
    "Be concise, practical and safety-first. Use metric units, knots and nautical miles.",
    "If conditions sound dangerous, clearly advise caution.",
    `Always answer in ${lang}.`,
    context ? `Current context:\n${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function execServerTool(
  name: string,
  args: Record<string, unknown>,
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string
) {
  if (name === "get_trip_history") {
    let query = supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("trip_date", { ascending: false });
    if (typeof args.since === "string") query = query.gte("trip_date", args.since);
    query = query.limit(typeof args.limit === "number" ? args.limit : 10);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { trips: data ?? [] };
  }
  if (name === "search_marinas") {
    const { data, error } = await supabase
      .from("marinas")
      .select("*")
      .ilike("name", `%${args.query}%`)
      .limit(5);
    if (error) return { error: error.message };
    return { marinas: data ?? [] };
  }
  return { error: "unknown_tool" };
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

export async function POST(req: NextRequest) {
  try {
    const { messages, locale = "sv", context } = (await req.json()) as {
      messages: Msg[];
      locale?: string;
      context?: string;
    };

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const system = systemPrompt(locale, context);

    // Gemini "contents" array we mutate as we loop through tool calls.
    const contents: any[] = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const MAX_TOOL_ROUNDS = 4;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await fetch(GEMINI_URL + key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          tools: [{ functionDeclarations: AI_TOOL_DECLARATIONS }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Gemini API error:", errText);
        return NextResponse.json({ error: `Gemini API error: ${res.status}` }, { status: 500 });
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const functionCallPart = parts.find((p: any) => p.functionCall);

      if (!functionCallPart) {
        const text = parts.find((p: any) => p.text)?.text ?? "";
        return NextResponse.json({ type: "text", text });
      }

      const { name, args } = functionCallPart.functionCall;

      if (CLIENT_TOOL_NAMES.has(name)) {
        // Can't execute this here — hand it back to the browser.
        return NextResponse.json({ type: "action", tool: name, args });
      }

      if (!SERVER_TOOL_NAMES.has(name)) {
        return NextResponse.json({ type: "text", text: "Okänt verktyg begärdes." });
      }

      if (!user) {
        return NextResponse.json({ type: "text", text: "Du måste vara inloggad för det." });
      }

      const result = await execServerTool(name, args ?? {}, supabase, user.id);

      // Feed the tool result back and loop again so Gemini can phrase the final answer.
      contents.push({ role: "model", parts: [{ functionCall: { name, args } }] });
      contents.push({
        role: "function",
        parts: [{ functionResponse: { name, response: result } }],
      });
    }

    return NextResponse.json({ type: "text", text: "Kunde inte slutföra förfrågan (för många verktygsanrop)." });
  } catch (err) {
    console.error("AI Chat Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to process request: ${message}` }, { status: 500 });
  }
}
