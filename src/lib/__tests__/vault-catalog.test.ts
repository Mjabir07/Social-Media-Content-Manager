import { describe, expect, it } from "vitest";
import { isVaultCategory, groupByClient, vaultCategoryMeta, VAULT_CATEGORIES } from "@/lib/vault-catalog";

describe("isVaultCategory", () => {
  it("accepts known categories, rejects others", () => {
    expect(isVaultCategory("DOMAIN")).toBe(true);
    expect(isVaultCategory("EMAIL")).toBe(true);
    expect(isVaultCategory("BANK")).toBe(false);
    expect(isVaultCategory(null)).toBe(false);
  });
  it("has meta for every category", () => {
    for (const c of VAULT_CATEGORIES) expect(vaultCategoryMeta[c]).toBeTruthy();
  });
});

describe("groupByClient", () => {
  it("groups items by client and sorts clients A→Z", () => {
    const groups = groupByClient([
      { clientName: "Zeta", label: "a" },
      { clientName: "Acme", label: "b" },
      { clientName: "Zeta", label: "c" },
    ]);
    expect(groups.map((g) => g.clientName)).toEqual(["Acme", "Zeta"]);
    expect(groups.find((g) => g.clientName === "Zeta")!.items).toHaveLength(2);
  });
  it("returns empty for no items", () => {
    expect(groupByClient([])).toEqual([]);
  });
});
