import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { OrderDetailPageClient } from '@/app/(admin)/admin-dashboard/orders/[id]/OrderDetailPageClient';

export const metadata = {
  title: 'Order Details | Admin Dashboard',
  description: 'View and manage order details',
};

async function getOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
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
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id.toString(),
      number: order.number,
      total: Number(order.total),
      status: order.status,
      fulfillStatus: order.fulfillStatus,
      shipping: order.shipping,
      timeline: (order.timeline as any) || [],
      createdAt: order.createdAt.toISOString(),
      user: {
        id: order.user.user.id.toString(),
        name: order.user.user.name,
        email: order.user.user.email,
        phone: order.user.user.phone || undefined,
        avatarUrl: order.user.user.avatarUrl || undefined,
      },
      store: {
        id: order.store.id.toString(),
        name: order.store.name,
        email: order.store.email,
        phone: order.store.phone || undefined,
        address: order.store.address,
        seller: {
          id: order.store.seller.user.id.toString(),
          name: order.store.seller.user.name,
          email: order.store.seller.user.email,
          phone: order.store.seller.user.phone || undefined,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderDetailPageClient order={order} />
    </Suspense>
  );
}
