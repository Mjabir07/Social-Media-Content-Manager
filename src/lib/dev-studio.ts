import { prisma } from "@/lib/db";
import {
  isDevProjectStatus,
  isRepoProvider,
  deriveRepoUrl,
  parseBranches,
  serializeBranches,
  type DevProjectStatus,
  type RepoProvider,
} from "@/lib/dev-studio-catalog";

/**
 * Development Studio (DB access). Workspace-scoped, dev projects soft-deleted
 * (deletedAt). Each dev project carries its tracked repositories. Pure logic
 * lives in "@/lib/dev-studio-catalog" and is re-exported.
 */
export * from "@/lib/dev-studio-catalog";

export type RepositoryDTO = {
  id: string;
  provider: RepoProvider;
  fullName: string;
  url: string;
  defaultBranch: string;
  branches: string[];
  visibility: string;
};

export type DevProjectWithRepos = {
  id: string;
  companyId: string | null;
  name: string;
  description: string | null;
  status: DevProjectStatus;
  productionUrl: string | null;
  createdAt: Date;
  repositories: RepositoryDTO[];
};

function toRepoDTO(r: {
  id: string;
  provider: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  branches: string;
  visibility: string;
}): RepositoryDTO {
  return {
    id: r.id,
    provider: (isRepoProvider(r.provider) ? r.provider : "other"),
    fullName: r.fullName,
    url: r.url,
    defaultBranch: r.defaultBranch,
    branches: parseBranches(r.branches),
    visibility: r.visibility,
  };
}

export async function getDevProjects(workspaceId: string, companyId?: string): Promise<DevProjectWithRepos[]> {
  const rows = await prisma.devProject.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: { repositories: { orderBy: { createdAt: "asc" } } },
  });
  return rows.map((p) => ({
    id: p.id,
    companyId: p.companyId,
    name: p.name,
    description: p.description,
    status: (isDevProjectStatus(p.status) ? p.status : "ACTIVE"),
    productionUrl: p.productionUrl,
    createdAt: p.createdAt,
    repositories: p.repositories.map(toRepoDTO),
  }));
}

export type DevProjectInput = {
  name: string;
  description?: string | null;
  status?: DevProjectStatus;
  companyId?: string | null;
  productionUrl?: string | null;
};

function normalizeUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u.replace(/\/+$/, "") : `https://${u.replace(/\/+$/, "")}`;
}

export async function createDevProject(workspaceId: string, createdById: string | null, input: DevProjectInput) {
  return prisma.devProject.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: isDevProjectStatus(input.status) ? input.status : "ACTIVE",
      productionUrl: normalizeUrl(input.productionUrl),
    },
  });
}

export async function updateDevProject(workspaceId: string, id: string, patch: Partial<DevProjectInput>) {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.description !== undefined) data.description = patch.description?.trim() || null;
  if (patch.status !== undefined && isDevProjectStatus(patch.status)) data.status = patch.status;
  if (patch.companyId !== undefined) data.companyId = patch.companyId ?? null;
  if (patch.productionUrl !== undefined) data.productionUrl = normalizeUrl(patch.productionUrl);
  const result = await prisma.devProject.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

// Soft delete the dev project. Its repositories cascade-delete with it in the
// DB, but since we only flag deletedAt we leave the rows and just hide the
// project — repositories return with it if restored later.
export async function deleteDevProject(workspaceId: string, id: string) {
  const result = await prisma.devProject.updateMany({
    where: { id, workspaceId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count;
}

export type RepositoryInput = {
  provider?: RepoProvider;
  fullName: string;
  url?: string | null;
  defaultBranch?: string;
  branches?: string[];
  visibility?: string;
};

// Add a repository to a live dev project. Returns null if the project is not
// found in this workspace, or if we can't build a usable repo URL.
export async function addRepository(workspaceId: string, devProjectId: string, input: RepositoryInput) {
  const project = await prisma.devProject.findFirst({
    where: { id: devProjectId, workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!project) return null;

  const provider: RepoProvider = isRepoProvider(input.provider) ? input.provider : "github";
  const fullName = input.fullName.trim();
  const url = deriveRepoUrl(provider, fullName, input.url);
  if (!url) return null;

  const created = await prisma.repository.create({
    data: {
      workspaceId,
      devProjectId,
      provider,
      fullName,
      url,
      defaultBranch: input.defaultBranch?.trim() || "main",
      branches: serializeBranches(input.branches ?? []),
      visibility: input.visibility === "public" ? "public" : "private",
    },
  });
  return toRepoDTO(created);
}

export async function updateRepository(workspaceId: string, id: string, patch: Partial<RepositoryInput>) {
  const data: Record<string, unknown> = {};
  if (patch.provider !== undefined && isRepoProvider(patch.provider)) data.provider = patch.provider;
  if (patch.fullName !== undefined) data.fullName = patch.fullName.trim();
  if (patch.defaultBranch !== undefined) data.defaultBranch = patch.defaultBranch.trim() || "main";
  if (patch.branches !== undefined) data.branches = serializeBranches(patch.branches);
  if (patch.visibility !== undefined) data.visibility = patch.visibility === "public" ? "public" : "private";
  if (patch.url !== undefined || patch.fullName !== undefined || patch.provider !== undefined) {
    // Recompute the URL when any of its inputs change.
    const existing = await prisma.repository.findFirst({ where: { id, workspaceId } });
    if (existing) {
      const provider: RepoProvider = isRepoProvider((data.provider as string) ?? existing.provider)
        ? ((data.provider as RepoProvider) ?? (existing.provider as RepoProvider))
        : "other";
      const fullName = (data.fullName as string) ?? existing.fullName;
      const url = deriveRepoUrl(provider, fullName, patch.url ?? existing.url);
      if (url) data.url = url;
    }
  }
  const result = await prisma.repository.updateMany({ where: { id, workspaceId }, data });
  return result.count;
}

export async function deleteRepository(workspaceId: string, id: string) {
  const result = await prisma.repository.deleteMany({ where: { id, workspaceId } });
  return result.count;
}
