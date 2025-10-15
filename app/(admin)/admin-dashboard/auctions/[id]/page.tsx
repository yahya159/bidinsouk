import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/admin/permissions';
import { prisma } from '@/lib/db/prisma';
import { Container, Stack, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { AuctionDetailCard } from '@/components/admin/auctions/AuctionDetailCard';
import { BidHistoryTable } from '@/components/admin/auctions/BidHistoryTable';

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || !isAdmin(session)) {
    redirect('/unauthorized');
  }

  const auction = await prisma.auction.findUnique({
    where: { id: BigInt(id) },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          images: true,
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
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      bids: {
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
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
  });

  if (!auction) {
    notFound();
  }

  // Serialize auction
  const serializedAuction = {
    id: auction.id.toString(),
    title: auction.title,
    description: auction.description,
    category: auction.category,
    currentBid: auction.currentBid.toString(),
    startPrice: auction.startPrice.toString(),
    reservePrice: auction.reservePrice?.toString() || null,
    minIncrement: auction.minIncrement.toString(),
    startAt: auction.startAt,
    endAt: auction.endAt,
    status: auction.status,
    autoExtend: auction.autoExtend,
    extendMinutes: auction.extendMinutes,
    views: auction.views,
    watchers: auction.watchers,
    product: auction.product
      ? {
          id: auction.product.id.toString(),
          title: auction.product.title,
          images: auction.product.images,
        }
      : null,
    store: {
      id: auction.store.id.toString(),
      name: auction.store.name,
      seller: {
        user: {
          id: auction.store.seller.user.id.toString(),
          name: auction.store.seller.user.name,
          email: auction.store.seller.user.email,
        },
      },
    },
    createdAt: auction.createdAt,
    updatedAt: auction.updatedAt,
  };

  const serializedBids = auction.bids.map((bid) => ({
    id: bid.id.toString(),
    amount: bid.amount.toString(),
    isAuto: bid.isAuto,
    createdAt: bid.createdAt,
    client: {
      user: {
        id: bid.client.user.id.toString(),
        name: bid.client.user.name,
        email: bid.client.user.email,
      },
    },
  }));

  return (
    <Container size="xl" py="md">
      <Group mb="lg">
        <Button
          component={Link}
          href="/admin-dashboard/auctions"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Auctions
        </Button>
      </Group>

      <Stack gap="lg">
        <AuctionDetailCard auction={serializedAuction} />
        <BidHistoryTable bids={serializedBids} currentBid={serializedAuction.currentBid} />
      </Stack>
    </Container>
  );
}
