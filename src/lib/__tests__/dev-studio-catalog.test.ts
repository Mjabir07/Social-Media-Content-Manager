import { describe, expect, it } from "vitest";
import {
  isDevProjectStatus,
  isRepoProvider,
  isValidFullName,
  deriveRepoUrl,
  parseBranches,
  serializeBranches,
  allBranches,
} from "@/lib/dev-studio-catalog";

describe("isDevProjectStatus", () => {
  it("accepts known statuses, rejects others", () => {
    expect(isDevProjectStatus("ACTIVE")).toBe(true);
    expect(isDevProjectStatus("MAINTENANCE")).toBe(true);
    expect(isDevProjectStatus("DONE")).toBe(false);
    expect(isDevProjectStatus(42)).toBe(false);
  });
});

describe("isRepoProvider", () => {
  it("accepts known providers, rejects others", () => {
    expect(isRepoProvider("github")).toBe(true);
    expect(isRepoProvider("gitlab")).toBe(true);
    expect(isRepoProvider("svn")).toBe(false);
  });
});

describe("isValidFullName", () => {
  it("requires exactly owner/repo", () => {
    expect(isValidFullName("acme/storefront")).toBe(true);
    expect(isValidFullName("acme")).toBe(false);
    expect(isValidFullName("acme/store/front")).toBe(false);
    expect(isValidFullName("/storefront")).toBe(false);
    expect(isValidFullName(" acme/storefront ")).toBe(true);
  });
});

describe("deriveRepoUrl", () => {
  it("composes host + owner/repo from provider", () => {
    expect(deriveRepoUrl("github", "acme/storefront")).toBe("https://github.com/acme/storefront");
    expect(deriveRepoUrl("gitlab", "acme/storefront")).toBe("https://gitlab.com/acme/storefront");
  });
  it("keeps an explicit http(s) url, stripping trailing slash", () => {
    expect(deriveRepoUrl("other", "n/a", "https://git.acme.com/team/app/")).toBe("https://git.acme.com/team/app");
  });
  it("returns null when 'other' has no url and no host", () => {
    expect(deriveRepoUrl("other", "acme/storefront")).toBeNull();
  });
  it("returns null for an invalid owner/repo and no url", () => {
    expect(deriveRepoUrl("github", "not-a-repo")).toBeNull();
  });
});

describe("branch (de)serialization", () => {
  it("parses a JSON string[] and tolerates junk", () => {
    expect(parseBranches('["develop","staging"]')).toEqual(["develop", "staging"]);
    expect(parseBranches("")).toEqual([]);
    expect(parseBranches(null)).toEqual([]);
    expect(parseBranches("not json")).toEqual([]);
    expect(parseBranches('["develop", 3, "  ", "staging"]')).toEqual(["develop", "staging"]);
  });
  it("serializes with trim + de-dupe", () => {
    expect(serializeBranches([" develop ", "develop", "", "staging"])).toBe('["develop","staging"]');
  });
});

describe("allBranches", () => {
  it("puts the default first and drops it from the extras", () => {
    expect(allBranches("main", ["develop", "main", "staging"])).toEqual(["main", "develop", "staging"]);
  });
  it("falls back to main for an empty default", () => {
    expect(allBranches("", ["develop"])).toEqual(["main", "develop"]);
  });
});
