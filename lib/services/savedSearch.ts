import { prisma } from '@/lib/db/prisma'

export async function saveSearch(clientId: bigint, query: any) {
  return prisma.savedSearch.create({
    data: {
      clientId,
      query
    }
  })
}

export async function getSavedSearches(clientId: bigint) {
  return prisma.savedSearch.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function deleteSavedSearch(id: bigint, clientId: bigint) {
  return prisma.savedSearch.deleteMany({
    where: { id, clientId }
  })
}
