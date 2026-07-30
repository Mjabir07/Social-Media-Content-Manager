import "server-only";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export type ReplyResult = { text: string; provider: "gemini" | "fallback" };

export type SuggestReplyInput = {
  messages: { direction: string; body: string }[];
  contactName?: string | null;
  companyName?: string | null;
  salesGuidance?: string | null;
  contentGuidance?: string | null;
  aiInstructions?: string | null;
};

/**
 * Draft a reply to the latest incoming message, in the company's voice, using
 * its approved guidance. Uses Gemini when configured; otherwise a safe, polite
 * fallback so the button always works. Customer text is treated as data.
 */
export async function suggestReply(input: SuggestReplyInput): Promise<ReplyResult> {
  const name = (input.contactName || "").trim();
  const fallback = (): ReplyResult => ({
    text: `Hi${name ? ` ${name.split(" ")[0]}` : ""}, thanks for your message${input.companyName ? ` to ${input.companyName}` : ""}! How can we help you today?`,
    provider: "fallback",
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const lastIn = [...input.messages].reverse().find((m) => m.direction === "IN");
  if (!apiKey || !lastIn) return fallback();

  const transcript = input.messages.slice(-12).map((m) => `${m.direction === "IN" ? "Customer" : "Us"}: ${m.body}`).join("\n");
  const guidance = [input.salesGuidance, input.contentGuidance, input.aiInstructions].filter(Boolean).join("\n");

  try {
    const prompt = `You are the support and sales agent for ${input.companyName || "our business"}, replying on a messaging channel. Write ONE short, friendly, helpful reply to the customer's latest message. Be concrete, move the conversation forward, and never invent facts, prices, or promises.${guidance ? `\nCompany guidance:\n${guidance}` : ""}
Conversation so far:
${transcript}
Return JSON: { "reply": "..." }`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 500, responseMimeType: "application/json", responseSchema: { type: "object", properties: { reply: { type: "string" } }, required: ["reply"], additionalProperties: false } },
        }),
      },
    );
    if (!response.ok) return fallback();
    const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) return fallback();
    const parsed = JSON.parse(text) as { reply?: string };
    return parsed.reply ? { text: parsed.reply, provider: "gemini" } : fallback();
  } catch {
    return fallback();
  }
}
