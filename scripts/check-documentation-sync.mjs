import { execFileSync } from "node:child_process";

const mappings = [
  { code: ["src/app/azmin/services/", "src/app/api/services/", "src/components/azmin/services", "src/lib/services"], docs: ["docs/modules/services-and-engagements.md", "docs/workflows/generated-workflow-catalogue.md"] },
  { code: ["src/app/azmin/smm/", "src/app/api/smm/", "src/components/azmin/smm", "src/lib/smm"], docs: ["docs/modules/digital-marketing-and-branding.md", "docs/modules/social-media-management.md", "docs/workflows/smm-delivery-agent.md"] },
  { code: ["src/app/api/leads/", "src/components/azmin/leads", "src/lib/leads"], docs: ["docs/workflows/agency-service-delivery.md", "docs/workflows/core-workflows.md"] },
  { code: ["src/app/azmin/development/", "src/components/azmin/development", "src/lib/dev-studio"], docs: ["docs/workflows/agency-service-delivery.md", "docs/roadmap/phase-05-development-studio.md"] },
  { code: ["src/lib/agents", "src/components/azmin/company-agents"], docs: ["docs/architecture/agency-operating-model.md", "docs/workflows/agency-service-delivery.md"] }
];

let changed = [];
try {
  const base = process.env.DOCS_SYNC_BASE || "HEAD^";
  changed = execFileSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean).map((file) => file.replaceAll("\\", "/"));
} catch (error) {
  if (process.env.GITHUB_ACTIONS) {
    console.error("Documentation sync mapping could not inspect Git history.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  console.warn("Documentation sync mapping skipped locally: Git history is unavailable to the Node process.");
  process.exit(0);
}

const failures = [];
for (const mapping of mappings) {
  if (!changed.some((file) => mapping.code.some((prefix) => file.startsWith(prefix)))) continue;
  if (!changed.some((file) => mapping.docs.includes(file))) failures.push(mapping);
}

if (failures.length) {
  console.error("Code changed without its mapped workflow documentation:");
  for (const failure of failures) console.error(`- ${failure.code.join(", ")} requires one of: ${failure.docs.join(", ")}`);
  process.exit(1);
}
console.log("Mapped code and workflow documentation changes are synchronized.");
