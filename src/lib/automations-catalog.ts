/**
 * Pure automation catalogue (no database) — safe for client components.
 * Everything is phrased in plain English so a non-technical user reads an
 * automation as one sentence: "When <trigger> → <action>". The DB layer and
 * engine live in "@/lib/automations".
 */

export const CHANNELS = ["META_PAGE", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "WHATSAPP", "EMAIL", "TELEGRAM", "WEBHOOK"] as const;
export type Channel = (typeof CHANNELS)[number];

export const channelMeta: Record<Channel, { label: string; blurb: string; secretLabel: string; placeholder: string }> = {
  META_PAGE: { label: "Facebook Page", blurb: "Post to a Facebook Page via the official Graph API. Enter the Page ID and a Page access token.", secretLabel: "Page ID : Page access token", placeholder: "123456789:EAAG..." },
  INSTAGRAM: { label: "Instagram", blurb: "Publish to a connected Instagram business account.", secretLabel: "Access token", placeholder: "IGQVJ..." },
  LINKEDIN: { label: "LinkedIn", blurb: "Post to a LinkedIn page or profile.", secretLabel: "Access token", placeholder: "AQV..." },
  YOUTUBE: { label: "YouTube", blurb: "Publish videos / Shorts to a YouTube channel.", secretLabel: "OAuth access token", placeholder: "ya29..." },
  WHATSAPP: { label: "WhatsApp", blurb: "Send WhatsApp messages via the official Cloud API. Enter the Phone Number ID and a permanent token.", secretLabel: "Phone number ID : token", placeholder: "123456789:EAAG..." },
  EMAIL: { label: "Email", blurb: "Send email through Resend (free tier). Paste your Resend API key.", secretLabel: "Resend API key", placeholder: "re_..." },
  TELEGRAM: { label: "Telegram", blurb: "Send Telegram messages from a bot.", secretLabel: "Bot token : chat id", placeholder: "123:ABC... : -100..." },
  WEBHOOK: { label: "Webhook / Zapier", blurb: "Call any URL — connect Zapier, Make, or your own endpoint.", secretLabel: "Webhook URL", placeholder: "https://hooks.zapier.com/…" },
};

export const TRIGGERS = ["LEAD_CREATED", "MESSAGE_RECEIVED", "CONTENT_APPROVED", "CONTENT_PUBLISHED", "MANUAL"] as const;
export type Trigger = (typeof TRIGGERS)[number];

export const triggerMeta: Record<Trigger, { label: string; vars: string[] }> = {
  LEAD_CREATED: { label: "A new lead comes in", vars: ["name", "company", "email", "phone"] },
  MESSAGE_RECEIVED: { label: "A customer messages me", vars: ["name", "message"] },
  CONTENT_APPROVED: { label: "Content is approved", vars: ["title", "company", "platform"] },
  CONTENT_PUBLISHED: { label: "Content is published", vars: ["title", "company", "platform", "url"] },
  MANUAL: { label: "I press Run", vars: ["company"] },
};

export const ACTIONS = ["SEND_WHATSAPP", "SEND_EMAIL", "POST_META", "AI_REPLY", "NOTIFY", "WEBHOOK"] as const;
export type Action = (typeof ACTIONS)[number];

export const actionMeta: Record<Action, { label: string; channel: Channel | null; needsTemplate: boolean }> = {
  SEND_WHATSAPP: { label: "Send a WhatsApp message", channel: "WHATSAPP", needsTemplate: true },
  SEND_EMAIL: { label: "Send an email", channel: "EMAIL", needsTemplate: true },
  POST_META: { label: "Post to Facebook / Instagram", channel: "META_PAGE", needsTemplate: true },
  AI_REPLY: { label: "Reply automatically with AI", channel: null, needsTemplate: false },
  NOTIFY: { label: "Notify my team in-app", channel: null, needsTemplate: true },
  WEBHOOK: { label: "Call a webhook (Zapier / Make)", channel: "WEBHOOK", needsTemplate: false },
};

export function isTrigger(v: unknown): v is Trigger { return typeof v === "string" && (TRIGGERS as readonly string[]).includes(v); }
export function isAction(v: unknown): v is Action { return typeof v === "string" && (ACTIONS as readonly string[]).includes(v); }
export function isChannel(v: unknown): v is Channel { return typeof v === "string" && (CHANNELS as readonly string[]).includes(v); }

// One-click recipe templates — the primary "simple" path.
export type RecipeTemplate = { key: string; name: string; trigger: Trigger; action: Action; template: string };
export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  { key: "welcome-whatsapp", name: "Welcome new leads on WhatsApp", trigger: "LEAD_CREATED", action: "SEND_WHATSAPP", template: "Hi {{name}}! Thanks for reaching out to {{company}}. How can we help you today?" },
  { key: "ai-autoreply", name: "Auto-reply to every message with AI", trigger: "MESSAGE_RECEIVED", action: "AI_REPLY", template: "" },
  { key: "notify-lead", name: "Tell my team about every new lead", trigger: "LEAD_CREATED", action: "NOTIFY", template: "New lead: {{name}} ({{email}} / {{phone}})" },
  { key: "email-lead", name: "Email a new lead a thank-you", trigger: "LEAD_CREATED", action: "SEND_EMAIL", template: "Hi {{name}},\n\nThanks for contacting {{company}} — we'll be in touch shortly.\n" },
  { key: "post-approved", name: "Post approved content to Facebook/Instagram", trigger: "CONTENT_APPROVED", action: "POST_META", template: "{{title}}" },
  { key: "published-webhook", name: "Send published content to Zapier", trigger: "CONTENT_PUBLISHED", action: "WEBHOOK", template: "{{title}} — {{url}}" },
];

export function recipeTemplate(key: string): RecipeTemplate | undefined {
  return RECIPE_TEMPLATES.find((r) => r.key === key);
}

// Fill {{placeholders}} from a variables map; unknown placeholders become "".
export function renderTemplate(template: string, vars: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

// Plain-English one-liner for an automation.
export function describeAutomation(trigger: Trigger, action: Action): string {
  return `When ${triggerMeta[trigger].label.toLowerCase()} → ${actionMeta[action].label.toLowerCase()}`;
}
