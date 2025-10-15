'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Paper,
  Text,
  Badge,
  Stack,
  Pagination,
  Group,
  Loader,
  Center,
  Box,
  Code,
  Accordion,
} from '@mantine/core';
import { IconActivity } from '@tabler/icons-react';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

interface UserActivityLogsProps {
  userId: string;
}

export function UserActivityLogs({ userId }: UserActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [userId, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(
        `/api/admin/users/${userId}/activity?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'green';
    if (action.includes('UPDATE')) return 'blue';
    if (action.includes('DELETE')) return 'red';
    if (action.includes('LOGIN')) return 'cyan';
    return 'gray';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Loader size="lg" />
        </Center>
      </Paper>
    );
  }

  if (logs.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Stack align="center" gap="xs">
            <IconActivity size={48} stroke={1.5} color="gray" />
            <Text c="dimmed">No activity logs found</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder>
        <Box style={{ overflowX: 'auto' }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Action</Table.Th>
                <Table.Th>Entity</Table.Th>
                <Table.Th>IP Address</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Details</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Badge color={getActionBadgeColor(log.action)} variant="light">
                      {log.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {log.entity} #{log.entityId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Code>{log.ipAddress || 'N/A'}</Code>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDate(log.createdAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <Accordion variant="contained">
                        <Accordion.Item value="metadata">
                          <Accordion.Control>View Metadata</Accordion.Control>
                          <Accordion.Panel>
                            <Code block>
                              {JSON.stringify(log.metadata, null, 2)}
                            </Code>
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    ) : (
                      <Text size="sm" c="dimmed">
                        -
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>

      {totalPages > 1 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} logs
          </Text>
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Group>
      )}
    </Stack>
  );
}
