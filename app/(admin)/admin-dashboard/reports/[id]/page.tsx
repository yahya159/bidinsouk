'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Text,
  Breadcrumbs,
  Anchor,
  Loader,
  Center,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { ReportDetailCard } from '@/components/admin/reports/ReportDetailCard';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { AbuseStatus } from '@prisma/client';

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

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState<string>('');

  // Handle async params
  useEffect(() => {
    params.then(p => setReportId(p.id));
  }, [params]);

  const fetchReport = async () => {
    if (!reportId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports/${reportId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load report',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const handleStatusUpdate = async (status: AbuseStatus, action?: string) => {
    if (!reportId) return;
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      // Refresh report data
      await fetchReport();

      notifications.show({
        title: 'Success',
        message: 'Report updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/admin-dashboard' },
    { title: 'Reports', href: '/admin-dashboard/reports' },
    { title: `Report #${reportId}`, href: '#' },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      onClick={(e) => {
        if (item.href !== '#') {
          e.preventDefault();
          router.push(item.href);
        }
      }}
    >
      {item.title}
    </Anchor>
  ));

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Text size="xl" fw={500}>
            Report not found
          </Text>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/admin-dashboard/reports')}
          >
            Back to Reports
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>

        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={2}>Report Details</Title>
            <Text c="dimmed" size="sm">
              Review and take action on this abuse report
            </Text>
          </div>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/admin-dashboard/reports')}
          >
            Back to Reports
          </Button>
        </Group>

        {/* Report Detail Card */}
        <ReportDetailCard report={report} onStatusUpdate={handleStatusUpdate} />
      </Stack>
    </Container>
  );
}
