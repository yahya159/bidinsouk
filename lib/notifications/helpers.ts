import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/realtime/pusher'
import { NotificationType } from '@prisma/client'

export async function sendNotification(
  userId: number,
  type: NotificationType,
  title: string,
  body: string,
  payload?: any
) {
  try {
    // Save notification to database
    const notification = await prisma.notification.create({
      data: {
        userId: BigInt(userId),
        type,
        title,
        body,
        payload
      }
    })
    
    // Trigger Pusher event
    await pusher.trigger(`user-${userId}`, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt
    })
    
    return notification
  } catch (error) {
    console.error('Failed to send notification:', error)
    throw error
  }
}
