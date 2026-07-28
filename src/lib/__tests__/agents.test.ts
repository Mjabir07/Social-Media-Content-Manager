import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  agentProfile: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: { agentProfile: mocks.agentProfile } }));

import {
  AGENT_TEMPLATES,
  agentTemplate,
  buildAgentSystemPrompt,
  getAgent,
  getAgents,
  updateAgent,
} from "@/lib/agents";

beforeEach(() => vi.clearAllMocks());

describe("agent templates", () => {
  it("ships a catalogue of ready-made agents with unique keys", () => {
    expect(AGENT_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    const keys = AGENT_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(agentTemplate("content-writer")?.name).toBe("Content Writer");
    expect(agentTemplate("nope")).toBeUndefined();
  });
});

describe("agent data access is company + workspace scoped", () => {
  it("lists agents scoped to one company in one workspace, excluding archived", async () => {
    mocks.agentProfile.findMany.mockResolvedValue([]);
    await getAgents("tenant-a", "grace");
    expect(mocks.agentProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a", companyId: "grace", status: { not: "ARCHIVED" } },
    }));
  });

  it("reads a single agent only when workspace + company both match", async () => {
    mocks.agentProfile.findFirst.mockResolvedValue(null);
    await getAgent("tenant-a", "grace", "agent-from-rival");
    expect(mocks.agentProfile.findFirst).toHaveBeenCalledWith({
      where: { id: "agent-from-rival", workspaceId: "tenant-a", companyId: "grace" },
    });
  });

  it("scopes updates so a foreign id can never be written", async () => {
    mocks.agentProfile.updateMany.mockResolvedValue({ count: 0 });
    const count = await updateAgent("tenant-a", "grace", "rival-agent", { name: "Hijack" });
    expect(mocks.agentProfile.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "rival-agent", workspaceId: "tenant-a", companyId: "grace" },
    }));
    expect(count).toBe(0); // nothing matched -> nothing changed
  });
});

describe("system-prompt composer keeps company context isolated", () => {
  const grace = {
    company: { name: "Grace Computers", industry: "IT", website: "https://grace.example", description: "IT provider in SAIF Zone." },
    brand: { brandVoice: "Practical and local", targetAudiences: ["SMBs in Sharjah"], offerings: ["Computer sales"], differentiators: ["SAIF-Zone presence"], contentRules: "No unverified claims" },
    brain: { companyFacts: "Grace SAIF-Zone facts", salesGuidance: "Lead with local availability", contentGuidance: "Clear and professional", aiInstructions: "Use only verified facts" },
    profile: { name: "Content Writer", role: "Long-form content", systemPrompt: "Write blog posts.", autonomy: "DRAFT" as const },
  };

  it("includes only the given company's brand + brain", () => {
    const prompt = buildAgentSystemPrompt(grace);
    expect(prompt).toContain("Grace Computers");
    expect(prompt).toContain("Grace SAIF-Zone facts");
    expect(prompt).toContain("Lead with local availability");
    // No other company's data leaks in.
    expect(prompt).not.toContain("Rival");
    expect(prompt).not.toContain("AZMIN internal");
  });

  it("embeds the autonomy rule and cross-company guardrail", () => {
    const prompt = buildAgentSystemPrompt(grace);
    expect(prompt).toContain("Autonomy: Draft & queue");
    expect(prompt).toContain("Never use another company's data");
  });

  it("omits empty sections instead of leaving blank headers", () => {
    const prompt = buildAgentSystemPrompt({
      company: { name: "Bare Co" },
      brand: null,
      brain: null,
      profile: { name: "Assistant", role: "Helper", systemPrompt: "Help.", autonomy: "SUGGEST" },
    });
    expect(prompt).toContain("Bare Co");
    expect(prompt).not.toContain("Brand voice");
    expect(prompt).not.toContain("Approved knowledge");
    expect(prompt).toContain("Autonomy: Suggest only");
  });
});
