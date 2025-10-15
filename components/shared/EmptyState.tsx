import { Center, Stack, Title, Text } from '@mantine/core';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  size = 'md' 
}: EmptyStateProps) {
  const iconSize = size === 'sm' ? 48 : size === 'lg' ? 80 : 64;
  const spacing = size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg';
  const padding = size === 'sm' ? 40 : size === 'lg' ? 80 : 60;

  return (
    <Center py={padding}>
      <Stack align="center" gap={spacing}>
        <Icon 
          size={iconSize} 
          color="var(--mantine-color-gray-4)" 
          strokeWidth={1} 
        />
        <Stack align="center" gap="xs">
          <Title 
            order={size === 'sm' ? 4 : size === 'lg' ? 2 : 3} 
            c="dimmed"
            ta="center"
          >
            {title}
          </Title>
          {description && (
            <Text 
              size={size === 'sm' ? 'xs' : 'sm'} 
              c="dimmed" 
              ta="center"
              maw={400}
            >
              {description}
            </Text>
          )}
        </Stack>
        {action && action}
      </Stack>
    </Center>
  );
}

