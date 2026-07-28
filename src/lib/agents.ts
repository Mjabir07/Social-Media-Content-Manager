import { prisma } from "@/lib/db";

/**
 * Company-scoped AI agent profiles. Every profile belongs to exactly one
 * company; its effective runtime system prompt is composed from that company's
 * Brand Profile + Company Brain + the profile's own instructions, so an agent
 * can never operate with another company's context. All reads and writes are
 * scoped by BOTH workspaceId and companyId.
 */

export const AGENT_AUTONOMY = ["SUGGEST", "DRAFT", "AUTOPILOT"] as const;
export type AgentAutonomy = (typeof AGENT_AUTONOMY)[number];

// The automation dial: how far an agent may act before a human approves.
export const autonomyMeta: Record<AgentAutonomy, { label: string; description: string; rule: string }> = {
  SUGGEST: {
    label: "Suggest only",
    description: "Proposes ideas and outlines; a person writes and ships everything.",
    rule: "Only propose ideas, outlines, and options. Never produce a final asset or take any external action.",
  },
  DRAFT: {
    label: "Draft & queue",
    description: "Produces ready-to-review drafts and queues them for approval.",
    rule: "Produce complete, ready-to-review drafts and stop. A human must approve before anything is published or sent.",
  },
  AUTOPILOT: {
    label: "Autopilot",
    description: "Acts within its guardrails; only flagged edge cases need approval.",
    rule: "Act within the guardrails below without asking each time. Escalate for human approval only when a rule is unclear, a claim is unverifiable, or an action is irreversible.",
  },
};

export type AgentTemplate = {
  key: string;
  name: string;
  role: string;
  autonomy: AgentAutonomy;
  tags: string[];
  systemPrompt: string;
};

// Ready-made agent profiles — instant coverage across an agency's core work.
// Seeded/offered per company so a new company is productive immediately.
export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    key: "content-writer", name: "Content Writer", role: "Long-form content", autonomy: "DRAFT",
    tags: ["blog", "articles", "SEO"],
    systemPrompt: "Write clear, on-brand long-form content: blog posts, articles, and landing-page copy. Lead with the concrete outcome, use semantic structure (H2/H3, short paragraphs, lists), and ground every claim in an approved fact.",
  },
  {
    key: "social-manager", name: "Social Media Manager", role: "Social content", autonomy: "DRAFT",
    tags: ["instagram", "linkedin", "captions", "calendar"],
    systemPrompt: "Plan and write platform-native social posts and captions with hooks, hashtags, and CTAs. Adapt tone per platform. Suggest a weekly cadence and repurpose one idea across formats.",
  },
  {
    key: "seo-researcher", name: "SEO Researcher", role: "Search strategy", autonomy: "SUGGEST",
    tags: ["keywords", "gaps", "titles"],
    systemPrompt: "Find keyword opportunities and content gaps, propose title/meta options, and outline briefs. Prioritise quick wins vs strategic bets. Never fabricate search volumes — mark any estimate as illustrative.",
  },
  {
    key: "sales-assistant", name: "Sales Assistant", role: "Leads & outreach", autonomy: "SUGGEST",
    tags: ["outreach", "qualification", "follow-up"],
    systemPrompt: "Draft outbound and follow-up messages, qualify leads against the company's sales guidance, and suggest next steps. Keep messages short, specific, and value-first. Never promise pricing or terms not in approved knowledge.",
  },
  {
    key: "support-responder", name: "Support Responder", role: "Customer replies", autonomy: "DRAFT",
    tags: ["support", "faq", "tone"],
    systemPrompt: "Draft accurate, friendly replies to customer questions using only approved facts. Acknowledge the issue, give the answer, offer a clear next step. Escalate anything involving refunds, legal, or unverified claims.",
  },
  {
    key: "ad-copywriter", name: "Ad Copywriter", role: "Paid ads", autonomy: "DRAFT",
    tags: ["ads", "headlines", "variants"],
    systemPrompt: "Write high-converting ad copy: multiple headline and primary-text variants per angle, matched to audience and platform limits. Focus on one benefit per variant. Avoid unsupported superlatives and claims.",
  },
  {
    key: "email-marketer", name: "Email Marketer", role: "Lifecycle email", autonomy: "DRAFT",
    tags: ["newsletter", "sequences", "subject-lines"],
    systemPrompt: "Design and draft email newsletters and lifecycle sequences with subject-line options, clear structure, and one primary CTA. Map timing and exit conditions for sequences.",
  },
  {
    key: "brand-strategist", name: "Brand Strategist", role: "Positioning", autonomy: "SUGGEST",
    tags: ["positioning", "messaging", "voice"],
    systemPrompt: "Sharpen positioning and messaging: articulate the value proposition, differentiators, and message pillars. Flag inconsistencies between stated brand voice and current content.",
  },
];

