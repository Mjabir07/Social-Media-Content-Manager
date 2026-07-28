import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  socialPost: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  postTarget: { update: vi.fn() },
  channelConnection: { findMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mocks }));

import { channelPostAction, getPosts, publishPost, rollupStatus } from "@/lib/posts";

beforeEach(() => vi.clearAllMocks());

describe("publishing catalogue", () => {
  it("maps channels to the right adapter action", () => {
    expect(channelPostAction("WHATSAPP")).toBe("SEND_WHATSAPP");
    expect(channelPostAction("EMAIL")).toBe("SEND_EMAIL");
    expect(channelPostAction("META_PAGE")).toBe("POST_META");
    expect(channelPostAction("INSTAGRAM")).toBe("POST_META");
    expect(channelPostAction("WEBHOOK")).toBe("WEBHOOK");
  });

  it("rolls target statuses up into a post status", () => {
    expect(rollupStatus(["PUBLISHED", "SIMULATED"])).toBe("PUBLISHED");
    expect(rollupStatus(["PUBLISHED", "FAILED"])).toBe("PARTIAL");
    expect(rollupStatus(["FAILED", "SKIPPED"])).toBe("FAILED");
    expect(rollupStatus([])).toBe("DRAFT");
  });
});

describe("publish engine fans out to every platform", () => {
  it("runs each target and records a rolled-up status", async () => {
    mocks.socialPost.findFirst.mockResolvedValue({
      id: "post1",
      content: "Launch day! 🚀",
      targets: [
        { id: "t1", channel: "META_PAGE", connection: null },
        { id: "t2", channel: "WHATSAPP", connection: null },
      ],
    });
    mocks.postTarget.update.mockResolvedValue({});
    mocks.socialPost.update.mockResolvedValue({});

    const result = await publishPost("tenant-a", "post1");

    expect(result).not.toBeNull();
    // Both targets processed (no live connection -> SKIPPED for external channels).
    expect(mocks.postTarget.update).toHaveBeenCalledTimes(2);
    expect(result!.targets).toHaveLength(2);
    // Post status persisted from the rollup.
    expect(mocks.socialPost.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "post1" }, data: { status: result!.status },
    }));
    // Scoped read.
    expect(mocks.socialPost.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "post1", workspaceId: "tenant-a" },
    }));
  });

  it("returns null for a post in another workspace", async () => {
    mocks.socialPost.findFirst.mockResolvedValue(null);
    expect(await publishPost("tenant-a", "rival-post")).toBeNull();
  });
});

describe("scoping", () => {
  it("lists posts scoped to the workspace", async () => {
    mocks.socialPost.findMany.mockResolvedValue([]);
    await getPosts("tenant-a");
    expect(mocks.socialPost.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: "tenant-a" } }));
  });
});
