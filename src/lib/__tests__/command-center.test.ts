import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lead: { count: vi.fn(), aggregate: vi.fn() },
  conversation: { aggregate: vi.fn() },
  automation: { count: vi.fn() },
  channelConnection: { count: vi.fn() },
  socialPost: { count: vi.fn() },
  service: { count: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mocks }));

import { getCommandStats } from "@/lib/command-center";

beforeEach(() => vi.clearAllMocks());

describe("command center stats", () => {
  it("aggregates every module scoped to the workspace", async () => {
    mocks.lead.count.mockResolvedValue(5);
    mocks.lead.aggregate.mockResolvedValue({ _sum: { valueCents: 250000 }, _count: { _all: 2 } });
    mocks.conversation.aggregate.mockResolvedValue({ _sum: { unread: 7 }, _count: { _all: 3 } });
    mocks.automation.count.mockResolvedValue(4);
    mocks.channelConnection.count.mockResolvedValue(2);
    mocks.socialPost.count.mockResolvedValueOnce(6).mockResolvedValueOnce(1); // published, scheduled
    mocks.service.count.mockResolvedValue(8);

    const stats = await getCommandStats("tenant-a");

    expect(stats).toEqual({
      scope: "workspace",
      openLeads: 5, wonCount: 2, wonValueCents: 250000,
      unreadMessages: 7, openConversations: 3,
      activeAutomations: 4, connections: 2,
      publishedPosts: 6, scheduledPosts: 1, services: 8,
    });
    expect(mocks.lead.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ workspaceId: "tenant-a" }),
    }));
  });

  it("narrows company-tagged modules to the active company", async () => {
    mocks.lead.count.mockResolvedValue(0);
    mocks.lead.aggregate.mockResolvedValue({ _sum: { valueCents: null }, _count: { _all: 0 } });
    mocks.conversation.aggregate.mockResolvedValue({ _sum: { unread: null }, _count: { _all: 0 } });
    mocks.automation.count.mockResolvedValue(0);
    mocks.channelConnection.count.mockResolvedValue(0);
    mocks.socialPost.count.mockResolvedValue(0);
    mocks.service.count.mockResolvedValue(0);

    const stats = await getCommandStats("tenant-a", "grace");
    expect(stats.scope).toBe("company");
    // Leads scoped to the company; services include shared (company OR null).
    expect(mocks.lead.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ companyId: "grace" }),
    }));
    expect(mocks.service.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ OR: [{ companyId: "grace" }, { companyId: null }] }),
    }));
  });
});
