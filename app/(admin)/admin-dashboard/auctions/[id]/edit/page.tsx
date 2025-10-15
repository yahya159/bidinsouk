import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/admin/permissions';
import { prisma } from '@/lib/db/prisma';
import { AuctionEditClient } from '@/app/(admin)/admin-dashboard/auctions/[id]/edit/AuctionEditClient';

export default async function EditAuctionPage({
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
  });

  if (!auction) {
    notFound();
  }

  // Serialize auction
  const serializedAuction = {
    id: auction.id.toString(),
    title: auction.title,
    description: auction.description || '',
    category: auction.category || '',
    productId: auction.productId?.toString() || '',
    storeId: auction.storeId.toString(),
    startPrice: parseFloat(auction.startPrice.toString()),
    reservePrice: auction.reservePrice ? parseFloat(auction.reservePrice.toString()) : null,
    minIncrement: parseFloat(auction.minIncrement.toString()),
    startAt: auction.startAt,
    endAt: auction.endAt,
    autoExtend: auction.autoExtend,
    extendMinutes: auction.extendMinutes,
  };

  return <AuctionEditClient auction={serializedAuction} />;
}
