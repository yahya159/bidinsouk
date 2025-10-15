'use client';

import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Avatar,
  Button,
  Divider,
  Grid,
  Paper,
  Title,
  Image,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTrash,
  IconBan,
  IconEye,
} from '@tabler/icons-react';
import { AbuseStatus } from '@prisma/client';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

interface Reporter {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
}

interface ReportedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

interface TargetInfo {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  status?: string;
  images?: any;
  store?: {
    name: string;
    seller: {
      user: ReportedUser;
    };
  };
}

interface Report {
  id: string;
  reporter: Reporter;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: AbuseStatus;
  createdAt: string;
  targetInfo?: TargetInfo | null;
  reportedUser?: ReportedUser | null;
}

interface ReportDetailCardProps {
  report: Report;
  onStatusUpdate?: (status: AbuseStatus, action?: string) => Promise<void>;
}

export function ReportDetailCard({ report, onStatusUpdate }: ReportDetailCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const getStatusBadgeColor = (status: AbuseStatus) => {
    switch (status) {
      case 'OPEN':
        return 'red';
      case 'REVIEWING':
        return 'yellow';
      case 'RESOLVED':
        return 'green';
      case 'REJECTED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAction = async (status: AbuseStatus, action?: string) => {
    if (!onStatusUpdate) return;

    setLoading(true);
    try {
      await onStatusUpdate(status, action);
      notifications.show({
        title: 'Success',
        message: 'Report updated successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update report',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTargetImages = () => {
    if (!report.targetInfo?.images) return [];
    
    try {
      const images = typeof report.targetInfo.images === 'string' 
        ? JSON.parse(report.targetInfo.images)
        : report.targetInfo.images;
      
      return Array.isArray(images) ? images : [];
    } catch {
      return [];
    }
  };

  const viewTarget = () => {
    if (report.targetType === 'Product') {
      router.push(`/admin-dashboard/products/${report.targetId}`);
    } else if (report.targetType === 'Auction') {
      router.push(`/admin-dashboard/auctions/${report.targetId}`);
    } else if (report.targetType === 'User') {
      router.push(`/admin-dashboard/users/${report.targetId}`);
    }
  };

  return (
    <Stack gap="md">
      {/* Report Header */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconAlertTriangle size={24} color="red" />
            <Title order={3}>Abuse Report #{report.id}</Title>
          </Group>
          <Badge color={getStatusBadgeColor(report.status)} size="lg" variant="filled">
            {report.status}
          </Badge>
        </Group>

        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed" mb={4}>
              Report Date
            </Text>
            <Text size="sm" fw={500}>
              {formatDate(report.createdAt)}
            </Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed" mb={4}>
              Report Type
            </Text>
            <Badge variant="light" color="blue">
              {report.targetType}
            </Badge>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Reporter Information */}
      <Card withBorder>
        <Title order={4} mb="md">
          Reporter Information
        </Title>
        <Group>
          <Avatar src={report.reporter.avatarUrl} size="lg" radius="xl">
            {report.reporter.name.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Text fw={500}>{report.reporter.name}</Text>
            <Text size="sm" c="dimmed">
              {report.reporter.email}
            </Text>
            {report.reporter.phone && (
              <Text size="sm" c="dimmed">
                {report.reporter.phone}
              </Text>
            )}
            <Text size="xs" c="dimmed" mt={4}>
              Member since {formatDate(report.reporter.createdAt)}
            </Text>
          </div>
          <Button
            variant="light"
            size="sm"
            onClick={() => router.push(`/admin-dashboard/users/${report.reporter.id}`)}
          >
            View Profile
          </Button>
        </Group>
      </Card>

      {/* Report Details */}
      <Card withBorder>
        <Title order={4} mb="md">
          Report Details
        </Title>
        <Stack gap="md">
          <div>
            <Text size="sm" c="dimmed" mb={4}>
              Reason
            </Text>
            <Text fw={500}>{report.reason}</Text>
          </div>
          {report.details && (
            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Additional Details
              </Text>
              <Paper p="md" withBorder bg="gray.0">
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {report.details}
                </Text>
              </Paper>
            </div>
          )}
        </Stack>
      </Card>

      {/* Reported Content */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Reported Content</Title>
          <Button
            variant="light"
            size="sm"
            leftSection={<IconEye size={16} />}
            onClick={viewTarget}
          >
            View Full Details
          </Button>
        </Group>

        {report.targetInfo ? (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed" mb={4}>
                {report.targetType} Title/Name
              </Text>
              <Text fw={500}>
                {report.targetInfo.title || report.targetInfo.name || 'N/A'}
              </Text>
            </div>

            {report.targetInfo.description && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Description
                </Text>
                <Paper p="md" withBorder bg="gray.0">
                  <Text size="sm" lineClamp={3}>
                    {report.targetInfo.description}
                  </Text>
                </Paper>
              </div>
            )}

            {report.targetInfo.status && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Current Status
                </Text>
                <Badge variant="light">{report.targetInfo.status}</Badge>
              </div>
            )}

            {getTargetImages().length > 0 && (
              <div>
                <Text size="sm" c="dimmed" mb={8}>
                  Images
                </Text>
                <Group gap="sm">
                  {getTargetImages().slice(0, 4).map((img: string, idx: number) => (
                    <Image
                      key={idx}
                      src={img}
                      alt={`Image ${idx + 1}`}
                      w={100}
                      h={100}
                      fit="cover"
                      radius="md"
                    />
                  ))}
                </Group>
              </div>
            )}
          </Stack>
        ) : (
          <Text c="dimmed" size="sm">
            Content not found or has been deleted
          </Text>
        )}
      </Card>

      {/* Reported User Information */}
      {report.reportedUser && (
        <Card withBorder>
          <Title order={4} mb="md">
            Reported User
          </Title>
          <Group>
            <Avatar src={report.reportedUser.avatarUrl} size="lg" radius="xl">
              {report.reportedUser.name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text fw={500}>{report.reportedUser.name}</Text>
              <Text size="sm" c="dimmed">
                {report.reportedUser.email}
              </Text>
              {report.reportedUser.phone && (
                <Text size="sm" c="dimmed">
                  {report.reportedUser.phone}
                </Text>
              )}
            </div>
            <Button
              variant="light"
              size="sm"
              onClick={() => router.push(`/admin-dashboard/users/${report.reportedUser?.id}`)}
            >
              View Profile
            </Button>
          </Group>
        </Card>
      )}

      {/* Action Buttons */}
      {report.status !== 'RESOLVED' && report.status !== 'REJECTED' && (
        <Card withBorder>
          <Title order={4} mb="md">
            Actions
          </Title>
          <Stack gap="sm">
            <Group grow>
              <Button
                color="yellow"
                leftSection={<IconAlertTriangle size={16} />}
                onClick={() => handleAction('REVIEWING')}
                loading={loading}
                disabled={report.status === 'REVIEWING'}
              >
                Mark as Reviewing
              </Button>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={() => handleAction('RESOLVED')}
                loading={loading}
              >
                Resolve (No Action)
              </Button>
            </Group>
            <Group grow>
              <Button
                color="red"
                variant="light"
                leftSection={<IconTrash size={16} />}
                onClick={() => handleAction('RESOLVED', 'remove')}
                loading={loading}
              >
                Remove Content
              </Button>
              <Button
                color="orange"
                variant="light"
                leftSection={<IconBan size={16} />}
                onClick={() => handleAction('RESOLVED', 'suspend')}
                loading={loading}
              >
                Suspend User
              </Button>
            </Group>
            <Button
              color="gray"
              variant="subtle"
              leftSection={<IconX size={16} />}
              onClick={() => handleAction('REJECTED')}
              loading={loading}
            >
              Dismiss Report
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
