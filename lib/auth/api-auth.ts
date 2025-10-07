import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface AuthUser {
  userId: string
  role: string
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
  
  return {
    userId: token.id as string,
    role: token.role as string,
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
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden')
  }
  
  return user
}

// Helper to get client ID from authenticated user
export async function getClientId(req: NextRequest): Promise<bigint> {
  const user = await requireAuth(req)
  const { prisma } = await import('@/lib/db/prisma')
  
  const dbUser = await prisma.user.findUnique({
    where: { id: BigInt(user.userId) },
    include: { client: true }
  })
  
  if (!dbUser?.client) {
    throw new Error('User is not a client')
  }
  
  return dbUser.client.id
}

// Helper to get vendor ID from authenticated user
export async function getVendorId(req: NextRequest): Promise<bigint> {
  const user = await requireRole(req, ['VENDOR', 'ADMIN'])
  const { prisma } = await import('@/lib/db/prisma')
  
  const dbUser = await prisma.user.findUnique({
    where: { id: BigInt(user.userId) },
    include: { vendor: true }
  })
  
  if (!dbUser?.vendor) {
    throw new Error('User is not a vendor')
  }
  
  return dbUser.vendor.id
}
