'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMantineTheme, Paper } from '@mantine/core';

interface BarChartComponentProps {
  data: Array<Record<string, any>>;
  xKey: string;
  bars: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  height?: number;
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any) => string;
  layout?: 'horizontal' | 'vertical';
}

export function BarChartComponent({
  data,
  xKey,
  bars,
  height = 300,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  layout = 'horizontal',
}: BarChartComponentProps) {
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
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.gray[3]} />
          {layout === 'horizontal' ? (
            <>
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
            </>
          ) : (
            <>
              <XAxis
                type="number"
                stroke={theme.colors.gray[6]}
                tickFormatter={formatYAxis}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                stroke={theme.colors.gray[6]}
                tickFormatter={formatXAxis}
                style={{ fontSize: '12px' }}
              />
            </>
          )}
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
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || defaultColors[index % defaultColors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
