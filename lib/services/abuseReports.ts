import { prisma } from '@/lib/db/prisma'

export async function createAbuseReport(data: {
  reporterId: bigint
  targetType: string
  targetId: bigint
  reason: string
  details?: string
}) {
  return prisma.abuseReport.create({
    data: {
      reporterId: data.reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      details: data.details,
      status: 'OPEN'
    }
  })
}

export async function getAbuseReports(filters?: {
  status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'
  targetType?: string
  limit?: number
  offset?: number
}) {
  const where: any = {}
  if (filters?.status) where.status = filters.status
  if (filters?.targetType) where.targetType = filters.targetType

  const [reports, total] = await Promise.all([
    prisma.abuseReport.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    }),
    prisma.abuseReport.count({ where })
  ])

  return { reports, total }
}

export async function updateAbuseReportStatus(
  reportId: bigint,
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'
) {
  return prisma.abuseReport.update({
    where: { id: reportId },
    data: { status }
  })
}

export async function getAbuseReportById(reportId: bigint) {
  return prisma.abuseReport.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: { id: true, name: true, email: true }
      }
    }
  })
}