/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst({ where: { name: "AZMIN Digital" } });
  if (!workspace) throw new Error("AZMIN Digital workspace not found");

  let company = await prisma.company.findFirst({
    where: { workspaceId: workspace.id, isHeadquarters: true },
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: "AZMIN Digital",
        slug: "azmin-digital",
        relationshipType: "OWN_BRAND",
        industry: "Digital services and AI automation",
        description: "AZMIN Digital headquarters for agency services, software products, automation and partnerships.",
        isHeadquarters: true,
        brandProfile: {
          create: {
            tagline: "One intelligent workspace for digital growth.",
            brandVoice: "Professional, modern, confident, practical and solution-focused.",
            targetAudiences: JSON.stringify(["Small and medium businesses", "Founders and service companies", "Digital transformation clients"]),
            offerings: JSON.stringify(["Digital marketing", "Website and application development", "AI automation", "AZMIN Pulse", "Infrastructure and managed services"]),
            differentiators: JSON.stringify(["End-to-end execution", "AI-assisted workflows with human approval", "Simple and transparent service management"]),
          },
        },
        brain: {
          create: {
            companyFacts: "AZMIN Digital is a solo-led digital agency and technology brand. It delivers marketing, development, automation, managed digital services and AZMIN Pulse.",
            contentGuidance: "Communicate clearly, professionally and practically. Focus on useful outcomes and avoid unnecessary complexity.",
            aiInstructions: "Keep every client and partner context isolated. Never use another company's facts, credentials or instructions. Require approval for external publishing, payments, deployments and credential changes.",
            knowledgeStatus: "CONFIGURED",
          },
        },
      },
    });
  }
  console.log(JSON.stringify({ workspace: workspace.name, company: company.name, companyId: company.id, headquarters: true }));
}

main().finally(() => prisma.$disconnect());
