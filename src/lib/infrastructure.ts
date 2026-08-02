import { prisma } from './db'

export async function getHostingRecords(workspaceId: string) {
  return prisma.hostingRecord.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      company: {
        select: { name: true, slug: true, primaryColor: true }
      }
    }
  })
}

export async function getDomainRecords(workspaceId: string) {
  return prisma.domainRecord.findMany({
    where: { workspaceId },
    orderBy: { expiryDate: 'asc' },
    include: {
      company: {
        select: { name: true, slug: true, primaryColor: true }
      }
    }
  })
}

// More CRUD methods will be added here for emails, subscriptions, and Coolify API sync logic.
