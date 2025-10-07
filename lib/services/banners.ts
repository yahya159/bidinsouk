import { prisma } from '@/lib/db/prisma'

export async function createBanner(data: {
  slot: string
  content: any
}) {
  return prisma.banner.create({
    data: {
      slot: data.slot,
      content: data.content
    }
  })
}

export async function getBannersBySlot(slot: string) {
  return prisma.banner.findMany({
    where: { slot }
  })
}

export async function updateBanner(bannerId: bigint, content: any) {
  return prisma.banner.update({
    where: { id: bannerId },
    data: { content }
  })
}

export async function deleteBanner(bannerId: bigint) {
  return prisma.banner.delete({
    where: { id: bannerId }
  })
}

export async function getAllBanners() {
  return prisma.banner.findMany({
    orderBy: { slot: 'asc' }
  })
}
