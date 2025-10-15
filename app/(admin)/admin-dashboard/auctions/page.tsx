import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin/permissions';
import { prisma } from '@/lib/db/prisma';
import { Title, Container } from '@mantine/core';
import { AuctionsTable } from '@/components/admin/auctions/AuctionsTable';

export default async function AuctionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAdmin(session)) {
    redirect('/unauthorized');
  }

  // Fetch initial auctions
  const page = 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const [auctions, totalCount] = await Promise.all([
    prisma.auction.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            seller: {
              select: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        bids: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.auction.count(),
  ]);

  // Serialize auctions
  const serializedAuctions = auctions.map((auction) => ({
    id: auction.id.toString(),
    title: auction.title,
    currentBid: auction.currentBid.toString(),
    startPrice: auction.startPrice.toString(),
    status: auction.status,
    endAt: auction.endAt,
    category: auction.category,
    product: auction.product
      ? {
          id: auction.product.id.toString(),
          title: auction.product.title,
        }
      : null,
    store: {
      id: auction.store.id.toString(),
      name: auction.store.name,
      seller: {
        user: {
          name: auction.store.seller.user.name,
          email: auction.store.seller.user.email,
        },
      },
    },
    bidCount: auction.bids.length,
    createdAt: auction.createdAt,
  }));

  return (
    <Container size="xl" py="md">
      <Title order={2} mb="lg">Auctions</Title>

      <AuctionsTable
        initialAuctions={serializedAuctions}
        initialTotalCount={totalCount}
        initialPage={page}
        initialPageSize={pageSize}
      />
    </Container>
  );
}
