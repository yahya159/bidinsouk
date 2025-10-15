import { prisma } from '@/lib/db/prisma';
import { pusher } from '@/lib/realtime/pusher';

export async function createNotification(
  userId: bigint,
  type: string,
  title: string,
  body: string,
  payload?: any
) {
  // Create notification in database
  const notification = await prisma.notification.create({
    data: {
      userId: userId,
      type: type as any,
      title: title,
      body: body,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : null
    }
  });

  // Trigger Pusher event
  await pusher.trigger(`user-${userId}`, 'notification:new', {
    notification: {
      id: notification.id.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString()
    }
  });

  return notification;
}

export async function markNotificationAsRead(notificationId: bigint, userId: bigint) {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: userId
    },
    data: {
      readAt: new Date()
    }
  });

  return notification;
}

export async function getUnreadNotificationsCount(userId: bigint) {
  return prisma.notification.count({
    where: {
      userId: userId,
      readAt: null
    }
  });
}

export async function getUserNotifications(
  userId: bigint,
  options?: {
    unreadOnly?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }
) {
  const { unreadOnly = false, type, limit = 10, offset = 0 } = options || {};

  return prisma.notification.findMany({
    where: {
      userId: userId,
      ...(unreadOnly && { readAt: null }),
      ...(type && { type: type as any }) // Cast to NotificationType enum
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip: offset,
    take: limit
  });
}

export async function markAllAsRead(userId: bigint) {
  return prisma.notification.updateMany({
    where: {
      userId: userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });
}

// Aliases for backward compatibility
export const markAsRead = markNotificationAsRead;
export const getUnreadCount = getUnreadNotificationsCount;
