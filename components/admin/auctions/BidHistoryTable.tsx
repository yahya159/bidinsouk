'use client';

import { Table, Badge, Text, Stack, Paper, Title } from '@mantine/core';
import { IconTrophy } from '@tabler/icons-react';

interface Bid {
  id: string;
  amount: string;
  isAuto: boolean;
  createdAt: Date;
  client: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface BidHistoryTableProps {
  bids: Bid[];
  currentBid: string;
}

export function BidHistoryTable({ bids, currentBid }: BidHistoryTableProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const isWinningBid = (bid: Bid, index: number) => {
    return index === 0 && parseFloat(bid.amount) === parseFloat(currentBid);
  };

  if (bids.length === 0) {
    return (
      <Paper p="md">
        <Title order={4} mb="md">
          Bid History
        </Title>
        <Text c="dimmed" ta="center">
          No bids yet
        </Text>
      </Paper>
    );
  }

  return (
    <Paper p="md">
      <Title order={4} mb="md">
        Bid History ({bids.length} {bids.length === 1 ? 'bid' : 'bids'})
      </Title>
      <Stack gap="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Bidder</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Time</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bids.map((bid, index) => {
              const winning = isWinningBid(bid, index);
              return (
                <Table.Tr
                  key={bid.id}
                  style={{
                    backgroundColor: winning ? 'var(--mantine-color-green-0)' : undefined,
                  }}
                >
                  <Table.Td>
                    <Text size="sm" fw={winning ? 600 : 400}>
                      {bid.client.user.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {bid.client.user.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={winning ? 600 : 400}>
                      {formatCurrency(bid.amount)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={bid.isAuto ? 'blue' : 'gray'}>
                      {bid.isAuto ? 'Auto' : 'Manual'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(bid.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {winning && (
                      <Badge
                        variant="light"
                        color="green"
                        leftSection={<IconTrophy size={14} />}
                      >
                        Winning
                      </Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Stack>
    </Paper>
  );
}
