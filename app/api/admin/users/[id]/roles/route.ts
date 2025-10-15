import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/api-auth'
import { getUserRoles, addRole, removeRole } from '@/lib/services/role-management'
import { ActivityLogger } from '@/lib/admin/activity-logger'
import { Role } from '@prisma/client'

// GET /api/admin/users/[id]/roles - Get all roles for a user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    await requireRole(request, ['ADMIN'])
    
    const userId = BigInt(params.id)
    const userRoles = await getUserRoles(userId)
    
    return NextResponse.json({
      primaryRole: userRoles.primaryRole,
      roles: userRoles.roles
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error fetching user roles:', error)
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 })
  }
}

// POST /api/admin/users/[id]/roles - Add a role to user
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    const admin = await requireRole(request, ['ADMIN'])
    
    const body = await request.json()
    const { role, cleanupOldData = false } = body
    
    // Validate role
    if (!role || !['CLIENT', 'VENDOR', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be CLIENT, VENDOR, or ADMIN' },
        { status: 400 }
      )
    }
    
    const userId = BigInt(params.id)
    const result = await addRole(userId, role as Role, cleanupOldData)
    
    // Log activity
    const activityLogger = new ActivityLogger()
    await activityLogger.log(
      BigInt(admin.userId),
      {
        action: 'ROLE_ADDED',
        entity: 'User',
        entityId: userId,
        metadata: {
          addedRole: role,
          cleanupOldData,
          newRoles: result.roles,
          newPrimaryRole: result.primaryRole
        }
      },
      request
    )
    
    return NextResponse.json({
      success: true,
      message: `Role ${role} added successfully`,
      primaryRole: result.primaryRole,
      roles: result.roles
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error adding role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id]/roles - Remove a role from user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    const admin = await requireRole(request, ['ADMIN'])
    
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    
    if (!role || !['CLIENT', 'VENDOR', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be CLIENT, VENDOR, or ADMIN' },
        { status: 400 }
      )
    }
    
    const userId = BigInt(params.id)
    const result = await removeRole(userId, role as Role)
    
    // Log activity
    const activityLogger = new ActivityLogger()
    await activityLogger.log(
      BigInt(admin.userId),
      {
        action: 'ROLE_REMOVED',
        entity: 'User',
        entityId: userId,
        metadata: {
          removedRole: role,
          newRoles: result.roles,
          newPrimaryRole: result.primaryRole
        }
      },
      request
    )
    
    return NextResponse.json({
      success: true,
      message: `Role ${role} removed successfully`,
      primaryRole: result.primaryRole,
      roles: result.roles
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.error('Error removing role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove role' },
      { status: 500 }
    )
  }
}

