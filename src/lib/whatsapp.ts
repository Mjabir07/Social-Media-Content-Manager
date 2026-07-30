import "server-only";

/**
 * WhatsApp Cloud API template send. A cold outbound message (outside the 24-hour
 * customer window) must use a pre-approved template — `hello_world` exists on
 * every test/business account by default, so it's ideal for a connection test.
 * secret = "phoneNumberId:token".
 */
export async function sendWhatsAppTemplate(
  secret: string,
  to: string,
  template = "hello_world",
  languageCode = "en_US",
): Promise<{ ok: boolean; detail: string; id?: string }> {
  const i = secret.indexOf(":");
  if (i < 1) return { ok: false, detail: "WhatsApp credential must be phoneNumberId:token." };
  const phoneNumberId = secret.slice(0, i);
  const token = secret.slice(i + 1);
  const recipient = to.replace(/[^\d]/g, "");
  if (!recipient) return { ok: false, detail: "Enter a valid phone number (with country code)." };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "template", template: { name: template, language: { code: languageCode } } }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } };
    if (res.ok && data.messages?.[0]?.id) return { ok: true, detail: "Sent — check WhatsApp on that number.", id: data.messages[0].id };
    return { ok: false, detail: data.error?.message ?? `WhatsApp returned HTTP ${res.status}.` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Send failed." };
  }
}
