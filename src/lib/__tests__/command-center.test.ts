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
      openLeads: 5, wonCount: 2, wonValueCents: 250000,
      unreadMessages: 7, openConversations: 3,
      activeAutomations: 4, connections: 2,
      publishedPosts: 6, scheduledPosts: 1, services: 8,
    });
    expect(mocks.lead.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ workspaceId: "tenant-a" }),
    }));
  });
});
