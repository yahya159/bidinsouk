'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMantineTheme, Paper } from '@mantine/core';

interface AreaChartComponentProps {
  data: Array<Record<string, any>>;
  xKey: string;
  areas: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  height?: number;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any) => string;
  stacked?: boolean;
}

export function AreaChartComponent({
  data,
  xKey,
  areas,
  height = 300,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  stacked = false,
}: AreaChartComponentProps) {
  const theme = useMantineTheme();

  const defaultColors = [
    theme.colors.blue[6],
    theme.colors.green[6],
    theme.colors.orange[6],
    theme.colors.violet[6],
    theme.colors.red[6],
  ];

  return (
    <Paper p="md" withBorder>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {areas.map((area, index) => {
              const color = area.color || defaultColors[index % defaultColors.length];
              return (
                <linearGradient key={area.key} id={`color${area.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.gray[3]} />
          <XAxis
            dataKey={xKey}
            stroke={theme.colors.gray[6]}
            tickFormatter={formatXAxis}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={theme.colors.gray[6]}
            tickFormatter={formatYAxis}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.white,
              border: `1px solid ${theme.colors.gray[3]}`,
              borderRadius: theme.radius.sm,
            }}
            formatter={formatTooltip}
          />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
            }}
          />
          {areas.map((area, index) => {
            const color = area.color || defaultColors[index % defaultColors.length];
            return (
              <Area
                key={area.key}
                type="monotone"
                dataKey={area.key}
                name={area.name}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${area.key})`}
                stackId={stacked ? '1' : undefined}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}
