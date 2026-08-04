import { describe, expect, it, vi } from "vitest";
import { coolifyUrl } from "@/lib/coolify";

vi.mock("server-only", () => ({}));

describe("coolifyUrl", () => {
  it("joins base and path without double slashes", () => {
    expect(coolifyUrl("https://c.example.com", "/api/v1/version")).toBe("https://c.example.com/api/v1/version");
  });
  it("trims trailing slashes on the base URL", () => {
    expect(coolifyUrl("https://c.example.com///", "/api/v1/version")).toBe("https://c.example.com/api/v1/version");
  });
  it("adds a leading slash to the path when missing", () => {
    expect(coolifyUrl("https://c.example.com", "api/v1/applications")).toBe("https://c.example.com/api/v1/applications");
  });
});
