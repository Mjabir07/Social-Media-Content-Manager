import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_VERSION = 1;

function getMasterKey() {
  const encoded = process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!encoded) {
    throw new Error(
      "API Vault is locked. Configure AZMIN_CREDENTIAL_ENCRYPTION_KEY in the server environment.",
    );
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error(
      "AZMIN_CREDENTIAL_ENCRYPTION_KEY must be a 32-byte base64 value.",
    );
  }
  return key;
}

function aad(workspaceId: string, provider: string, keyVersion: number) {
  return Buffer.from(`azmin:${workspaceId}:${provider}:v${keyVersion}`, "utf8");
}

export function isCredentialVaultReady() {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}

export function maskSecret(value: string) {
  const trimmed = value.trim();
  const suffix = trimmed.slice(-4);
  return `••••••••${suffix}`;
}

export function encryptCredential(input: {
  secret: string;
  workspaceId: string;
  provider: string;
}) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv);
  cipher.setAAD(aad(input.workspaceId, input.provider, KEY_VERSION));
  const encrypted = Buffer.concat([
    cipher.update(input.secret, "utf8"),
    cipher.final(),
  ]);
  return {
    encryptedValue: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: KEY_VERSION,
    maskedValue: maskSecret(input.secret),
  };
}

export function decryptCredential(input: {
  encryptedValue: string;
  iv: string;
  authTag: string;
  keyVersion: number;
  workspaceId: string;
  provider: string;
}) {
  const decipher = createDecipheriv(
    ALGORITHM,
    getMasterKey(),
    Buffer.from(input.iv, "base64"),
  );
  decipher.setAAD(aad(input.workspaceId, input.provider, input.keyVersion));
  decipher.setAuthTag(Buffer.from(input.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(input.encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