export function agentTemplate(key: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.key === key);
}

// ---- Scoped data access (isolation: always workspaceId + companyId) ----

export async function getAgents(workspaceId: string, companyId: string) {
  return prisma.agentProfile.findMany({
    where: { workspaceId, companyId, status: { not: "ARCHIVED" } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getAgent(workspaceId: string, companyId: string, id: string) {
  return prisma.agentProfile.findFirst({ where: { id, workspaceId, companyId } });
}

export type AgentInput = {
  name: string;
  role: string;
  systemPrompt: string;
  autonomy: AgentAutonomy;
  providerId?: string | null;
  isDefault?: boolean;
};

export async function createAgent(
  workspaceId: string,
  companyId: string,
  createdById: string | null,
  input: AgentInput,
) {
  return prisma.agentProfile.create({
    data: {
      workspaceId,
      companyId,
      createdById: createdById ?? undefined,
      name: input.name,
      role: input.role,
      systemPrompt: input.systemPrompt,
      autonomy: input.autonomy,
      providerId: input.providerId ?? null,
      isDefault: input.isDefault ?? false,
    },
  });
}

// Scoped update: the where clause pins workspace + company so a foreign id can
// never be updated even if the caller passes one. Returns the affected count.
export async function updateAgent(
  workspaceId: string,
  companyId: string,
  id: string,
  data: Partial<AgentInput> & { status?: string },
) {
  const result = await prisma.agentProfile.updateMany({
    where: { id, workspaceId, companyId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.systemPrompt !== undefined ? { systemPrompt: data.systemPrompt } : {}),
      ...(data.autonomy !== undefined ? { autonomy: data.autonomy } : {}),
      ...(data.providerId !== undefined ? { providerId: data.providerId } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
  return result.count;
}

// Soft archive, scoped.
export async function archiveAgent(workspaceId: string, companyId: string, id: string) {
  const result = await prisma.agentProfile.updateMany({
    where: { id, workspaceId, companyId },
    data: { status: "ARCHIVED" },
  });
  return result.count;
}

// ---- The composer: effective, isolated system prompt for one agent ----

export type ComposerCompany = {
  name: string;
  industry?: string | null;
  website?: string | null;
  description?: string | null;
};
export type ComposerBrand = {
  brandVoice?: string | null;
  targetAudiences?: string[];
  offerings?: string[];
  differentiators?: string[];
  contentRules?: string | null;
} | null;
export type ComposerBrain = {
  companyFacts?: string | null;
  salesGuidance?: string | null;
  contentGuidance?: string | null;
  aiInstructions?: string | null;
} | null;
export type ComposerProfile = {
  name: string;
  role: string;
  systemPrompt: string;
  autonomy: AgentAutonomy;
};

function section(title: string, body?: string | null): string {
  const value = (body ?? "").trim();
  return value ? `## ${title}\n${value}\n` : "";
}
function list(title: string, items?: string[]): string {
  const clean = (items ?? []).map((i) => i.trim()).filter(Boolean);
  return clean.length ? `## ${title}\n${clean.map((i) => `- ${i}`).join("\n")}\n` : "";
}

/**
 * Build the full operating prompt for `profile` acting for `company`. Only the
 * passed company's brand/brain are used — callers must load these via the
 * workspace+company-scoped helpers, so no other company's context can appear.
 */
export function buildAgentSystemPrompt(input: {
  company: ComposerCompany;
  brand: ComposerBrand;
  brain: ComposerBrain;
  profile: ComposerProfile;
}): string {
  const { company, brand, brain, profile } = input;
  const autonomy = autonomyMeta[profile.autonomy];
  const header = `You are ${profile.name}, the ${profile.role} for ${company.name}${company.industry ? ` (${company.industry})` : ""}.`;

  const parts = [
    header,
    "",
    section("Company", [company.description, company.website ? `Website: ${company.website}` : ""].filter(Boolean).join("\n")),
    section("Brand voice", brand?.brandVoice),
    list("Target audiences", brand?.targetAudiences),
    list("Offerings", brand?.offerings),
    list("Differentiators", brand?.differentiators),
    section("Content rules", brand?.contentRules),
    section(`Approved knowledge — ${company.name} only`, brain?.companyFacts),
    section("Sales guidance", brain?.salesGuidance),
    section("Content guidance", brain?.contentGuidance),
    section("Operating instructions", brain?.aiInstructions),
    section("Your role", profile.systemPrompt),
    `## Autonomy: ${autonomy.label}\n${autonomy.rule}\n`,
    [
      "## Guardrails",
      `- Use only ${company.name}'s approved information above. Never use another company's data, and never blend companies.`,
      "- Never invent facts, client names, prices, statistics, or testimonials. Mark any illustrative number as an example.",
      "- Stay within your role; redirect out-of-scope requests.",
    ].join("\n"),
  ];
  return parts.filter((p) => p !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
