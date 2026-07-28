import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Phase 1 exit-gate proof: "create AZMIN plus two companies and prove no
 * cross-company data or AI context leakage."
 *
 * Instead of asserting call shapes, this runs the real companies.ts helpers
 * against a fake Prisma backed by a seeded multi-tenant dataset, and proves the
 * isolation guarantees hold end to end:
 *   - tenant-a  : AZMIN HQ + Grace Computers + a partner (three companies)
 *   - tenant-b  : Rival Corp (a different AZMIN workspace / tenant)
 * Each company owns a private Company Brain (its AI context).
 */

type Row = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  isHeadquarters: boolean;
  status: string;
  primaryColor: string;
  relationshipType: string;
  brandProfile: null;
  brain: { companyFacts: string; aiInstructions: string; knowledgeStatus: string };
};

const DATA: Row[] = [
  brainRow({ id: "azmin", workspaceId: "tenant-a", name: "AZMIN Digital", slug: "azmin-digital", isHeadquarters: true, relationshipType: "OWN_BRAND", facts: "AZMIN internal HQ facts", ai: "AZMIN HQ instructions" }),
  brainRow({ id: "grace", workspaceId: "tenant-a", name: "Grace Computers", slug: "grace-computers", facts: "Grace Computers SAIF-Zone facts", ai: "Grace AI instructions" }),
  brainRow({ id: "partner", workspaceId: "tenant-a", name: "Partner Co", slug: "partner-co", relationshipType: "PARTNER", facts: "Partner commission facts", ai: "Partner instructions" }),
  brainRow({ id: "rival", workspaceId: "tenant-b", name: "Rival Corp", slug: "rival-corp", facts: "Rival Corp CONFIDENTIAL facts", ai: "Rival secret instructions" }),
  brainRow({ id: "gone", workspaceId: "tenant-a", name: "Archived Co", slug: "archived-co", status: "ARCHIVED", facts: "archived facts", ai: "archived instructions" }),
];

function brainRow(o: {
  id: string; workspaceId: string; name: string; slug: string; facts: string; ai: string;
  isHeadquarters?: boolean; relationshipType?: string; status?: string;
}): Row {
  return {
    id: o.id, workspaceId: o.workspaceId, name: o.name, slug: o.slug,
    isHeadquarters: o.isHeadquarters ?? false, status: o.status ?? "ACTIVE",
    primaryColor: "#087CFA", relationshipType: o.relationshipType ?? "CLIENT",
    brandProfile: null,
    brain: { companyFacts: o.facts, aiInstructions: o.ai, knowledgeStatus: "CONFIGURED" },
  };
}

// Fake Prisma that honours the where filters the real helpers pass. If a helper
// ever dropped its workspace scope, these would start returning foreign rows
// and the assertions below would fail — which is the point.
function matches(row: Row, where: Record<string, unknown> = {}): boolean {
  if ("workspaceId" in where && row.workspaceId !== where.workspaceId) return false;
  if ("id" in where && row.id !== where.id) return false;
  if (where.status && typeof where.status === "object" && "not" in (where.status as object)) {
    if (row.status === (where.status as { not: string }).not) return false;
  }
  return true;
}

const mocks = vi.hoisted(() => ({ company: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() } }));
vi.mock("@/lib/db", () => ({ prisma: { company: mocks.company } }));

import { getCompanies, getCompany } from "@/lib/companies";
import { resolveActiveCompany, type CompanyContextItem } from "@/lib/company-context";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.company.findFirst.mockImplementation(async ({ where }) => DATA.find((r) => matches(r, where)) ?? null);
  mocks.company.findMany.mockImplementation(async ({ where }) => DATA.filter((r) => matches(r, where)));
});

describe("Phase 1 exit gate — no cross-company data or AI-context leakage", () => {
  it("a tenant cannot read another tenant's company", async () => {
    expect(await getCompany("tenant-a", "rival")).toBeNull();
    expect(await getCompany("tenant-b", "grace")).toBeNull();
  });

  it("a company list is scoped to its own tenant and excludes archived", async () => {
    const a = await getCompanies("tenant-a");
    expect(a.map((c) => c.id).sort()).toEqual(["azmin", "grace", "partner"]);
    expect(a.some((c) => c.workspaceId === "tenant-b")).toBe(false);
    expect(a.some((c) => c.id === "gone")).toBe(false); // archived hidden

    const b = await getCompanies("tenant-b");
    expect(b.map((c) => c.id)).toEqual(["rival"]);
  });

  it("each company loads only its own Company Brain (AI context)", async () => {
    const grace = await getCompany("tenant-a", "grace");
    const azmin = await getCompany("tenant-a", "azmin");
    expect(grace?.brain?.companyFacts).toBe("Grace Computers SAIF-Zone facts");
    expect(azmin?.brain?.companyFacts).toBe("AZMIN internal HQ facts");
    // Grace's context never carries AZMIN's or the rival's instructions.
    expect(grace?.brain?.aiInstructions).not.toContain("AZMIN");
    expect(grace?.brain?.aiInstructions).not.toContain("Rival");
  });

  it("a forged/foreign active-company id can never activate another tenant's company", async () => {
    const list: CompanyContextItem[] = (await getCompanies("tenant-a")).map((c) => ({
      id: c.id, name: c.name, relationshipType: c.relationshipType,
      isHeadquarters: c.isHeadquarters, primaryColor: c.primaryColor, status: c.status,
    }));
    // Cookie-injection attempt: request tenant-b's company id from tenant-a.
    const active = resolveActiveCompany(list, "rival");
    expect(active?.id).toBe("azmin"); // falls back to HQ, never the foreign id
    expect(active?.id).not.toBe("rival");
  });
});
