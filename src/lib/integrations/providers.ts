export const PROVIDERS = {
  GEMINI: {
    name: "Google Gemini",
    description: "Primary company research, grounded search, and content drafting.",
    keyLabel: "Gemini API key",
    placeholder: "AIza...",
    category: "AI",
  },
  GROQ: {
    name: "GroqCloud",
    description: "Fast professional fallback using GPT-OSS, Qwen, and Llama models.",
    keyLabel: "Groq API key",
    placeholder: "gsk_...",
    category: "AI fallback",
  },
  CLOUDFLARE: {
    name: "Cloudflare Workers AI",
    description: "Serverless open-model fallback with a daily free allocation.",
    keyLabel: "Account ID and Workers AI token",
    placeholder: "ACCOUNT_ID:API_TOKEN",
    credentialHint: "Paste the Cloudflare Account ID, a colon, then the Workers AI API token.",
    category: "AI fallback",
  },
  OPENROUTER: {
    name: "OpenRouter",
    description: "Emergency router across currently available free models.",
    keyLabel: "OpenRouter API key",
    placeholder: "sk-or-v1-...",
    category: "AI fallback",
  },
  ANTHROPIC: {
    name: "Anthropic Claude",
    description: "High-quality paid reasoning and optional web-research fallback.",
    keyLabel: "Anthropic API key",
    placeholder: "sk-ant-...",
    category: "AI",
  },
  TAVILY: {
    name: "Tavily Search",
    description: "Source-backed web search when a company website blocks direct crawling.",
    keyLabel: "Tavily API key",
    placeholder: "tvly-...",
    category: "Research",
  },
  FIRECRAWL: {
    name: "Firecrawl",
    description: "Structured website crawling for sites that block basic server requests.",
    keyLabel: "Firecrawl API key",
    placeholder: "fc-...",
    category: "Research",
  },
  APIFY: {
    name: "Apify",
    description: "Web automation and data extraction for advanced research workflows.",
    keyLabel: "Apify API token",
    placeholder: "apify_api_...",
    category: "Automation",
  },
  CLOUDINARY: {
    name: "Cloudinary",
    description: "Auto-resize images and video to each platform's size on the fly — no quality loss.",
    keyLabel: "Cloud name : API key : API secret",
    placeholder: "mycloud:123456789:abcdef...",
    credentialHint: "From your Cloudinary dashboard: paste Cloud name, a colon, API Key, a colon, then API Secret.",
    category: "Media",
  },
} as const;

export type ProviderId = keyof typeof PROVIDERS;

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDERS;
}