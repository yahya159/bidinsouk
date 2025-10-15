'use client';

import { useState } from 'react';
import {
  Table,
  Checkbox,
  TextInput,
  Pagination,
  Group,
  Text,
  ActionIcon,
  Box,
  Stack,
  Paper,
} from '@mantine/core';
import { IconSearch, IconSortAscending, IconSortDescending } from '@tabler/icons-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onSearch?: (query: string) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSort,
  onSearch,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  loading = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (columnKey: string) => {
    const newDirection =
      sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    onSort?.(columnKey, newDirection);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(data.map((row) => row.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <Stack gap="md">
      {onSearch && (
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.currentTarget.value)}
          style={{ maxWidth: 400 }}
        />
      )}

      <Paper withBorder>
        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover striped>
            <Table.Thead>
              <Table.Tr>
                {selectable && (
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                    />
                  </Table.Th>
                )}
                {columns.map((column) => (
                  <Table.Th
                    key={column.key}
                    style={{
                      width: column.width,
                      cursor: column.sortable ? 'pointer' : 'default',
                    }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600}>
                        {column.label}
                      </Text>
                      {column.sortable && sortColumn === column.key && (
                        <ActionIcon variant="transparent" size="xs">
                          {sortDirection === 'asc' ? (
                            <IconSortAscending size={14} />
                          ) : (
                            <IconSortDescending size={14} />
                          )}
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (selectable ? 1 : 0)}>
                    <Text ta="center" c="dimmed" py="xl">
                      Loading...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (selectable ? 1 : 0)}>
                    <Text ta="center" c="dimmed" py="xl">
                      {emptyMessage}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                data.map((row) => (
                  <Table.Tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <Table.Td>
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row.id, e.currentTarget.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Table.Td>
                    )}
                    {columns.map((column) => {
                      const value = (row as any)[column.key];
                      return (
                        <Table.Td key={column.key}>
                          {column.render ? column.render(value, row) : value}
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {totalPages > 1 && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} results
          </Text>
          <Pagination
            total={totalPages}
            value={page}
            onChange={onPageChange}
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}
