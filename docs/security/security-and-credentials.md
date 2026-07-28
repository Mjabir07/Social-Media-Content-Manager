# Security and Credential Management

## Security objectives

- Prevent cross-company and cross-tenant access
- Keep secrets out of code, prompts, logs and the AZMIN database
- Limit agent and integration permissions
- Require approval for high-impact actions
- Preserve a readable audit trail
- Support revocation, rotation, backup and recovery

## Secret-storage rule

Use a dedicated secrets manager such as Infisical. AZMIN stores a `SecretReference`
with provider, vault/project ID, environment, purpose, status and rotation metadata.
It never stores the secret value.

## Credential hierarchy

```text
Tenant
└── Company
    └── Project or Service
        ├── Development
        ├── Preview
        └── Production
```

Credentials must not be reused across unrelated companies or environments.

## Access rules

- Use OAuth/provider apps instead of broad personal tokens.
- Use a GitHub App limited to selected repositories.
- Prefer short-lived credentials and workload identity/OIDC.
- Agents receive task-specific, time-bound access.
- Production database access is read-only by default.
- Production migrations require backup confirmation and approval.
- Secret reveal/export is manual-only and audited.
- Prefer client-owned accounts for client services.
- Rotate/revoke credentials when a relationship ends.

## Approval matrix

| Action | Default policy |
| --- | --- |
| Read project metadata | Automatic |
| Generate draft content/code | Automatic in isolation |
| Create branch or preview | Automatic when configured |
| Send email/WhatsApp | Approval required |
| Publish social content | Approval required |
| Issue invoice | Approval required |
| Merge or production deploy | Approval required |
| Production database migration | Approval required |
| Change DNS/email administration | Approval required |
| Make payment/accept contract | Manual only |
| Delete tenant/production data | Manual only with recovery plan |

## Required controls

- Multi-factor authentication for privileged accounts
- Encrypted transport and storage
- Rate limiting for authentication and public APIs
- Security headers and content security policy
- Secret, dependency and vulnerability scanning
- Structured security events and alerts
- Database/object-storage backups and restoration tests
- Incident response and credential revocation checklist
- Automated cross-tenant and cross-company access tests

