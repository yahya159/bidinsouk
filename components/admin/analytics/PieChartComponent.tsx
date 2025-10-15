'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMantineTheme, Paper } from '@mantine/core';

interface PieChartComponentProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  height?: number;
  formatTooltip?: (value: any) => string;
  colors?: string[];
}

export function PieChartComponent({
  data,
  height = 300,
  formatTooltip,
  colors,
}: PieChartComponentProps) {
  const theme = useMantineTheme();

  const defaultColors = colors || [
    theme.colors.blue[6],
    theme.colors.green[6],
    theme.colors.orange[6],
    theme.colors.violet[6],
    theme.colors.red[6],
    theme.colors.cyan[6],
    theme.colors.pink[6],
    theme.colors.grape[6],
  ];

  return (
    <Paper p="md" withBorder>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={defaultColors[index % defaultColors.length]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}
