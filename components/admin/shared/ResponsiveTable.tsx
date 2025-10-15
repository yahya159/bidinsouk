'use client';

import { Table, ScrollArea, Card, Stack, Text, Group, Badge } from '@mantine/core';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveTableProps {
  children: React.ReactNode;
  minWidth?: number;
}

export function ResponsiveTable({ children, minWidth = 800 }: ResponsiveTableProps) {
  const { isSmallScreen } = useResponsive();

  if (isSmallScreen) {
    return (
      <ScrollArea>
        <Table miw={minWidth}>{children}</Table>
      </ScrollArea>
    );
  }

  return <Table>{children}</Table>;
}

interface MobileCardListProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function MobileCardList<T>({ data, renderCard, emptyMessage = 'No items found' }: MobileCardListProps<T>) {
  if (data.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          {emptyMessage}
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      {data.map((item, index) => (
        <Card key={index} shadow="sm" padding="md" radius="md" withBorder>
          {renderCard(item)}
        </Card>
      ))}
    </Stack>
  );
}

interface ResponsiveDataDisplayProps<T> {
  data: T[];
  tableView: React.ReactNode;
  renderMobileCard: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function ResponsiveDataDisplay<T>({
  data,
  tableView,
  renderMobileCard,
  emptyMessage,
}: ResponsiveDataDisplayProps<T>) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <MobileCardList data={data} renderCard={renderMobileCard} emptyMessage={emptyMessage} />;
  }

  return <>{tableView}</>;
}
