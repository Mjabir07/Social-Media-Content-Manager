# Integrations & API Vault

## Purpose

The API Vault gives the AZMIN workspace owner one place to manage server-side
credentials for AI, research, and automation providers. The catalogue includes
Google Gemini, GroqCloud, Cloudflare Workers AI, OpenRouter, Anthropic Claude,
Tavily Search, Firecrawl, and Apify.

Route: `/azmin/settings/integrations`

## Security model

- Only a workspace `OWNER` can list metadata, save/replace a key, test it, or
  enable/disable it. The API repeats the role check server-side.
- The browser submits a new secret once over HTTPS. The raw value is not returned.
- The database stores AES-256-GCM ciphertext, a random 12-byte IV, authentication
  tag, key version, and masked suffix.
- Additional authenticated data binds ciphertext to both `workspaceId` and
  `provider`, preventing a row from being moved into another tenant/provider slot.
- `AZMIN_CREDENTIAL_ENCRYPTION_KEY` is a separate 32-byte base64 master key kept
  in local/Vercel server environment settings, never in the database.
- Connection tests decrypt only on the server. Audit events contain provider
  names and test status, never secret values.
- The portal intentionally has no reveal or copy-saved-key function.

## Setup

1. Generate 32 cryptographically random bytes and encode them as base64.
2. Set `AZMIN_CREDENTIAL_ENCRYPTION_KEY` in `.env` for local development.
3. Add the same value to Vercel environment settings and redeploy.
4. Apply migration `20260728143000_provider_api_vault`.
5. Open the API Vault, add a provider key, and run **Test connection**.

Cloudflare uses one encrypted value: `ACCOUNT_ID:API_TOKEN`.
Do not paste production credentials into chat, documentation, source control, or
issue trackers.

## Credential lifecycle

- **Add / replace:** encrypts a new value and clears previous test metadata.
- **Test:** makes a minimal authenticated request and stores only the result,
  message, and time.
- **Disable:** keeps the encrypted value for recovery but prevents operational use.
- **Enable:** restores operational use and opts that provider into routing.
- **Rotate:** replace and test the key in AZMIN, then revoke the old provider key.

## Operational use

Company website enrichment resolves active workspace credentials from the vault.
Gemini and Anthropic environment keys remain supported during migration. Public
company evidence can automatically pass to the next enabled AI provider when an
attempt fails. Private Company Brain instructions and credentials are excluded.

The implemented generator order is Gemini, Groq, Cloudflare, OpenRouter, then
Anthropic. Tavily supplies source-backed research when direct website extraction
fails. Firecrawl and Apify are registered and testable for later advanced browser
and automation workflows.

See [AI Provider Router](ai-provider-router.md).

## Recovery warning

Back up the master key in a trusted password manager. Losing it makes existing
database ciphertext unrecoverable. If the master key is suspected to be exposed,
disable affected credentials, rotate provider keys, and re-encrypt them under a
new master key using a planned rotation procedure.