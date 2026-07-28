import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  decryptCredential,
  encryptCredential,
  isCredentialVaultReady,
  maskSecret,
} from "@/lib/integrations/credential-crypto";

const previousKey = process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY;
  } else {
    process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY = previousKey;
  }
});

describe("API Vault credential encryption", () => {
  it("round-trips a secret without storing it in plaintext", () => {
    const secret = "provider-secret-value-1234";
    const encrypted = encryptCredential({
      secret,
      workspaceId: "workspace-a",
      provider: "GEMINI",
    });
    expect(encrypted.encryptedValue).not.toContain(secret);
    expect(encrypted.maskedValue).toBe("••••••••1234");
    expect(
      decryptCredential({
        ...encrypted,
        workspaceId: "workspace-a",
        provider: "GEMINI",
      }),
    ).toBe(secret);
  });

  it("rejects ciphertext moved to another workspace", () => {
    const encrypted = encryptCredential({
      secret: "provider-secret-value-1234",
      workspaceId: "workspace-a",
      provider: "GEMINI",
    });
    expect(() =>
      decryptCredential({
        ...encrypted,
        workspaceId: "workspace-b",
        provider: "GEMINI",
      }),
    ).toThrow();
  });

  it("rejects ciphertext moved to another provider", () => {
    const encrypted = encryptCredential({
      secret: "provider-secret-value-1234",
      workspaceId: "workspace-a",
      provider: "GEMINI",
    });
    expect(() =>
      decryptCredential({
        ...encrypted,
        workspaceId: "workspace-a",
        provider: "ANTHROPIC",
      }),
    ).toThrow();
  });

  it("reports vault readiness only for a valid 32-byte key", () => {
    expect(isCredentialVaultReady()).toBe(true);
    process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY = "invalid";
    expect(isCredentialVaultReady()).toBe(false);
  });

  it("masks all but the final four characters", () => {
    expect(maskSecret("AIza-example-9876")).toBe("••••••••9876");
  });
});
