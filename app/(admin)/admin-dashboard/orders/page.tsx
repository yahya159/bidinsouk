import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { OrdersPageClient } from './OrdersPageClient';

export const metadata = {
  title: 'Orders Management | Admin Dashboard',
  description: 'Manage all orders in the system',
};

async function getInitialOrders() {
  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          store: {
            include: {
              seller: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      }),
      prisma.order.count(),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id.toString(),
        number: order.number,
        total: Number(order.total),
        status: order.status,
        fulfillStatus: order.fulfillStatus,
        shipping: order.shipping,
        timeline: order.timeline,
        createdAt: order.createdAt.toISOString(),
        user: {
          id: order.user.user.id.toString(),
          name: order.user.user.name,
          email: order.user.user.email,
        },
        store: {
          id: order.store.id.toString(),
          name: order.store.name,
          seller: {
            id: order.store.seller.user.id.toString(),
            name: order.store.seller.user.name,
            email: order.store.seller.user.email,
          },
        },
      })),
      total,
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], total: 0 };
  }
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const { orders, total } = await getInitialOrders();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersPageClient initialOrders={orders} initialTotal={total} />
    </Suspense>
  );
}
