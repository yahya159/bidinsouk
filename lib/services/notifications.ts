import { prisma } from '@/lib/db/prisma'

export async function createNotification(data: {
  userId: bigint
  type: 'ORDER' | 'AUCTION' | 'MESSAGE' | 'SYSTEM'
  title: string
  body: string
  payload?: any
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      payload: data.payload
    }
  })
}

export async function getUserNotifications(userId: bigint, filters?: {
  unreadOnly?: boolean
  type?: string
  limit?: number
  offset?: number
}) {
  const where: any = { userId }
  if (filters?.unreadOnly) where.readAt = null
  if (filters?.type) where.type = filters.type

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0
  })
}

export async function markAsRead(notificationId: bigint, userId: bigint) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() }
  })
}

export async function markAllAsRead(userId: bigint) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  })
}

export async function getUnreadCount(userId: bigint) {
  return prisma.notification.count({
    where: { userId, readAt: null }
  })
}

// Helper functions to send specific notifications
export async function notifyAuctionWon(userId: bigint, auctionId: bigint, productTitle: string) {
  return createNotification({
    userId,
    type: 'AUCTION',
    title: 'Félicitations ! Vous avez remporté l\'enchère',
    body: `Vous avez gagné l'enchère pour "${productTitle}"`,
    payload: { auctionId: auctionId.toString() }
  })
}

export async function notifyOutbid(userId: bigint, auctionId: bigint, productTitle: string) {
  return createNotification({
    userId,
    type: 'AUCTION',
    title: 'Vous avez été surenchéri',
    body: `Une nouvelle enchère a été placée sur "${productTitle}"`,
    payload: { auctionId: auctionId.toString() }
  })
}

export async function notifyOrderStatusChange(userId: bigint, orderId: bigint, status: string) {
  return createNotification({
    userId,
    type: 'ORDER',
    title: 'Mise à jour de votre commande',
    body: `Votre commande est maintenant: ${status}`,
    payload: { orderId: orderId.toString() }
  })
}

export async function notifyNewMessage(userId: bigint, threadId: bigint, senderName: string) {
  return createNotification({
    userId,
    type: 'MESSAGE',
    title: 'Nouveau message',
    body: `${senderName} vous a envoyé un message`,
    payload: { threadId: threadId.toString() }
  })
}
