import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey: key });
}

const TONE_MAP: Record<string, string> = {
  warm: "Warm and personal — like talking to a trusted friend. Genuine, caring, approachable.",
  professional: "Professional and polished — business-appropriate, confident, respectful.",
  casual: "Casual and fun — friendly, light-hearted, conversational.",
  premium: "Premium and refined — elevated tone, confident, high-end feel.",
};

export async function POST(req: NextRequest) {
  const { reviewer_name, rating, review_text, tone, custom_rules = [] } =
    await req.json();

  const baseTone = TONE_MAP[tone] ?? TONE_MAP.warm;
  const extra =
    custom_rules.length > 0
      ? `\n\nAdditional rules from the business owner:\n${custom_rules.map((r: string) => `- ${r}`).join("\n")}`
      : "";
  const toneDescription = baseTone + extra;

  const prompt = `You are responding to a Google review on behalf of Marco's Italian Kitchen.

Business tone: ${toneDescription}

Review from ${reviewer_name} (${rating}/5 stars):
"${review_text}"

Write a response. Rules:
- Sound human and genuine, not like a template
- 2-3 sentences only
- Thank the reviewer by name
- Address what they specifically mentioned
- For negative reviews, acknowledge the issue and invite them to reach out
- Never use em dashes or AI-sounding formatting
- Sound like the business owner wrote it, not a bot

Return ONLY a JSON object: {"response": "your response here"}`;

  try {
    const result = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 120,
      temperature: 0.8,
    });

    const data = JSON.parse(result.choices[0].message.content ?? "{}");
    return NextResponse.json({ response: data.response ?? "", confidence: 0.9 });
  } catch {
    return NextResponse.json({ response: "", confidence: 0.0 }, { status: 500 });
  }
}
