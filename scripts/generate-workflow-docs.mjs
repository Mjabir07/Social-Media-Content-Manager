import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const registryPath = resolve(root, "docs/workflows/workflow-registry.json");
const outputPath = resolve(root, "docs/workflows/generated-workflow-catalogue.md");
const registry = JSON.parse(await readFile(registryPath, "utf8"));

const lines = [
  "# Generated Workflow Catalogue",
  "",
  "<!-- GENERATED FILE: edit workflow-registry.json, then run npm run docs:generate. -->",
  "",
  `**Registry version:** ${registry.version}  `,
  `**Registry updated:** ${registry.updatedAt}`,
  "",
  "## Universal lifecycle",
  "",
  registry.lifecycle.join(" → "),
  "",
  "## Registered workflows",
  "",
  "| Category | Workflow | Trigger | Outcome | Approval gate |",
  "| --- | --- | --- | --- | --- |",
  ...registry.workflows.map((workflow) =>
    `| ${workflow.category} | [${workflow.name}](${workflow.document}) | ${workflow.trigger} | ${workflow.outcome} | ${workflow.approval} |`,
  ),
  "",
  "## Stage definitions",
  "",
  ...registry.workflows.flatMap((workflow) => [
    `### ${workflow.name}`,
    "",
    workflow.stages.join(" → "),
    "",
  ]),
];
const generated = `${lines.join("\n")}\n`;
const mode = process.argv.includes("--check") ? "check" : "write";

if (mode === "check") {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== generated) {
    console.error("Workflow documentation is out of sync. Run: npm run docs:generate");
    process.exit(1);
  }
  console.log(`Workflow documentation is synchronized (${registry.workflows.length} workflows).`);
} else {
  await writeFile(outputPath, generated, "utf8");
  console.log(`Generated ${outputPath} from ${registry.workflows.length} workflows.`);
}
