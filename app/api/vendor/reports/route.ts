import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId, role }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') || undefined

    // Récupérer les rapports liés au vendeur
    const whereClause: any = {
      vendorId: BigInt(user.userId)
    }
    
    if (type) {
      whereClause.type = type
    }

    const reports = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.auditLog.count({
      where: whereClause
    })

    // Convertir les BigInt en string pour la sérialisation
    const serializedReports = reports.map(report => ({
      ...report,
      id: report.id.toString(),
      actorId: report.actorId.toString(),
      vendorId: report.vendorId?.toString(),
      createdAt: report.createdAt.toISOString(),
      actor: {
        id: report.actor.id.toString(),
        name: report.actor.name
      }
    }))

    return NextResponse.json({ reports: serializedReports, total })
  } catch (error: any) {
    console.error('Error fetching vendor reports:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}