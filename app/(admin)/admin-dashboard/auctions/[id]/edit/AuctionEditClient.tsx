'use client';

import { Container, Title, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuctionForm } from '@/components/admin/auctions/AuctionForm';

interface AuctionEditClientProps {
  auction: {
    id: string;
    title: string;
    description: string;
    category: string;
    productId: string;
    storeId: string;
    startPrice: number;
    reservePrice: number | null;
    minIncrement: number;
    startAt: Date;
    endAt: Date;
    autoExtend: boolean;
    extendMinutes: number;
  };
}

export function AuctionEditClient({ auction }: AuctionEditClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/admin-dashboard/auctions/${auction.id}`);
  };

  return (
    <Container size="md" py="md">
      <Group mb="lg">
        <Button
          component={Link}
          href={`/admin-dashboard/auctions/${auction.id}`}
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Auction
        </Button>
      </Group>

      <Title order={2} mb="lg">
        Edit Auction
      </Title>

      <AuctionForm
        initialData={auction}
        auctionId={auction.id}
        onSuccess={handleSuccess}
      />
    </Container>
  );
}
