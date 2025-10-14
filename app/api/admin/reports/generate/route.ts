import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId, role }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, dateRange } = await req.json()

    // Créer un rapport en fonction du type
    let reportData: any = {}
    let reportTitle = ''
    
    switch (type) {
      case 'sales':
        reportTitle = 'Rapport des Ventes'
        // Récupérer les données de ventes
        const salesData = await prisma.order.findMany({
          include: {
            store: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        
        reportData = {
          totalSales: salesData.reduce((sum, order) => sum + Number(order.total), 0),
          totalOrders: salesData.length,
          averageOrderValue: salesData.length > 0 ? 
            salesData.reduce((sum, order) => sum + Number(order.total), 0) / salesData.length : 0,
          orders: salesData.map(order => ({
            id: order.id.toString(),
            number: order.number,
            total: Number(order.total),
            store: order.store.name,
            createdAt: order.createdAt.toISOString()
          }))
        }
        break
        
      case 'inventory':
        reportTitle = 'Rapport d\'Inventaire'
        // Récupérer les données d'inventaire
        const inventoryData = await prisma.product.findMany({
          select: {
            id: true,
            title: true,
            store: {
              select: {
                name: true
              }
            }
          }
        })
        
        reportData = {
          totalProducts: inventoryData.length,
          products: inventoryData.map(product => ({
            id: product.id.toString(),
            title: product.title,
            store: product.store?.name
          }))
        }
        break
        
      case 'users':
        reportTitle = 'Rapport des Utilisateurs'
        // Récupérer les données des utilisateurs
        const userData = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        
        reportData = {
          totalUsers: userData.length,
          usersByRole: {
            CLIENT: userData.filter(u => u.role === 'CLIENT').length,
            VENDOR: userData.filter(u => u.role === 'VENDOR').length,
            ADMIN: userData.filter(u => u.role === 'ADMIN').length
          },
          users: userData.map(user => ({
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString()
          }))
        }
        break
        
      default:
        reportTitle = 'Rapport Général'
        reportData = { message: 'Type de rapport non supporté' }
    }

    // Créer une entrée dans les logs d'audit
    const auditLog = await prisma.auditLog.create({
      data: {
        actorId: BigInt(user.userId),
        entity: 'Report',
        entityId: BigInt(Date.now()), // ID temporaire
        diff: reportData,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      id: auditLog.id.toString(),
      title: `${reportTitle} - ${new Date().toLocaleDateString('fr-FR')}`,
      type,
      status: 'completed',
      createdAt: auditLog.createdAt.toISOString(),
      data: reportData
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}