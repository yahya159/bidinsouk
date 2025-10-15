'use client';

import { Grid, Title, Text, Group, ThemeIcon } from '@mantine/core';
import { IconUsers, IconUserPlus, IconUserCheck, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { LineChartComponent } from './LineChartComponent';
import { PieChartComponent } from './PieChartComponent';
import { StatsCard } from '../shared/StatsCard';
import { format } from 'date-fns';

interface UserAnalyticsData {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  roleDistribution: {
    CLIENT: number;
    VENDOR: number;
    ADMIN: number;
  };
  registrationTrend: number;
  activeUsersTrend: number;
  engagementRate: number;
  dailyRegistrations: Array<{
    date: Date;
    count: number;
  }>;
}

interface UserAnalyticsProps {
  data: UserAnalyticsData;
}

export function UserAnalytics({ data }: UserAnalyticsProps) {
  // Prepare data for registration trends chart
  const registrationChartData = data.dailyRegistrations.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    registrations: item.count,
  }));

  // Prepare data for role distribution pie chart
  const roleChartData = [
    { name: 'Clients', value: data.roleDistribution.CLIENT },
    { name: 'Vendors', value: data.roleDistribution.VENDOR },
    { name: 'Admins', value: data.roleDistribution.ADMIN },
  ];

  return (
    <div>
      <Title order={3} mb="md">User Analytics</Title>

      {/* Stats Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Users"
            value={data.totalUsers.toLocaleString()}
            icon={<IconUsers size={20} />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="New Users"
            value={data.newUsers.toLocaleString()}
            icon={<IconUserPlus size={20} />}
            color="green"
            trend={{
              value: data.registrationTrend,
              label: 'vs previous period',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Active Users"
            value={data.activeUsers.toLocaleString()}
            icon={<IconUserCheck size={20} />}
            color="violet"
            trend={{
              value: data.activeUsersTrend,
              label: 'vs previous period',
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Engagement Rate"
            value={`${data.engagementRate.toFixed(1)}%`}
            icon={
              data.engagementRate >= 50 ? (
                <IconTrendingUp size={20} />
              ) : (
                <IconTrendingDown size={20} />
              )
            }
            color={data.engagementRate >= 50 ? 'teal' : 'orange'}
          />
        </Grid.Col>
      </Grid>

      {/* Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={4} mb="sm">Registration Trends</Title>
          <LineChartComponent
            data={registrationChartData}
            xKey="date"
            lines={[
              { key: 'registrations', name: 'New Registrations' },
            ]}
            height={350}
            formatTooltip={(value) => `${value} users`}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Title order={4} mb="sm">Role Distribution</Title>
          <PieChartComponent
            data={roleChartData}
            height={350}
            formatTooltip={(value) => `${value} users`}
          />
        </Grid.Col>
      </Grid>

      {/* User Engagement Metrics */}
      <Grid mt="xl">
        <Grid.Col span={12}>
          <Title order={4} mb="md">User Engagement Metrics</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconUsers size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Clients</Text>
                  <Text size="lg" fw={600}>{data.roleDistribution.CLIENT.toLocaleString()}</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="green">
                  <IconUsers size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Vendors</Text>
                  <Text size="lg" fw={600}>{data.roleDistribution.VENDOR.toLocaleString()}</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="violet">
                  <IconUsers size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Admins</Text>
                  <Text size="lg" fw={600}>{data.roleDistribution.ADMIN.toLocaleString()}</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Group>
                <ThemeIcon size="lg" variant="light" color="orange">
                  <IconUserCheck size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Active Rate</Text>
                  <Text size="lg" fw={600}>{data.engagementRate.toFixed(1)}%</Text>
                </div>
              </Group>
            </Grid.Col>
          </Grid>
        </Grid.Col>
      </Grid>
    </div>
  );
}
