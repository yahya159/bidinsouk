'use client';

import {
  Card,
  Text,
  Stack,
  Group,
  Badge,
  Code,
  Divider,
  Title,
  Box,
  Grid,
  Paper,
  JsonInput,
} from '@mantine/core';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  diff: any;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
}

interface LogDetailCardProps {
  log: ActivityLog;
}

// Get badge color based on action type
function getActionColor(action: string): string {
  if (action.includes('CREATED')) return 'green';
  if (action.includes('UPDATED')) return 'blue';
  if (action.includes('DELETED')) return 'red';
  if (action.includes('APPROVED')) return 'teal';
  if (action.includes('REJECTED')) return 'orange';
  if (action.includes('SUSPENDED')) return 'red';
  if (action.includes('ACTIVATED')) return 'green';
  if (action.includes('LOGIN')) return 'cyan';
  if (action.includes('LOGOUT')) return 'gray';
  return 'gray';
}

// Format action name for display
function formatActionName(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

// Get entity link based on entity type
function getEntityLink(entity: string, entityId: string): string | null {
  const entityLower = entity.toLowerCase();
  
  if (entityLower === 'user') {
    return `/admin-dashboard/users/${entityId}`;
  }
  if (entityLower === 'product') {
    return `/admin-dashboard/products/${entityId}`;
  }
  if (entityLower === 'auction') {
    return `/admin-dashboard/auctions/${entityId}`;
  }
  if (entityLower === 'order') {
    return `/admin-dashboard/orders/${entityId}`;
  }
  if (entityLower === 'store') {
    return `/admin-dashboard/stores/${entityId}`;
  }
  
  return null;
}

// Parse user agent to extract browser and OS info
function parseUserAgent(userAgent: string): { browser: string; os: string } {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return { browser, os };
}

export function LogDetailCard({ log }: LogDetailCardProps) {
  const entityLink = getEntityLink(log.entity, log.entityId);
  const userAgentInfo = log.userAgent ? parseUserAgent(log.userAgent) : null;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Group justify="space-between" mb="xs">
            <Title order={3}>Activity Log Details</Title>
            <Badge color={getActionColor(log.action)} size="lg">
              {formatActionName(log.action)}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Log ID: {log.id}
          </Text>
        </div>

        <Divider />

        {/* Timestamp */}
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Timestamp
            </Text>
            <Text size="lg" fw={600}>
              {new Date(log.timestamp).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'long',
              })}
            </Text>
            <Text size="sm" c="dimmed">
              {formatDistanceToNow(new Date(log.timestamp), {
                addSuffix: true,
              })}
            </Text>
          </Stack>
        </Paper>

        {/* Actor Information */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Actor Information
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Name
                  </Text>
                  <Link
                    href={`/admin-dashboard/users/${log.actorId}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Text size="sm" fw={500} c="blue" style={{ cursor: 'pointer' }}>
                      {log.actorName}
                    </Text>
                  </Link>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Email
                  </Text>
                  <Text size="sm">{log.actorEmail}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Role
                  </Text>
                  <Badge variant="light">{log.actorRole}</Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Actor ID
                  </Text>
                  <Text size="sm" ff="monospace">
                    {log.actorId}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Entity Information */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Entity Information
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Entity Type
                  </Text>
                  <Badge variant="outline">{log.entity}</Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Entity ID
                  </Text>
                  {entityLink ? (
                    <Link href={entityLink} style={{ textDecoration: 'none' }}>
                      <Text
                        size="sm"
                        ff="monospace"
                        c="blue"
                        style={{ cursor: 'pointer' }}
                      >
                        {log.entityId}
                      </Text>
                    </Link>
                  ) : (
                    <Text size="sm" ff="monospace">
                      {log.entityId}
                    </Text>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Request Information */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Request Information
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    IP Address
                  </Text>
                  <Text size="sm" ff="monospace">
                    {log.ipAddress || 'N/A'}
                  </Text>
                </Stack>
              </Grid.Col>
              {userAgentInfo && (
                <>
                  <Grid.Col span={3}>
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">
                        Browser
                      </Text>
                      <Text size="sm">{userAgentInfo.browser}</Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">
                        Operating System
                      </Text>
                      <Text size="sm">{userAgentInfo.os}</Text>
                    </Stack>
                  </Grid.Col>
                </>
              )}
            </Grid>
            {log.userAgent && (
              <Box mt="xs">
                <Text size="xs" c="dimmed" mb={4}>
                  Full User Agent
                </Text>
                <Code block>{log.userAgent}</Code>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Metadata */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                Additional Metadata
              </Text>
              <JsonInput
                value={JSON.stringify(log.metadata, null, 2)}
                readOnly
                autosize
                minRows={4}
                maxRows={15}
                formatOnBlur
              />
            </Stack>
          </Paper>
        )}

        {/* Before/After Diff */}
        {log.diff && Object.keys(log.diff).length > 0 && (
          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                Changes (Before/After)
              </Text>
              <JsonInput
                value={JSON.stringify(log.diff, null, 2)}
                readOnly
                autosize
                minRows={4}
                maxRows={15}
                formatOnBlur
              />
            </Stack>
          </Paper>
        )}
      </Stack>
    </Card>
  );
}
