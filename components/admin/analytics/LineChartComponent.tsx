'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMantineTheme, Paper } from '@mantine/core';

interface LineChartComponentProps {
  data: Array<Record<string, any>>;
  xKey: string;
  lines: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  height?: number;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any) => string;
}

export function LineChartComponent({
  data,
  xKey,
  lines,
  height = 300,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: LineChartComponentProps) {
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
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
