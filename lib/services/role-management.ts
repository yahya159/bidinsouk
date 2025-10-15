import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

/**
 * Role Management Service
 * Handles multi-role capabilities for users (CLIENT + VENDOR dual roles)
 */

export interface UserRoles {
  primaryRole: Role
  roles: Role[]
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: bigint): Promise<UserRoles> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, roles: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Parse roles from JSON field, fallback to primary role
  let rolesArray: Role[] = []
  if (user.roles) {
    try {
      const parsed = typeof user.roles === 'string' 
        ? JSON.parse(user.roles) 
        : user.roles
      rolesArray = Array.isArray(parsed) ? parsed : [user.role]
    } catch {
      rolesArray = [user.role]
    }
  } else {
    rolesArray = [user.role]
  }

  return {
    primaryRole: user.role,
    roles: rolesArray,
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: bigint, role: Role): Promise<boolean> {
  const userRoles = await getUserRoles(userId)
  return userRoles.roles.includes(role)
}

/**
 * Add a role to a user
 * @param cleanupOldData - If true, delete old client data when adding VENDOR role
 */
export async function addRole(
  userId: bigint,
  newRole: Role,
  cleanupOldData: boolean = false
): Promise<UserRoles> {
  const currentRoles = await getUserRoles(userId)

  // If user already has this role, do nothing
  if (currentRoles.roles.includes(newRole)) {
    return currentRoles
  }

  // Special handling for VENDOR role upgrade
  if (newRole === 'VENDOR' && cleanupOldData) {
    return await upgradeToVendor(userId, cleanupOldData)
  }

  // Add the new role to the array
  const updatedRoles = [...currentRoles.roles, newRole]

  // Update user with new roles
  await prisma.user.update({
    where: { id: userId },
    data: {
      roles: JSON.stringify(updatedRoles),
      // Update primary role to the new role
      role: newRole,
    },
  })

  // Create profile if needed
  await ensureProfileExists(userId, newRole)

  return {
    primaryRole: newRole,
    roles: updatedRoles,
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: bigint, roleToRemove: Role): Promise<UserRoles> {
  const currentRoles = await getUserRoles(userId)

  // Can't remove the last role
  if (currentRoles.roles.length === 1) {
    throw new Error('Cannot remove the last role from a user')
  }

  // Remove the role
  const updatedRoles = currentRoles.roles.filter(r => r !== roleToRemove)

  // If removing the primary role, set a new primary
  let newPrimaryRole = currentRoles.primaryRole
  if (currentRoles.primaryRole === roleToRemove) {
    newPrimaryRole = updatedRoles[0]
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      roles: JSON.stringify(updatedRoles),
      role: newPrimaryRole,
    },
  })

  // Delete the profile for removed role
  await deleteProfile(userId, roleToRemove)

  return {
    primaryRole: newPrimaryRole,
    roles: updatedRoles,
  }
}

/**
 * Upgrade a client to vendor with optional data cleanup
 * This is the main function for the vendor upgrade flow
 */
export async function upgradeToVendor(
  userId: bigint,
  cleanupOldData: boolean = true
): Promise<UserRoles> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      client: true,
      vendor: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if already a vendor
  const currentRoles = await getUserRoles(userId)
  if (currentRoles.roles.includes('VENDOR')) {
    throw new Error('User is already a vendor')
  }

  return await prisma.$transaction(async (tx) => {
    let clientId = user.client?.id

    // If cleanup is requested and user has client data
    if (cleanupOldData && clientId) {
      console.log(`🗑️  Cleaning up old client data for user ${userId}...`)

      // Delete all client-specific data
      await tx.bid.deleteMany({ where: { clientId } })
      await tx.watchlistItem.deleteMany({ where: { clientId } })
      await tx.review.deleteMany({ where: { clientId } })
      await tx.savedSearch.deleteMany({ where: { clientId } })
      await tx.orderRequest.deleteMany({ where: { userId } })
      
      // Orders might have complex relations, handle carefully
      const orders = await tx.order.findMany({ 
        where: { userId: clientId },
        select: { id: true }
      })
      
      for (const order of orders) {
        // Delete message threads related to orders
        await tx.messageThread.deleteMany({ where: { orderId: order.id } })
      }
      
      await tx.order.deleteMany({ where: { userId: clientId } })

      // Delete the old client profile (cascade deletes handled above)
      await tx.client.delete({
        where: { id: clientId },
      })

      console.log(`✅ Cleaned up old client data and deleted old profile`)

      // Create fresh client profile
      const newClient = await tx.client.create({
        data: { userId },
      })
      
      clientId = newClient.id
      console.log(`✅ Created fresh client profile`)
    } else if (!user.client) {
      // Create client profile if it doesn't exist
      const newClient = await tx.client.create({
        data: { userId },
      })
      clientId = newClient.id
    }

    // Create vendor profile if it doesn't exist
    if (!user.vendor) {
      await tx.vendor.create({
        data: { userId },
      })
      console.log(`✅ Created vendor profile`)
    }

    // Update user roles
    const updatedRoles = [...new Set([...currentRoles.roles, 'VENDOR'])] as Role[]

    await tx.user.update({
      where: { id: userId },
      data: {
        roles: JSON.stringify(updatedRoles),
        role: 'VENDOR', // Primary role becomes VENDOR
      },
    })

    console.log(`✅ Updated user roles to ${JSON.stringify(updatedRoles)}`)

    return {
      primaryRole: 'VENDOR' as Role,
      roles: updatedRoles,
    }
  })
}

/**
 * Ensure a profile exists for the given role
 */
async function ensureProfileExists(userId: bigint, role: Role): Promise<void> {
  switch (role) {
    case 'CLIENT':
      const existingClient = await prisma.client.findUnique({
        where: { userId },
      })
      if (!existingClient) {
        await prisma.client.create({
          data: { userId },
        })
      }
      break

    case 'VENDOR':
      const existingVendor = await prisma.vendor.findUnique({
        where: { userId },
      })
      if (!existingVendor) {
        await prisma.vendor.create({
          data: { userId },
        })
      }
      break

    case 'ADMIN':
      const existingAdmin = await prisma.admin.findUnique({
        where: { userId },
      })
      if (!existingAdmin) {
        await prisma.admin.create({
          data: { userId },
        })
      }
      break
  }
}

/**
 * Delete a profile for a specific role
 */
async function deleteProfile(userId: bigint, role: Role): Promise<void> {
  switch (role) {
    case 'CLIENT':
      await prisma.client.deleteMany({ where: { userId } })
      break

    case 'VENDOR':
      await prisma.vendor.deleteMany({ where: { userId } })
      break

    case 'ADMIN':
      await prisma.admin.deleteMany({ where: { userId } })
      break
  }
}

/**
 * Initialize roles for a new user (called during registration)
 */
export async function initializeUserRoles(userId: bigint, initialRole: Role = 'CLIENT'): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: initialRole,
      roles: JSON.stringify([initialRole]),
    },
  })

  // Create the appropriate profile
  await ensureProfileExists(userId, initialRole)
}

