import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function createUser(data: {
  email: string
  name: string
  password: string
  phone?: string
  locale?: string
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10)
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      phone: data.phone,
      locale: data.locale || 'fr',
      role: 'CLIENT',
      client: { create: {} }
    }
  })

  return user
}

export async function updateUserProfile(userId: bigint, data: {
  name?: string
  phone?: string
  avatarUrl?: string
  locale?: string
}) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      locale: true,
      role: true
    }
  })
}

export async function getUserById(userId: bigint) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      locale: true,
      role: true,
      createdAt: true
    }
  })
}