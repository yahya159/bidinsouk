import { Table, Skeleton } from '@mantine/core';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 8 }: TableSkeletonProps) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {Array.from({ length: cols }).map((_, i) => (
            <Table.Th key={`header-${i}`}>
              <Skeleton height={16} />
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <Table.Tr key={`row-${i}`}>
            {Array.from({ length: cols }).map((_, j) => (
              <Table.Td key={`cell-${i}-${j}`}>
                <Skeleton height={16} />
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

