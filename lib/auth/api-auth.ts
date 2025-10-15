import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface AuthUser {
  userId: string
  role: string
  roles: string[]
  email: string
  name: string
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = await getToken({ 
    req,
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  if (!token) {
    return null
  }
  
  // Parse roles array from token, fallback to single role
  let rolesArray: string[] = []
  if (token.roles) {
    rolesArray = Array.isArray(token.roles) ? token.roles : [token.role as string]
  } else {
    rolesArray = [token.role as string]
  }
  
  return {
    userId: token.id as string,
    role: token.role as string,
    roles: rolesArray,
    email: token.email as string,
    name: token.name as string
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(req)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function requireRole(req: NextRequest, allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth(req)
  
  // Check if user has ANY of the allowed roles
  const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role))
  
  if (!hasAllowedRole) {
    throw new Error('Forbidden')
  }
  
  return user
}

export async function requireAnyRole(req: NextRequest, allowedRoles: string[]): Promise<AuthUser> {
  return requireRole(req, allowedRoles)
}

export async function requireAllRoles(req: NextRequest, requiredRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth(req)
  
  // Check if user has ALL of the required roles
  const hasAllRoles = requiredRoles.every(role => user.roles.includes(role))
  
  if (!hasAllRoles) {
    throw new Error('Forbidden')
  }
  
  return user
}

// Helper to get client ID from authenticated user
export async function getClientId(req: NextRequest): Promise<bigint | null> {
  try {
    const user = await requireAuth(req)
    const { prisma } = await import('@/lib/db/prisma')
    
    // Check if user has CLIENT role in their roles array
    if (!user.roles.includes('CLIENT')) {
      return null
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      include: { client: { where: { archivedAt: null } } }
    })
    
    // If user doesn't have an active client profile, create one
    if (dbUser && !dbUser.client) {
      const newClient = await prisma.client.create({
        data: {
          userId: BigInt(user.userId)
        }
      })
      return newClient.id
    }
    
    return dbUser?.client?.id || null
  } catch (error) {
    return null
  }
}

// Helper to get vendor ID from authenticated user
export async function getVendorId(req: NextRequest): Promise<bigint | null> {
  try {
    const user = await requireAuth(req)
    const { prisma } = await import('@/lib/db/prisma')
    
    // Check if user has VENDOR role in their roles array
    if (!user.roles.includes('VENDOR') && !user.roles.includes('ADMIN')) {
      return null
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      include: { vendor: true }
    })
    
    // Auto-create vendor profile if user has VENDOR role but no profile
    if (dbUser && !dbUser.vendor && user.roles.includes('VENDOR')) {
      const newVendor = await prisma.vendor.create({
        data: {
          userId: BigInt(user.userId)
        }
      })
      return newVendor.id
    }
    
    return dbUser?.vendor?.id || null
  } catch (error) {
    return null
  }
}
