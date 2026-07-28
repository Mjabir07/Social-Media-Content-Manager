import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  automation: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  automationRun: { create: vi.fn() },
  channelConnection: { findMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mocks }));

import {
  ACTIONS,
  TRIGGERS,
  describeAutomation,
  dispatchTrigger,
  getAutomations,
  isAction,
  recipeTemplate,
  renderTemplate,
} from "@/lib/automations";
import { getConnections } from "@/lib/connections";

beforeEach(() => vi.clearAllMocks());

describe("automation catalogue (plain English)", () => {
  it("renders templates and ignores unknown placeholders", () => {
    expect(renderTemplate("Hi {{name}} at {{company}}", { name: "Sam", company: "Grace" })).toBe("Hi Sam at Grace");
    expect(renderTemplate("Hi {{missing}}!", {})).toBe("Hi !");
  });

  it("describes an automation as one sentence", () => {
    expect(describeAutomation("LEAD_CREATED", "SEND_WHATSAPP")).toBe("When a new lead comes in → send a whatsapp message");
  });

  it("exposes recipe templates and validates enum values", () => {
    expect(recipeTemplate("welcome-whatsapp")?.action).toBe("SEND_WHATSAPP");
    expect(isAction("SEND_EMAIL")).toBe(true);
    expect(isAction("SEND_PIGEON")).toBe(false);
    expect(TRIGGERS.length).toBeGreaterThan(0);
    expect(ACTIONS.length).toBeGreaterThan(0);
  });
});

describe("dispatch engine", () => {
  it("runs enabled recipes for the trigger, scoped to the workspace, and logs runs", async () => {
    mocks.automation.findMany.mockResolvedValue([
      { id: "a1", action: "NOTIFY", template: "New lead {{name}}", connection: null },
    ]);
    mocks.automationRun.create.mockResolvedValue({});

    const result = await dispatchTrigger({ workspaceId: "tenant-a", companyId: "grace", trigger: "LEAD_CREATED", variables: { name: "Sam" } });

    // Scoped + filtered query.
    expect(mocks.automation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        workspaceId: "tenant-a",
        trigger: "LEAD_CREATED",
        enabled: true,
        OR: [{ companyId: "grace" }, { companyId: null }],
      },
    }));
    // NOTIFY needs no external channel -> SUCCESS, and a run is recorded.
    expect(result.matched).toBe(1);
    expect(result.runs[0].status).toBe("SUCCESS");
    expect(result.runs[0].detail).toContain("New lead Sam");
    expect(mocks.automationRun.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ automationId: "a1", workspaceId: "tenant-a", status: "SUCCESS" }),
    }));
  });

  it("skips an external send when no channel is connected", async () => {
    mocks.automation.findMany.mockResolvedValue([
      { id: "a2", action: "SEND_WHATSAPP", template: "Hi", connection: null },
    ]);
    mocks.automationRun.create.mockResolvedValue({});
    const result = await dispatchTrigger({ workspaceId: "tenant-a", trigger: "LEAD_CREATED" });
    expect(result.runs[0].status).toBe("SKIPPED");
  });
});

describe("scoping", () => {
  it("lists automations scoped to the workspace", async () => {
    mocks.automation.findMany.mockResolvedValue([]);
    await getAutomations("tenant-a");
    expect(mocks.automation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a" },
    }));
  });

  it("lists connections scoped to the workspace and never selects secret fields", async () => {
    mocks.channelConnection.findMany.mockResolvedValue([]);
    await getConnections("tenant-a", "grace");
    const call = mocks.channelConnection.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ workspaceId: "tenant-a", OR: [{ companyId: "grace" }, { companyId: null }] });
    expect(call.select).not.toHaveProperty("encryptedConfig");
    expect(call.select).not.toHaveProperty("iv");
    expect(call.select).not.toHaveProperty("authTag");
  });
});
