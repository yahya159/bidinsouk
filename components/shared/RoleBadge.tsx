'use client'

import { Badge, Group } from '@mantine/core'

interface RoleBadgeProps {
  roles: string[]
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return 'red'
    case 'VENDOR':
      return 'blue'
    case 'CLIENT':
      return 'green'
    default:
      return 'gray'
  }
}

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return 'Administrateur'
    case 'VENDOR':
      return 'Vendeur'
    case 'CLIENT':
      return 'Client'
    default:
      return role
  }
}

export function RoleBadge({ roles, size = 'sm' }: RoleBadgeProps) {
  if (!roles || roles.length === 0) {
    return null
  }

  return (
    <Group gap="xs">
      {roles.map((role) => (
        <Badge key={role} color={getRoleColor(role)} size={size} variant="light">
          {getRoleLabel(role)}
        </Badge>
      ))}
    </Group>
  )
}

export default RoleBadge

