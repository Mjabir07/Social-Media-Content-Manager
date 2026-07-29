import "server-only";
import type { ProviderId } from "@/lib/integrations/providers";

type TestResult = { ok: boolean; message: string };

function resultForStatus(status: number, success = "Connection and generation verified."): TestResult {
  if (status >= 200 && status < 300) return { ok: true, message: success };
  if (status === 401 || status === 403) {
    return { ok: false, message: "Provider rejected this credential or its permissions." };
  }
  if (status === 429) {
    return { ok: false, message: "The credential is valid, but provider quota is currently exhausted." };
  }
  return { ok: false, message: `Provider test returned HTTP ${status}.` };
}

async function postJson(url: string, headers: HeadersInit, body: unknown, timeout = 15_000) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });
}

async function testGemini(secret: string) {
  const response = await postJson(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    { "x-goog-api-key": secret },
    {
      contents: [{ role: "user", parts: [{ text: "Reply OK." }] }],
      generationConfig: { maxOutputTokens: 16 },
    },
  );
  if (response.status === 429) {
    return {
      ok: false,
      message: "The key is valid, but its Google AI project has no available generation quota. Check AI Studio billing or wait for quota reset.",
    };
  }
  return resultForStatus(response.status);
}

async function testGroq(secret: string) {
  const response = await postJson(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${secret}` },
    {
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "Reply OK." }],
      max_tokens: 16,
      temperature: 0,
    },
  );
  return resultForStatus(response.status);
}

async function testOpenRouter(secret: string) {
  const response = await postJson(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      Authorization: `Bearer ${secret}`,
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
      "X-Title": "AZMIN Digital OS",
    },
    {
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [{ role: "user", content: "Reply OK." }],
      max_tokens: 16,
      temperature: 0,
    },
  );
  return resultForStatus(response.status);
}

export function parseCloudflareCredential(secret: string) {
  const separator = secret.indexOf(":");
  if (separator < 1 || separator === secret.length - 1) return null;
  return {
    accountId: secret.slice(0, separator).trim(),
    apiToken: secret.slice(separator + 1).trim(),
  };
}

async function testCloudflare(secret: string) {
  const credential = parseCloudflareCredential(secret);
  if (!credential) {
    return { ok: false, message: "Use the format ACCOUNT_ID:API_TOKEN." };
  }
  const model = process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.1-8b-instruct";
  const response = await postJson(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(credential.accountId)}/ai/run/${model}`,
    { Authorization: `Bearer ${credential.apiToken}` },
    { prompt: "Reply OK.", max_tokens: 16 },
  );
  return resultForStatus(response.status);
}

async function testTavily(secret: string) {
  return testGet("https://api.tavily.com/usage", {
    Authorization: `Bearer ${secret}`,
  });
}

async function testGet(url: string, headers: HeadersInit) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  return resultForStatus(response.status, "Connection verified.");
}

export async function testProviderCredential(provider: ProviderId, secret: string) {
  switch (provider) {
    case "GEMINI": return testGemini(secret);
    case "GROQ": return testGroq(secret);
    case "CLOUDFLARE": return testCloudflare(secret);
    case "OPENROUTER": return testOpenRouter(secret);
    case "TAVILY": return testTavily(secret);
    case "ANTHROPIC":
      return testGet("https://api.anthropic.com/v1/models?limit=1", {
        "x-api-key": secret,
        "anthropic-version": "2023-06-01",
      });
    case "FIRECRAWL":
      return testGet("https://api.firecrawl.dev/v2/team/credit-usage", {
        Authorization: `Bearer ${secret}`,
      });
    case "APIFY":
      return testGet("https://api.apify.com/v2/users/me", {
        Authorization: `Bearer ${secret}`,
      });
    case "CLOUDINARY": {
      const parts = secret.split(":");
      if (parts.length < 3) return { ok: false, message: "Use the format cloudName:apiKey:apiSecret." };
      const [cloudName, apiKey, ...rest] = parts;
      const basic = Buffer.from(`${apiKey}:${rest.join(":")}`).toString("base64");
      return testGet(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/usage`, { Authorization: `Basic ${basic}` });
    }
  }
}